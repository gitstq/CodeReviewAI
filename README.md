<div align="center">

# 🔍 CodeReviewAI

**轻量级AI驱动的代码审查CLI工具**

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/gitstq/CodeReviewAI/actions/workflows/ci.yml/badge.svg)](https://github.com/gitstq/CodeReviewAI/actions)

[简体中文](README_CN.md) | [繁體中文](README_TW.md) | [English](README_EN.md)

</div>

---

## 🎉 项目介绍

CodeReviewAI 是一款**轻量级AI驱动的代码审查CLI工具**，专为个人开发者和小团队设计。它能够自动检测Git代码变更，利用多LLM后端（OpenAI、Claude等）进行智能审查，输出结构化的代码质量报告。

### 💡 灵感来源

在开发过程中，我们发现：
- 大型AI编程助手（如aider、Claude Code）功能强大但过于复杂
- 现有代码审查工具要么功能单一，要么集成困难
- 小团队需要一款**轻量、专注、易集成**的代码审查工具

CodeReviewAI 应运而生，专注于**增量代码审查**这一核心场景，提供开箱即用的解决方案。

---

## ✨ 核心特性

| 特性 | 描述 | 状态 |
|------|------|------|
| 🔄 **增量审查** | 自动检测Git变更，只审查新增/修改的代码 | ✅ |
| 🤖 **多LLM支持** | 支持OpenAI GPT、Claude、本地Ollama等 | ✅ |
| 📊 **结构化输出** | Markdown/JSON格式，便于集成和阅读 | ✅ |
| 🎯 **自定义规则** | 支持配置审查重点（安全、性能、风格等） | ✅ |
| 🔧 **CI/CD友好** | 轻松集成GitHub Actions、GitLab CI | ✅ |
| 📈 **代码评分** | 量化代码质量，追踪改进趋势 | ✅ |
| 🌐 **多语言支持** | 支持Python、JavaScript、Go等主流语言 | ✅ |
| ⚡ **轻量快速** | 零依赖部署，启动速度快 | ✅ |

---

## 🚀 快速开始

### 环境要求

- **Python**: 3.9 或更高版本
- **Git**: 2.0 或更高版本
- **API密钥**: OpenAI 或 Claude API密钥

### 安装

```bash
# 使用 pip 安装
pip install codereviewai

# 或使用 pipx（推荐）
pipx install codereviewai
```

### 配置

```bash
# 初始化配置文件
codereviewai init

# 或设置环境变量
export OPENAI_API_KEY="your-api-key"
# 或
export ANTHROPIC_API_KEY="your-api-key"
```

### 使用示例

```bash
# 审查当前工作区的变更
codereviewai review

# 审查已暂存的变更
codereviewai review --staged

# 审查指定提交
codereviewai review --commit HEAD~1

# 审查分支差异
codereviewai review --branch main

# 指定输出格式
codereviewai review --output json --output-file report.json

# 指定审查重点
codereviewai review --focus security --focus performance
```

---

## 📖 详细使用指南

### CLI 命令

```
Usage: codereviewai [OPTIONS] COMMAND [ARGS]...

Commands:
  review     执行代码审查
  config     配置管理
  init       初始化配置文件
  providers  列出支持的LLM提供商
```

### 审查命令选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `--provider` | LLM提供商 | `--provider openai` |
| `--output` | 输出格式 | `--output markdown` |
| `--focus` | 审查重点 | `--focus security` |
| `--commit` | 审查指定提交 | `--commit HEAD~1` |
| `--branch` | 审查分支差异 | `--branch main` |
| `--staged` | 只审查暂存区 | `--staged` |
| `--output-file` | 输出到文件 | `--output-file report.md` |

### 配置文件示例

```yaml
# codereviewai.yaml
llm:
  provider: openai
  api_key: sk-...  # 或使用环境变量 OPENAI_API_KEY
  model: gpt-4o-mini
  temperature: 0.3
  max_tokens: 4096

review:
  focus_areas:
    - security
    - performance
    - readability
    - best_practices
  output_format: markdown
  exclude_patterns:
    - "*.lock"
    - "node_modules/**"
```

### CI/CD 集成

#### GitHub Actions

```yaml
name: Code Review

on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install CodeReviewAI
        run: pip install codereviewai

      - name: Run Code Review
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: codereviewai review --branch main --output-file review.md

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: review
            });
```

---

## 💡 设计思路与迭代规划

### 设计理念

1. **专注单一职责**: 只做代码审查，不做代码生成
2. **开发者优先**: CLI优先，终端友好
3. **可扩展架构**: 插件化LLM提供商，易于扩展
4. **零配置启动**: 合理的默认值，开箱即用

### 技术选型

- **Python 3.9+**: 成熟的生态，丰富的库支持
- **Click**: 强大的CLI框架
- **GitPython**: 可靠的Git操作库
- **Pydantic**: 类型安全的数据验证
- **Rich**: 美观的终端输出

### 迭代计划

**v1.0.0** (当前)
- ✅ 基础代码审查功能
- ✅ OpenAI/Claude支持
- ✅ Markdown/JSON输出
- ✅ 基础配置管理

**v1.1.0** (计划中)
- 🚧 Ollama本地模型支持
- 🚧 自定义审查规则
- 🚧 代码评分功能增强

**v1.2.0** (计划中)
- 📝 CI/CD集成示例库
- 📝 更多输出格式（HTML、PDF）
- 📝 性能优化

---

## 📦 打包与部署

### PyPI 安装

```bash
pip install codereviewai
```

### 源码安装

```bash
git clone https://github.com/gitstq/CodeReviewAI.git
cd CodeReviewAI
pip install -e ".[dev]"
```

### 构建二进制

```bash
# 安装构建依赖
pip install pyinstaller

# 构建可执行文件
make build-binary
```

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 提交 PR

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 提交规范

- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/gitstq/CodeReviewAI.git
cd CodeReviewAI

# 安装开发依赖
pip install -e ".[dev]"

# 运行测试
make test

# 代码检查
make lint

# 格式化代码
make format
```

---

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议开源。

---

<div align="center">

**Made with ❤️ by CodeReviewAI Team**

⭐ Star 我们 if you find this helpful!

</div>
