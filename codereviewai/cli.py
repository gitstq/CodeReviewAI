"""
CLI入口模块
"""
import sys
import os
from typing import Optional

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from . import __version__
from .config import Config
from .reviewer import CodeReviewer
from .formatter import ReportFormatter


console = Console()


def print_banner():
    """打印横幅"""
    banner = """
╭──────────────────────────────────────────────────────────────╮
│                                                              │
│   🔍 CodeReviewAI v{version:<8}                            │
│   轻量级AI驱动的代码审查工具                                    │
│                                                              │
╰──────────────────────────────────────────────────────────────╯
""".format(version=__version__)
    console.print(banner, style="cyan")


@click.group(invoke_without_command=True)
@click.option("--version", is_flag=True, help="显示版本信息")
@click.pass_context
def main(ctx, version):
    """CodeReviewAI - 轻量级AI驱动的代码审查CLI工具"""
    if version:
        console.print(f"CodeReviewAI v{__version__}")
        return

    if ctx.invoked_subcommand is None:
        print_banner()
        console.print(ctx.get_help())


@main.command()
@click.option(
    "--provider",
    type=click.Choice(["openai", "claude"]),
    help="LLM提供商"
)
@click.option(
    "--output",
    "-o",
    type=click.Choice(["markdown", "json"]),
    default="markdown",
    help="输出格式"
)
@click.option(
    "--focus",
    "-f",
    multiple=True,
    type=click.Choice(["security", "performance", "readability", "best_practices", "maintainability", "functionality"]),
    help="审查重点领域（可多选）"
)
@click.option(
    "--commit",
    "-c",
    help="审查指定提交（如 HEAD~1）"
)
@click.option(
    "--branch",
    "-b",
    help="审查与指定分支的差异"
)
@click.option(
    "--range",
    "-r",
    help="审查提交范围（如 HEAD~3..HEAD）"
)
@click.option(
    "--staged",
    is_flag=True,
    help="只审查已暂存的变更"
)
@click.option(
    "--output-file",
    "-O",
    help="输出到文件"
)
def review(
    provider: Optional[str],
    output: str,
    focus: tuple,
    commit: Optional[str],
    branch: Optional[str],
    range: Optional[str],
    staged: bool,
    output_file: Optional[str]
):
    """执行代码审查"""
    # 加载配置
    config = Config.load()

    # 覆盖配置
    if provider:
        config.llm.provider = provider

    # 检查API密钥
    api_key = config.get_api_key()
    if not api_key:
        console.print(Panel(
            f"[red]错误: 未设置 {config.llm.provider.upper()}_API_KEY 环境变量或配置文件中的 api_key[/red]\n\n"
            f"请设置环境变量: export {config.llm.provider.upper()}_API_KEY=your_api_key\n"
            f"或运行: codereviewai config set llm.api_key your_api_key",
            title="配置错误",
            border_style="red"
        ))
        sys.exit(1)

    # 创建审查器
    reviewer = CodeReviewer(config, console)

    # 确定审查范围
    focus_areas = list(focus) if focus else None

    console.print(f"[cyan]🔍 开始代码审查...[/cyan]")
    console.print(f"[dim]LLM提供商: {config.llm.provider}[/dim]")
    console.print(f"[dim]输出格式: {output}[/dim]")
    if focus_areas:
        console.print(f"[dim]审查重点: {', '.join(focus_areas)}[/dim]")
    console.print("")

    # 执行审查
    try:
        if commit:
            report = reviewer.review_commit(commit, focus_areas)
        elif branch:
            report = reviewer.review_branch(branch, focus_areas)
        elif range:
            report = reviewer.review_commit_range(range, focus_areas)
        else:
            report = reviewer.review_working_directory(staged=staged, focus_areas=focus_areas)

        # 格式化输出
        formatter = ReportFormatter()
        formatted_report = formatter.format(report, output)

        # 输出结果
        if output_file:
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(formatted_report)
            console.print(f"[green]✅ 报告已保存到: {output_file}[/green]")
        else:
            console.print("")
            console.print(formatted_report)

        # 返回码
        if report.error_files > 0:
            sys.exit(2)
        elif report.overall_score is not None and report.overall_score < 60:
            sys.exit(1)

    except Exception as e:
        console.print(Panel(
            f"[red]审查失败: {str(e)}[/red]",
            title="错误",
            border_style="red"
        ))
        sys.exit(1)


