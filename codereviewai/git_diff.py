"""
Git差异获取模块
"""
import os
import re
from pathlib import Path
from typing import List, Optional, Tuple
from dataclasses import dataclass
from git import Repo, InvalidGitRepositoryError


@dataclass
class FileChange:
    """文件变更"""
    path: str
    change_type: str  # 'A'=添加, 'M'=修改, 'D'=删除, 'R'=重命名
    diff_content: str
    old_path: Optional[str] = None


class GitDiffError(Exception):
    """Git差异错误"""
    pass


class GitDiffExtractor:
    """Git差异提取器"""

    def __init__(self, repo_path: str = "."):
        self.repo_path = repo_path
        self.repo = self._get_repo()

    def _get_repo(self) -> Repo:
        """获取Git仓库"""
        try:
            return Repo(self.repo_path, search_parent_directories=True)
        except InvalidGitRepositoryError:
            raise GitDiffError(f"无效的Git仓库: {self.repo_path}")

    def get_working_diff(self, staged: bool = False) -> List[FileChange]:
        """
        获取工作区变更

        Args:
            staged: 是否只获取已暂存的变更

        Returns:
            文件变更列表
        """
        changes = []

        if staged:
            diff_index = self.repo.index.diff("HEAD")
        else:
            diff_index = self.repo.index.diff(None)

        for diff_item in diff_index:
            change_type = diff_item.change_type
            file_path = diff_item.a_path or diff_item.b_path

            # 获取diff内容
            diff_content = diff_item.diff.decode("utf-8", errors="replace") if diff_item.diff else ""

            change = FileChange(
                path=file_path,
                change_type=self._normalize_change_type(change_type),
                diff_content=diff_content,
                old_path=diff_item.rename_from if change_type == "R" else None
            )
            changes.append(change)

        # 添加未跟踪的文件
        if not staged:
            untracked = self._get_untracked_files()
            changes.extend(untracked)

        return changes

    def get_commit_diff(self, commit_ref: str) -> List[FileChange]:
        """
        获取指定提交的变更

        Args:
            commit_ref: 提交引用（如 HEAD~1, abc123）

        Returns:
            文件变更列表
        """
        try:
            commit = self.repo.commit(commit_ref)
            parent = commit.parents[0] if commit.parents else None

            if parent:
                diff_index = parent.diff(commit)
            else:
                # 初始提交，与空树比较
                diff_index = commit.diff(git.NULL_TREE)

            changes = []
            for diff_item in diff_index:
                file_path = diff_item.b_path or diff_item.a_path
                diff_content = diff_item.diff.decode("utf-8", errors="replace") if diff_item.diff else ""

                change = FileChange(
                    path=file_path,
                    change_type=self._normalize_change_type(diff_item.change_type),
                    diff_content=diff_content
                )
                changes.append(change)

            return changes

        except Exception as e:
            raise GitDiffError(f"获取提交 {commit_ref} 的变更失败: {e}")

    def get_branch_diff(self, base_branch: str = "main") -> List[FileChange]:
        """
        获取当前分支与基础分支的差异

        Args:
            base_branch: 基础分支名称

        Returns:
            文件变更列表
        """
        try:
            # 确保基础分支存在
            if base_branch not in self.repo.heads:
                # 尝试origin
                if f"origin/{base_branch}" in self.repo.references:
                    base_branch = f"origin/{base_branch}"
                else:
                    raise GitDiffError(f"基础分支不存在: {base_branch}")

            base_commit = self.repo.references[base_branch].commit
            head_commit = self.repo.head.commit

            diff_index = base_commit.diff(head_commit)

            changes = []
            for diff_item in diff_index:
                file_path = diff_item.b_path or diff_item.a_path
                diff_content = diff_item.diff.decode("utf-8", errors="replace") if diff_item.diff else ""

                change = FileChange(
                    path=file_path,
                    change_type=self._normalize_change_type(diff_item.change_type),
                    diff_content=diff_content
                )
                changes.append(change)

            return changes

        except Exception as e:
            raise GitDiffError(f"获取分支差异失败: {e}")

    def get_commit_range_diff(self, commit_range: str) -> List[FileChange]:
        """
        获取提交范围的变更

        Args:
            commit_range: 提交范围（如 HEAD~3..HEAD）

        Returns:
            文件变更列表
        """
        try:
            commits = list(self.repo.iter_commits(commit_range))
            if not commits:
                return []

            # 获取范围的起始和结束提交
            oldest = commits[-1]
            newest = commits[0]

            # 获取oldest的父提交
            oldest_parent = oldest.parents[0] if oldest.parents else git.NULL_TREE

            diff_index = oldest_parent.diff(newest)

            changes = []
            for diff_item in diff_index:
                file_path = diff_item.b_path or diff_item.a_path
                diff_content = diff_item.diff.decode("utf-8", errors="replace") if diff_item.diff else ""

                change = FileChange(
                    path=file_path,
                    change_type=self._normalize_change_type(diff_item.change_type),
                    diff_content=diff_content
                )
                changes.append(change)

            return changes

        except Exception as e:
            raise GitDiffError(f"获取提交范围 {commit_range} 的变更失败: {e}")

    def _get_untracked_files(self) -> List[FileChange]:
        """获取未跟踪的文件"""
        changes = []
        untracked_files = self.repo.untracked_files

        for file_path in untracked_files:
            full_path = os.path.join(self.repo.working_dir, file_path)
            if os.path.isfile(full_path):
                try:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read()
                    # 创建完整的文件内容作为diff
                    diff_content = f"+{content.replace(chr(10), chr(10)+'+')}"

                    change = FileChange(
                        path=file_path,
                        change_type="A",
                        diff_content=diff_content
                    )
                    changes.append(change)
                except Exception:
                    # 跳过无法读取的文件
                    pass

        return changes

    def _normalize_change_type(self, change_type: str) -> str:
        """标准化变更类型"""
        type_map = {
            "A": "added",
            "M": "modified",
            "D": "deleted",
            "R": "renamed",
            "T": "modified",  # 文件类型变更
        }
        return type_map.get(change_type, "modified")

    def filter_changes(
        self,
        changes: List[FileChange],
        exclude_patterns: Optional[List[str]] = None,
        max_file_size: int = 100000
    ) -> List[FileChange]:
        """
        过滤变更

        Args:
            changes: 原始变更列表
            exclude_patterns: 排除模式列表
            max_file_size: 最大文件大小

        Returns:
            过滤后的变更列表
        """
        if exclude_patterns is None:
            exclude_patterns = []

        filtered = []
        for change in changes:
            # 检查排除模式
            if self._matches_patterns(change.path, exclude_patterns):
                continue

            # 检查文件大小
            if len(change.diff_content) > max_file_size:
                continue

            # 跳过二进制文件
            if self._is_binary_diff(change.diff_content):
                continue

            filtered.append(change)

        return filtered

    def _matches_patterns(self, path: str, patterns: List[str]) -> bool:
        """检查路径是否匹配模式"""
        import fnmatch
        for pattern in patterns:
            if fnmatch.fnmatch(path, pattern) or fnmatch.fnmatch(os.path.basename(path), pattern):
                return True
        return False

    def _is_binary_diff(self, diff_content: str) -> bool:
        """检查是否是二进制文件的diff"""
        # 简单的启发式检测
        if "Binary files" in diff_content[:100]:
            return True
        # 检查是否有大量不可打印字符
        if len(diff_content) > 0:
            non_printable = sum(1 for c in diff_content if ord(c) < 32 and c not in '\n\r\t')
            if non_printable / len(diff_content) > 0.1:
                return True
        return False

    def get_file_content_at_commit(self, file_path: str, commit_ref: str = "HEAD") -> Optional[str]:
        """获取文件在指定提交的内容"""
        try:
            commit = self.repo.commit(commit_ref)
            blob = commit.tree / file_path
            return blob.data_stream.read().decode("utf-8", errors="replace")
        except Exception:
            return None
