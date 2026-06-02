"""
输出格式化模块
"""
import json
from typing import Dict, Any, List
from datetime import datetime

from .reviewer import ReviewReport, FileReviewResult


class ReportFormatter:
    """报告格式化器"""

    def format(self, report: ReviewReport, format_type: str) -> str:
        """
        格式化报告

        Args:
            report: 审查报告
            format_type: 输出格式 (markdown, json)

        Returns:
            格式化后的报告字符串
        """
        if format_type == "json":
            return self._format_json(report)
        elif format_type == "markdown":
            return self._format_markdown(report)
        else:
            raise ValueError(f"不支持的格式: {format_type}")

    def _format_json(self, report: ReviewReport) -> str:
        """格式化为JSON"""
        data = report.to_dict()
        data["generated_at"] = datetime.now().isoformat()
        return json.dumps(data, ensure_ascii=False, indent=2)

    def _format_markdown(self, report: ReviewReport) -> str:
        """格式化为Markdown"""
        lines = []

        # 标题
        lines.append("# 🔍 代码审查报告")
        lines.append("")
        lines.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")

        # 总体摘要
        lines.append("## 📊 总体概况")
        lines.append("")
        lines.append(f"- **审查文件数**: {report.reviewed_files}/{report.total_files}")
        lines.append(f"- **跳过文件数**: {report.skipped_files}")
        lines.append(f"- **错误文件数**: {report.error_files}")

        if report.overall_score is not None:
            score_emoji = "🟢" if report.overall_score >= 80 else "🟡" if report.overall_score >= 60 else "🔴"
            lines.append(f"- **总体评分**: {score_emoji} {report.overall_score}/100")

        lines.append("")
        lines.append(f"**总体评价**: {report.overall_summary}")
        lines.append("")

        # 详细结果
        if report.file_results:
            lines.append("## 📝 详细审查结果")
            lines.append("")

            for result in report.file_results:
                lines.extend(self._format_file_result(result))
                lines.append("")

        # 汇总
        lines.append("---")
        lines.append("")
        lines.append("*由 CodeReviewAI 生成*")

        return "\n".join(lines)

    def _format_file_result(self, result: FileReviewResult) -> List[str]:
        """格式化单个文件结果"""
        lines = []

        # 文件标题
        change_type_emoji = {
            "added": "➕",
            "modified": "✏️",
            "deleted": "🗑️",
            "renamed": "📛"
        }.get(result.change_type, "📄")

        lines.append(f"### {change_type_emoji} `{result.file_path}`")
        lines.append("")

        if result.status == "error":
            lines.append(f"⚠️ **错误**: {result.error_message}")
            return lines

        if result.status == "skipped":
            lines.append(f"⏭️ **跳过**: {result.review.summary if result.review else 'N/A'}")
            return lines

        if not result.review:
            lines.append("❓ 无审查结果")
            return lines

        # 评分
        if result.review.score is not None:
            score_emoji = "🟢" if result.review.score >= 80 else "🟡" if result.review.score >= 60 else "🔴"
            lines.append(f"**评分**: {score_emoji} {result.review.score}/100")
            lines.append("")

        # 摘要
        lines.append(f"**摘要**: {result.review.summary}")
        lines.append("")

        # 问题列表
        if result.review.issues:
            lines.append("#### ⚠️ 发现的问题")
            lines.append("")

            for i, issue in enumerate(result.review.issues, 1):
                severity = issue.get("severity", "warning")
                emoji = {"critical": "🔴", "warning": "🟡", "suggestion": "💡", "error": "❌"}.get(severity, "⚠️")
                desc = issue.get("description", "N/A")
                lines.append(f"{i}. {emoji} **{severity.upper()}**: {desc}")

            lines.append("")

        # 建议
        if result.review.suggestions:
            lines.append("#### 💡 改进建议")
            lines.append("")

            for i, suggestion in enumerate(result.review.suggestions, 1):
                lines.append(f"{i}. {suggestion}")

            lines.append("")

        return lines
