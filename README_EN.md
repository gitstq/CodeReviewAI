<div align="center">

# 🔍 CodeReviewAI

**Lightweight AI-Powered Code Review CLI Tool**

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/gitstq/CodeReviewAI/actions/workflows/ci.yml/badge.svg)](https://github.com/gitstq/CodeReviewAI/actions)

[简体中文](README_CN.md) | [繁體中文](README_TW.md) | [English](README_EN.md)

</div>

---

## 🎉 Introduction

CodeReviewAI is a **lightweight AI-powered code review CLI tool** designed for individual developers and small teams. It automatically detects Git code changes, performs intelligent reviews using multiple LLM backends (OpenAI, Claude, etc.), and outputs structured code quality reports.

### 💡 Inspiration

During development, we found that:
- Large AI coding assistants (like aider, Claude Code) are powerful but overly complex
- Existing code review tools are either too simple or difficult to integrate
- Small teams need a **lightweight, focused, and easy-to-integrate** code review tool

CodeReviewAI was born to address this need, focusing on the core scenario of **incremental code review** with an out-of-the-box solution.

---

## ✨ Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🔄 **Incremental Review** | Auto-detect Git changes, review only new/modified code | ✅ |
| 🤖 **Multi-LLM Support** | Support OpenAI GPT, Claude, local Ollama, etc. | ✅ |
| 📊 **Structured Output** | Markdown/JSON format for easy integration and reading | ✅ |
| 🎯 **Custom Rules** | Configurable review focus (security, performance, style, etc.) | ✅ |
| 🔧 **CI/CD Friendly** | Easy integration with GitHub Actions, GitLab CI | ✅ |
| 📈 **Code Scoring** | Quantify code quality and track improvement trends | ✅ |
| 🌐 **Multi-Language** | Support Python, JavaScript, Go, and other mainstream languages | ✅ |
| ⚡ **Lightweight & Fast** | Zero-dependency deployment, fast startup | ✅ |

---

## 🚀 Quick Start

### Requirements

- **Python**: 3.9 or higher
- **Git**: 2.0 or higher
- **API Key**: OpenAI or Claude API key

### Installation

```bash
# Install via pip
pip install codereviewai

# Or use pipx (recommended)
pipx install codereviewai
```

### Configuration

```bash
# Initialize config file
codereviewai init

# Or set environment variable
export OPENAI_API_KEY="your-api-key"
# or
export ANTHROPIC_API_KEY="your-api-key"
```

### Usage Examples

```bash
# Review current working directory changes
codereviewai review

# Review staged changes only
codereviewai review --staged

# Review specific commit
codereviewai review --commit HEAD~1

# Review branch differences
codereviewai review --branch main

# Specify output format
codereviewai review --output json --output-file report.json

# Specify review focus
codereviewai review --focus security --focus performance
```

---

## 📖 Detailed Usage Guide

### CLI Commands

```
Usage: codereviewai [OPTIONS] COMMAND [ARGS]...

Commands:
  review     Perform code review
  config     Configuration management
  init       Initialize config file
  providers  List supported LLM providers
```

### Review Command Options

| Option | Description | Example |
|--------|-------------|---------|
| `--provider` | LLM provider | `--provider openai` |
| `--output` | Output format | `--output markdown` |
| `--focus` | Review focus | `--focus security` |
| `--commit` | Review specific commit | `--commit HEAD~1` |
| `--branch` | Review branch differences | `--branch main` |
| `--staged` | Review staged changes only | `--staged` |
| `--output-file` | Output to file | `--output-file report.md` |

### Configuration File Example

```yaml
# codereviewai.yaml
llm:
  provider: openai
  api_key: sk-...  # or use environment variable OPENAI_API_KEY
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

### CI/CD Integration

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

## 💡 Design Philosophy & Roadmap

### Design Principles

1. **Single Responsibility**: Focus only on code review, not code generation
2. **Developer First**: CLI-first, terminal-friendly
3. **Extensible Architecture**: Pluggable LLM providers, easy to extend
4. **Zero-Config Startup**: Sensible defaults, works out of the box

### Tech Stack

- **Python 3.9+**: Mature ecosystem, rich library support
- **Click**: Powerful CLI framework
- **GitPython**: Reliable Git operations
- **Pydantic**: Type-safe data validation
- **Rich**: Beautiful terminal output

### Roadmap

**v1.0.0** (Current)
- ✅ Basic code review functionality
- ✅ OpenAI/Claude support
- ✅ Markdown/JSON output
- ✅ Basic configuration management

**v1.1.0** (Planned)
- 🚧 Ollama local model support
- 🚧 Custom review rules
- 🚧 Enhanced code scoring

**v1.2.0** (Planned)
- 📝 CI/CD integration example library
- 📝 More output formats (HTML, PDF)
- 📝 Performance optimization

---

## 📦 Packaging & Deployment

### PyPI Installation

```bash
pip install codereviewai
```

### Source Installation

```bash
git clone https://github.com/gitstq/CodeReviewAI.git
cd CodeReviewAI
pip install -e ".[dev]"
```

### Build Binary

```bash
# Install build dependencies
pip install pyinstaller

# Build executable
make build-binary
```

---

## 🤝 Contributing

We welcome all forms of contributions!

### Submitting PRs

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

### Commit Convention

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `refactor`: Code refactoring
- `test`: Test related
- `chore`: Build/tool related

### Development Environment

```bash
# Clone repository
git clone https://github.com/gitstq/CodeReviewAI.git
cd CodeReviewAI

# Install dev dependencies
pip install -e ".[dev]"

# Run tests
make test

# Code linting
make lint

# Format code
make format
```

---

## 📄 License

This project is open-sourced under the [MIT](LICENSE) License.

---

<div align="center">

**Made with ❤️ by CodeReviewAI Team**

⭐ Star us if you find this helpful!

</div>
