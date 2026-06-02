"""
LLM客户端
"""
from typing import Optional, List, Dict, Type

from .config import Config
from .providers.base import BaseLLMProvider, ReviewResult
from .providers.openai import OpenAIProvider
from .providers.claude import ClaudeProvider


class LLMClient:
    """LLM客户端"""

    PROVIDERS: Dict[str, Type[BaseLLMProvider]] = {
        "openai": OpenAIProvider,
        "claude": ClaudeProvider,
    }

    def __init__(self, config: Config):
        self.config = config
        self.provider = self._create_provider()

    def _create_provider(self) -> BaseLLMProvider:
        """创建LLM提供商实例"""
        provider_name = self.config.llm.provider.lower()
        provider_class = self.PROVIDERS.get(provider_name)

        if not provider_class:
            raise ValueError(f"不支持的LLM提供商: {provider_name}")

        api_key = self.config.get_api_key()
        if not api_key:
            raise ValueError(
                f"未找到API密钥。请设置环境变量 {self.config.llm.provider.upper()}_API_KEY "
                f"或在配置文件中设置 api_key"
            )

        return provider_class(
            api_key=api_key,
            api_base=self.config.llm.api_base,
            model=self.config.llm.model,
            temperature=self.config.llm.temperature,
            max_tokens=self.config.llm.max_tokens,
            timeout=self.config.llm.timeout
        )

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
        return self.provider.review_code(code_diff, file_path, focus_areas)

    @classmethod
    def register_provider(cls, name: str, provider_class: Type[BaseLLMProvider]) -> None:
        """注册新的提供商"""
        cls.PROVIDERS[name.lower()] = provider_class

    @classmethod
    def list_providers(cls) -> List[str]:
        """列出支持的提供商"""
        return list(cls.PROVIDERS.keys())
