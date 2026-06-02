"""
配置模块测试
"""
import os
import tempfile
import pytest

from codereviewai.config import Config, LLMConfig, ReviewConfig


class TestConfig:
    """测试配置类"""

    def test_default_config(self):
        """测试默认配置"""
        config = Config()
        assert config.llm.provider == "openai"
        assert config.llm.model == "gpt-4o-mini"
        assert config.llm.temperature == 0.3
        assert config.review.output_format == "markdown"

    def test_config_save_load(self):
        """测试配置保存和加载"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            config_path = f.name

        try:
            config = Config()
            config.llm.provider = "claude"
            config.llm.api_key = "test_key"
            config.save(config_path)

            loaded_config = Config.load(config_path)
            assert loaded_config.llm.provider == "claude"
            assert loaded_config.llm.api_key == "test_key"
        finally:
            os.unlink(config_path)

    def test_get_api_key_from_env(self, monkeypatch):
        """测试从环境变量获取API密钥"""
        monkeypatch.setenv("OPENAI_API_KEY", "env_api_key")

        config = Config()
        config.llm.api_key = "config_api_key"

        # 环境变量优先
        assert config.get_api_key() == "env_api_key"

    def test_get_api_key_from_config(self):
        """测试从配置获取API密钥"""
        config = Config()
        config.llm.api_key = "config_api_key"

        assert config.get_api_key() == "config_api_key"


class TestLLMConfig:
    """测试LLM配置"""

    def test_default_values(self):
        """测试默认值"""
        config = LLMConfig()
        assert config.provider == "openai"
        assert config.temperature == 0.3
        assert config.max_tokens == 4096
        assert config.timeout == 60


class TestReviewConfig:
    """测试审查配置"""

    def test_default_focus_areas(self):
        """测试默认审查重点"""
        config = ReviewConfig()
        assert "security" in config.focus_areas
        assert "performance" in config.focus_areas
        assert "readability" in config.focus_areas

    def test_default_exclude_patterns(self):
        """测试默认排除模式"""
        config = ReviewConfig()
        assert "*.lock" in config.exclude_patterns
        assert "node_modules/**" in config.exclude_patterns
