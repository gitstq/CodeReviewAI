"""
CodeReviewAI - 轻量级AI驱动的代码审查CLI工具

一个专注增量代码审查的智能工具，支持多LLM后端，
为个人开发者和小团队提供高效的代码质量保障。
"""

__version__ = "1.0.0"
__author__ = "CodeReviewAI Team"
__email__ = "hello@codereviewai.dev"
__license__ = "MIT"

from .reviewer import CodeReviewer
from .config import Config

__all__ = ["CodeReviewer", "Config", "__version__"]
