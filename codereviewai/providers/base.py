"""
LLM提供商基类
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass


@dataclass
class ReviewResult:
    """审查结果"""
    summary: str
    issues: List[Dict[str, Any]]
    score: Optional[int] = None
    suggestions: List[str] = None

    def __post_init__(self):
        if self.suggestions is None:
            self.suggestions = []


class BaseLLMProvider(ABC):
    """LLM提供商基类"""

    def __init__(self, api_key: str, api_base: Optional[str] = None, **kwargs):
        self.api_key = api_key
        self.api_base = api_base
        self.model = kwargs.get("model", self.default_model)
        self.temperature = kwargs.get("temperature", 0.3)
        self.max_tokens = kwargs.get("max_tokens", 4096)
        self.timeout = kwargs.get("timeout", 60)

    @property
    @abstractmethod
    def default_model(self) -> str:
        """默认模型"""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """提供商名称"""
        pass

    @abstractmethod
    def review_code(
        self,
        code_diff: str,
        file_path: str,
        focus_areas: Optional[List[str]] = None
    ) -> ReviewResult:
        """
        审查代码

        Args:
            code_diff: 代码差异
            file_path: 文件路径
            focus_areas: 审查重点领域

        Returns:
            审查结果
        """
        pass

    def _build_system_prompt(self, focus_areas: Optional[List[str]] = None) -> str:
        """构建系统提示词"""
        base_prompt = """你是一个专业的代码审查助手。你的任务是审查代码变更，发现潜在问题并提供改进建议。

审查维度包括：
"""
        areas = focus_areas or ["security", "performance", "readability", "best_practices"]

        area_descriptions = {
            "security": "安全性 - 检查潜在的安全漏洞、注入风险、敏感信息泄露等",
            "performance": "性能 - 检查性能瓶颈、不必要的计算、资源泄漏等",
            "readability": "可读性 - 检查代码清晰度、命名规范、注释完整性等",
            "best_practices": "最佳实践 - 检查设计模式、代码结构、错误处理等",
            "maintainability": "可维护性 - 检查代码复杂度、耦合度、测试覆盖等",
            "functionality": "功能性 - 检查逻辑错误、边界条件、异常处理等"
        }

        for area in areas:
            desc = area_descriptions.get(area, area)
            base_prompt += f"- {desc}\n"

        base_prompt += """
输出格式要求：
1. 总体评价：简要总结代码变更的质量
2. 问题列表：按严重程度列出发现的问题（严重/警告/建议）
3. 改进建议：提供具体的代码改进建议
4. 评分：0-100分的质量评分

注意：
- 只关注新增或修改的代码
- 提供具体的问题位置和改进建议
- 优先考虑安全性和功能性问题
- 保持建设性，提供可行的改进方案
"""
        return base_prompt

    def _build_user_prompt(self, code_diff: str, file_path: str) -> str:
        """构建用户提示词"""
        return f"""请审查以下代码变更：

文件：{file_path}

```diff
{code_diff}
```

请按照系统提示的格式输出审查结果。"""

    def _parse_response(self, response: str) -> ReviewResult:
        """解析LLM响应"""
        # 简单的解析逻辑，可以根据需要改进
        lines = response.strip().split("\n")

        summary = ""
        issues = []
        score = None
        suggestions = []

        current_section = None
        current_issue = {}

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # 检测章节
            if "总体评价" in line or "Summary" in line:
                current_section = "summary"
                continue
            elif "问题列表" in line or "Issues" in line:
                current_section = "issues"
                continue
            elif "改进建议" in line or "Suggestions" in line:
                current_section = "suggestions"
                continue
            elif "评分" in line or "Score" in line:
                # 尝试提取评分
                import re
                match = re.search(r'(\d+)', line)
                if match:
                    score = int(match.group(1))
                current_section = None
                continue

            # 收集内容
            if current_section == "summary":
                summary += line + " "
            elif current_section == "issues":
                if line.startswith("-") or line.startswith("*") or line[0].isdigit():
                    if current_issue:
                        issues.append(current_issue)
                    current_issue = {"description": line.lstrip("- *0123456789.").strip()}
                elif "严重" in line or "critical" in line.lower():
                    current_issue["severity"] = "critical"
                elif "警告" in line or "warning" in line.lower():
                    current_issue["severity"] = "warning"
                elif "建议" in line or "suggestion" in line.lower():
                    current_issue["severity"] = "suggestion"
            elif current_section == "suggestions":
                if line.startswith("-") or line.startswith("*") or line[0].isdigit():
                    suggestions.append(line.lstrip("- *0123456789.").strip())

        # 添加最后一个问题
        if current_issue:
            issues.append(current_issue)

        # 如果没有提取到摘要，使用前几行
        if not summary and lines:
            summary = " ".join(lines[:3])

        return ReviewResult(
            summary=summary.strip(),
            issues=issues,
            score=score,
            suggestions=suggestions
        )