@main.group()
def config():
    """配置管理"""
    pass


@config.command(name="set")
@click.argument("key")
@click.argument("value")
@click.option(
    "--global",
    "is_global",
    is_flag=True,
    help="保存到全局配置"
)
def config_set(key: str, value: str, is_global: bool):
    """设置配置项"""
    cfg = Config.load()

    # 解析键路径
    parts = key.split(".")
    target = cfg
    for part in parts[:-1]:
        if hasattr(target, part):
            target = getattr(target, part)
        else:
            console.print(f"[red]无效的配置键: {key}[/red]")
            sys.exit(1)

    # 设置值
    final_key = parts[-1]
    if hasattr(target, final_key):
        # 类型转换
        current_value = getattr(target, final_key)
        if isinstance(current_value, bool):
            value = value.lower() in ("true", "1", "yes", "on")
        elif isinstance(current_value, int):
            value = int(value)
        elif isinstance(current_value, float):
            value = float(value)
        elif isinstance(current_value, list):
            value = value.split(",")

        setattr(target, final_key, value)

        # 保存配置
        if is_global:
            config_path = os.path.expanduser("~/.config/codereviewai/config.yaml")
        else:
            config_path = "codereviewai.yaml"

        cfg.save(config_path)
        console.print(f"[green]✅ 配置已保存: {key} = {value}[/green]")
    else:
        console.print(f"[red]无效的配置键: {key}[/red]")
        sys.exit(1)


@config.command(name="get")
@click.argument("key")
def config_get(key: str):
    """获取配置项"""
    cfg = Config.load()

    # 解析键路径
    parts = key.split(".")
    target = cfg
    for part in parts:
        if hasattr(target, part):
            target = getattr(target, part)
        else:
            console.print(f"[red]无效的配置键: {key}[/red]")
            sys.exit(1)

    console.print(f"{key} = {target}")


@config.command(name="list")
def config_list():
    """列出所有配置"""
    cfg = Config.load()

    table = Table(title="当前配置")
    table.add_column("键", style="cyan")
    table.add_column("值", style="green")

    table.add_row("llm.provider", cfg.llm.provider)
    table.add_row("llm.model", cfg.llm.model)
    table.add_row("llm.api_key", "***" if cfg.llm.api_key else "未设置")
    table.add_row("llm.api_base", cfg.llm.api_base or "默认")
    table.add_row("llm.temperature", str(cfg.llm.temperature))
    table.add_row("llm.max_tokens", str(cfg.llm.max_tokens))
    table.add_row("review.output_format", cfg.review.output_format)
    table.add_row("review.focus_areas", ", ".join(cfg.review.focus_areas))

    console.print(table)


@main.command()
@click.option(
    "--global",
    "is_global",
    is_flag=True,
    help="创建全局配置"
)
def init(is_global: bool):
    """初始化配置文件"""
    if is_global:
        config_path = os.path.expanduser("~/.config/codereviewai/config.yaml")
    else:
        config_path = "codereviewai.yaml"

    if os.path.exists(config_path):
        console.print(f"[yellow]⚠️ 配置文件已存在: {config_path}[/yellow]")
        return

    cfg = Config()
    cfg.save(config_path)

    console.print(Panel(
        f"[green]✅ 配置文件已创建: {config_path}[/green]\n\n"
        f"请编辑配置文件，设置您的API密钥:\n"
        f"  llm:\n"
        f"    api_key: your_api_key_here",
        title="初始化完成",
        border_style="green"
    ))


@main.command()
def providers():
    """列出支持的LLM提供商"""
    from .llm_client import LLMClient

    table = Table(title="支持的LLM提供商")
    table.add_column("提供商", style="cyan")
    table.add_column("环境变量", style="green")
    table.add_column("默认模型", style="yellow")

    providers_info = [
        ("openai", "OPENAI_API_KEY", "gpt-4o-mini"),
        ("claude", "ANTHROPIC_API_KEY", "claude-3-haiku-20240307"),
    ]

    for provider, env_var, default_model in providers_info:
        table.add_row(provider, env_var, default_model)

    console.print(table)


if __name__ == "__main__":
    main()
