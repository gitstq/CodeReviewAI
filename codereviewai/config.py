"""
配置管理模块
"""
import os
import yaml
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class LLMConfig(BaseModel):
    """LLM配置"""
    provider: str = Field(default="openai", description="LLM提供商")
    api_key: Optional[str] = Field(default=None, description="API密钥")
    api_base: Optional[str] = Field(default=None, description="API基础URL")
    model: str = Field(default="gpt-4o-mini", description="模型名称")
    temperature: float = Field(default=0.3, ge=0.0, le=2.0, description="温度参数")
    max_tokens: int = Field(default=4096, ge=1, description="最大token数")
    timeout: int = Field(default=60, ge=1, description="超时时间(秒)")


class ReviewConfig(BaseModel):
    """审查配置"""
    focus_areas: list = Field(
        default_factory=lambda: ["security", "performance", "readability", "best_practices"],
        description="审查重点领域"
    )
    exclude_patterns: list = Field(
        default_factory=lambda: [
            "*.lock",
            "*.min.js",
            "*.min.css",
            "node_modules/**",
            "__pycache__/**",
            ".git/**",
            "*.pyc",
            "*.pyo",
        ],
        description="排除文件模式"
    )
    max_file_size: int = Field(default=100000, description="最大文件大小(字节)")
    output_format: str = Field(default="markdown", description="输出格式")


class Config(BaseModel):
    """主配置类"""
    llm: LLMConfig = Field(default_factory=LLMConfig)
    review: ReviewConfig = Field(default_factory=ReviewConfig)

    @classmethod
    def load(cls, config_path: Optional[str] = None) -> "Config":
        """加载配置"""
        if config_path is None:
            config_path = cls._find_config_file()

        if config_path and os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
            return cls(**data)

        return cls()

    @classmethod
    def _find_config_file(cls) -> Optional[str]:
        """查找配置文件"""
        # 当前目录
        for filename in ["codereviewai.yaml", "codereviewai.yml", ".codereviewai.yaml"]:
            if os.path.exists(filename):
                return filename

        # 用户主目录
        home_config = Path.home() / ".config" / "codereviewai" / "config.yaml"
        if home_config.exists():
            return str(home_config)

        return None

    def save(self, config_path: str) -> None:
        """保存配置"""
        os.makedirs(os.path.dirname(config_path) or ".", exist_ok=True)
        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(self.model_dump(), f, default_flow_style=False, allow_unicode=True)

    def get_api_key(self) -> Optional[str]:
        """获取API密钥（优先环境变量）"""
        env_var = f"{self.llm.provider.upper()}_API_KEY"
        return os.environ.get(env_var) or self.llm.api_key
