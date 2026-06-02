"""
Claude提供商
"""
from typing import List, Optional

import anthropic

from .base import BaseLLMProvider, ReviewResult


class ClaudeProvider(BaseLLMProvider):
    """Claude LLM提供商"""

    default_model = "claude-3-haiku-20240307"
    provider_name = "claude"

    def __init__(self, api_key: str, api_base: Optional[str] = None, **kwargs):
        super().__init__(api_key, api_base, **kwargs)
        self.client = anthropic.Anthropic(
            api_key=api_key,
            base_url=api_base,
            timeout=self.timeout
        )

    def review_code(
        self,
        code_diff: str,
        file_path: str,
        focus_areas: Optional[List[str]] = None
    ) -> ReviewResult:
        """审查代码"""
        system_prompt = self._build_system_prompt(focus_areas)
        user_prompt = self._build_user_prompt(code_diff, file_path)

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )

            content = response.content[0].text
            return self._parse_response(content)

        except Exception as e:
            return ReviewResult(
                summary=f"审查失败: {str(e)}",
                issues=[{"severity": "error", "description": str(e)}],
                score=None
            )
