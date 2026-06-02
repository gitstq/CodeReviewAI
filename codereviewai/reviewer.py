"""
代码审查核心模块
"""
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, as_completed

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from .config import Config
from .git_diff import GitDiffExtractor, FileChange, GitDiffError
from .llm_client import LLMClient
from .providers.base import ReviewResult


@dataclass
class FileReviewResult:
    """单个文件的审查结果"""
    file_path: str
    change_type: str
    review: ReviewResult
    status: str = "success"  # success, error, skipped
    error_message: Optional[str] = None


@dataclass
class ReviewReport:
    """完整审查报告"""
    total_files: int
    reviewed_files: int
    skipped_files: int
    error_files: int
    file_results: List[FileReviewResult] = field(default_factory=list)
    overall_summary: Optional[str] = None
    overall_score: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "total_files": self.total_files,
            "reviewed_files": self.reviewed_files,
            "skipped_files": self.skipped_files,
            "error_files": self.error_files,
            "overall_summary": self.overall_summary,
            "overall_score": self.overall_score,
            "file_results": [
                {
                    "file_path": fr.file_path,
                    "change_type": fr.change_type,
                    "status": fr.status,
                    "error_message": fr.error_message,
                    "review": {
                        "summary": fr.review.summary if fr.review else None,
                        "score": fr.review.score if fr.review else None,
                        "issues": fr.review.issues if fr.review else [],
                        "suggestions": fr.review.suggestions if fr.review else []
                    }
                }
                for fr in self.file_results
            ]
        }


