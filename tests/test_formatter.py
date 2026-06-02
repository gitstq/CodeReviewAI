"""
格式化模块测试
"""
import json
import pytest

from codereviewai.formatter import ReportFormatter
from codereviewai.reviewer import ReviewReport, FileReviewResult
from codereviewai.providers.base import ReviewResult


class TestReportFormatter:
    """测试报告格式化器"""

    @pytest.fixture
    def sample_report(self):
        """创建示例报告"""
        return ReviewReport(
            total_files=2,
            reviewed_files=2,
            skipped_files=0,
            error_files=0,
            overall_summary="代码质量良好",
            overall_score=85,
            file_results=[
                FileReviewResult(
                    file_path="test.py",
                    change_type="modified",
                    review=ReviewResult(
                        summary="代码质量良好",
                        score=85,
                        issues=[
                            {"severity": "warning", "description": "变量命名不清晰"}
                        ],
                        suggestions=["使用更具描述性的变量名"]
                    ),
                    status="success"
                )
            ]
        )

    def test_format_markdown(self, sample_report):
        """测试Markdown格式化"""
        formatter = ReportFormatter()
        result = formatter.format(sample_report, "markdown")

        assert "# 🔍 代码审查报告" in result
        assert "test.py" in result
        assert "85/100" in result
        assert "代码质量良好" in result

    def test_format_json(self, sample_report):
        """测试JSON格式化"""
        formatter = ReportFormatter()
        result = formatter.format(sample_report, "json")

        data = json.loads(result)
        assert data["total_files"] == 2
        assert data["reviewed_files"] == 2
        assert data["overall_score"] == 85
        assert "generated_at" in data

    def test_format_unsupported(self, sample_report):
        """测试不支持的格式"""
        formatter = ReportFormatter()

        with pytest.raises(ValueError, match="不支持的格式"):
            formatter.format(sample_report, "xml")

    def test_empty_report(self):
        """测试空报告"""
        report = ReviewReport(
            total_files=0,
            reviewed_files=0,
            skipped_files=0,
            error_files=0,
            overall_summary="没有需要审查的代码变更",
            overall_score=None
        )

        formatter = ReportFormatter()
        result = formatter.format(report, "markdown")

        assert "没有需要审查的代码变更" in result
