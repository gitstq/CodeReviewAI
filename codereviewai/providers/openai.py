"""
OpenAI提供商
"""
from typing import List, Optional

from openai import OpenAI

from .base import BaseLLMProvider, ReviewResult


class OpenAIProvider(BaseLLMProvider):
    """OpenAI LLM提供商"""

    default_model = "gpt-4o-mini"
    provider_name = "openai"

    def __init__(self, api_key: str, api_base: Optional[str] = None, **kwargs):
        super().__init__(api_key, api_base, **kwargs)
        self.client = OpenAI(
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
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )

            content = response.choices[0].message.content
            return self._parse_response(content)

        except Exception as e:
            return ReviewResult(
                summary=f"审查失败: {str(e)}",
                issues=[{"severity": "error", "description": str(e)}],
                score=None
            )