class CodeReviewer:
    """代码审查器"""

    def __init__(self, config: Config, console: Optional[Console] = None):
        self.config = config
        self.console = console or Console()
        self.llm_client = LLMClient(config)
        self.git_extractor = GitDiffExtractor()

    def review_working_directory(
        self,
        staged: bool = False,
        focus_areas: Optional[List[str]] = None
    ) -> ReviewReport:
        """
        审查工作目录

        Args:
            staged: 是否只审查已暂存的变更
            focus_areas: 审查重点领域

        Returns:
            审查报告
        """
        try:
            changes = self.git_extractor.get_working_diff(staged=staged)
            return self._review_changes(changes, focus_areas)
        except GitDiffError as e:
            return self._create_error_report(str(e))

    def review_commit(
        self,
        commit_ref: str,
        focus_areas: Optional[List[str]] = None
    ) -> ReviewReport:
        """
        审查指定提交

        Args:
            commit_ref: 提交引用
            focus_areas: 审查重点领域

        Returns:
            审查报告
        """
        try:
            changes = self.git_extractor.get_commit_diff(commit_ref)
            return self._review_changes(changes, focus_areas)
        except GitDiffError as e:
            return self._create_error_report(str(e))

    def review_branch(
        self,
        base_branch: str = "main",
        focus_areas: Optional[List[str]] = None
    ) -> ReviewReport:
        """
        审查分支差异

        Args:
            base_branch: 基础分支
            focus_areas: 审查重点领域

        Returns:
            审查报告
        """
        try:
            changes = self.git_extractor.get_branch_diff(base_branch)
            return self._review_changes(changes, focus_areas)
        except GitDiffError as e:
            return self._create_error_report(str(e))

    def review_commit_range(
        self,
        commit_range: str,
        focus_areas: Optional[List[str]] = None
    ) -> ReviewReport:
        """
        审查提交范围

        Args:
            commit_range: 提交范围
            focus_areas: 审查重点领域

        Returns:
            审查报告
        """
        try:
            changes = self.git_extractor.get_commit_range_diff(commit_range)
            return self._review_changes(changes, focus_areas)
        except GitDiffError as e:
            return self._create_error_report(str(e))

    def _review_changes(
        self,
        changes: List[FileChange],
        focus_areas: Optional[List[str]] = None
    ) -> ReviewReport:
        """审查变更列表"""
        # 过滤变更
        filtered_changes = self.git_extractor.filter_changes(
            changes,
            exclude_patterns=self.config.review.exclude_patterns,
            max_file_size=self.config.review.max_file_size
        )

        if not filtered_changes:
            return ReviewReport(
                total_files=0,
                reviewed_files=0,
                skipped_files=0,
                error_files=0,
                overall_summary="没有需要审查的代码变更",
                overall_score=None
            )

        # 使用focus_areas参数或配置中的值
        areas = focus_areas or self.config.review.focus_areas

        # 审查每个文件
        file_results = []
        reviewed_count = 0
        skipped_count = 0
        error_count = 0

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=self.console,
            transient=True
        ) as progress:
            task = progress.add_task(
                f"[cyan]正在审查 {len(filtered_changes)} 个文件...",
                total=len(filtered_changes)
            )

            for change in filtered_changes:
                progress.update(task, description=f"[cyan]审查: {change.path}")

                result = self._review_single_file(change, areas)
                file_results.append(result)

                if result.status == "success":
                    reviewed_count += 1
                elif result.status == "skipped":
                    skipped_count += 1
                else:
                    error_count += 1

                progress.advance(task)

        # 生成总体摘要
        overall_summary = self._generate_overall_summary(file_results)
        overall_score = self._calculate_overall_score(file_results)

        return ReviewReport(
            total_files=len(filtered_changes),
            reviewed_files=reviewed_count,
            skipped_files=skipped_count,
            error_files=error_count,
            file_results=file_results,
            overall_summary=overall_summary,
            overall_score=overall_score
        )

    def _review_single_file(
        self,
        change: FileChange,
        focus_areas: List[str]
    ) -> FileReviewResult:
        """审查单个文件"""
        # 跳过删除的文件
        if change.change_type == "deleted":
            return FileReviewResult(
                file_path=change.path,
                change_type=change.change_type,
                review=ReviewResult(
                    summary="文件已删除，跳过审查",
                    issues=[]
                ),
                status="skipped"
            )

        # 跳过空diff
        if not change.diff_content or not change.diff_content.strip():
            return FileReviewResult(
                file_path=change.path,
                change_type=change.change_type,
                review=ReviewResult(
                    summary="无代码变更内容",
                    issues=[]
                ),
                status="skipped"
            )

        try:
            review = self.llm_client.review_code(
                code_diff=change.diff_content,
                file_path=change.path,
                focus_areas=focus_areas
            )

            return FileReviewResult(
                file_path=change.path,
                change_type=change.change_type,
                review=review,
                status="success"
            )

        except Exception as e:
            return FileReviewResult(
                file_path=change.path,
                change_type=change.change_type,
                review=ReviewResult(
                    summary=f"审查失败: {str(e)}",
                    issues=[{"severity": "error", "description": str(e)}]
                ),
                status="error",
                error_message=str(e)
            )

    def _generate_overall_summary(self, file_results: List[FileReviewResult]) -> str:
        """生成总体摘要"""
        total_issues = sum(len(fr.review.issues) for fr in file_results if fr.review)
        critical_issues = sum(
            1 for fr in file_results
            if fr.review
            for issue in fr.review.issues
            if issue.get("severity") == "critical"
        )

        if critical_issues > 0:
            return f"发现 {total_issues} 个问题，其中 {critical_issues} 个严重问题需要立即处理"
        elif total_issues > 0:
            return f"发现 {total_issues} 个问题，建议根据优先级逐步改进"
        else:
            return "代码质量良好，未发现问题"

    def _calculate_overall_score(self, file_results: List[FileReviewResult]) -> Optional[int]:
        """计算总体评分"""
        scores = [
            fr.review.score
            for fr in file_results
            if fr.review and fr.review.score is not None
        ]

        if not scores:
            return None

        return int(sum(scores) / len(scores))

    def _create_error_report(self, error_message: str) -> ReviewReport:
        """创建错误报告"""
        return ReviewReport(
            total_files=0,
            reviewed_files=0,
            skipped_files=0,
            error_files=1,
            overall_summary=f"审查失败: {error_message}",
            overall_score=None
        )
