# 🤖 CodeReviewAI

<p align="center">
  <strong>Intelligent AI-powered code review GitHub Action with multi-model support and static analysis integration</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-20+-green.svg" alt="Node.js">
</p>

---

## 🎉 Introduction

**CodeReviewAI** is an intelligent code review tool that combines the power of multiple AI models with static analysis to provide comprehensive, actionable feedback on your pull requests.

### Why CodeReviewAI?

- 🔥 **Multi-Model Support** - Automatically selects the best AI provider (OpenAI, Anthropic, Gemini, Ollama)
- 🔥 **Incremental Review** - Only reviews changed code, saving tokens and time
- 🔥 **Security + Quality** - Combines AI intelligence with rule-based static analysis
- 🔥 **Multi-Language** - Supports English, Chinese (Simplified & Traditional), Japanese, Korean
- 🔥 **Easy Integration** - Simple GitHub Actions setup with minimal configuration

---

## ✨ Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🤖 **Multi-Model AI** | Support for OpenAI GPT-4, Anthropic Claude, Google Gemini, and local Ollama models | ✅ |
| 🔒 **Security Analysis** | Detects SQL injection, XSS, hardcoded secrets, and more | ✅ |
| ⚡ **Performance Checks** | Identifies performance bottlenecks and optimization opportunities | ✅ |
| ✨ **Code Quality** | Enforces best practices and coding standards | ✅ |
| 🌍 **Multi-Language** | Review comments in your preferred language | ✅ |
| 📊 **Detailed Reports** | Comprehensive PR summaries with issue statistics | ✅ |
| 🎯 **Smart Filtering** | Exclude patterns, file limits, and diff size controls | ✅ |

---

## 🚀 Quick Start

### Prerequisites

- GitHub repository with Actions enabled
- API key for at least one AI provider (OpenAI, Anthropic, or Gemini)

### Installation

1. **Create the workflow file** `.github/workflows/codereview-ai.yml`:

```yaml
name: 'CodeReviewAI'

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: CodeReviewAI
        uses: gitstq/CodeReviewAI@v1
        with:
          ai_provider: 'auto'
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

2. **Add API keys to repository secrets**:
   - Go to Settings → Secrets and variables → Actions
   - Add your API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY`)

3. **Create a pull request** and watch the magic happen! ✨

---

## 📖 Detailed Usage Guide

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `ai_provider` | AI provider: `openai`, `anthropic`, `gemini`, `ollama`, `auto` | `auto` |
| `model` | Specific model to use (overrides auto-selection) | - |
| `review_mode` | Review scope: `full`, `incremental`, `security_only`, `performance_only` | `incremental` |
| `review_comment_languages` | Languages for comments: `en`, `zh`, `zh-tw`, `ja`, `ko` | `en` |
| `exclude_patterns` | File patterns to exclude | `**/*.lock,**/node_modules/**` |
| `max_files` | Maximum files to review | `50` |
| `max_diff_size` | Maximum diff size in KB | `500` |
| `enable_static_analysis` | Enable static analysis | `true` |
| `security_checks` | Enable security checks | `true` |
| `quality_checks` | Enable quality checks | `true` |
| `performance_checks` | Enable performance checks | `true` |
| `comment_mode` | Comment style: `review`, `comment`, `summary` | `review` |
| `fail_on_severity` | Fail workflow on severity: `none`, `low`, `medium`, `high`, `critical` | `high` |

### Advanced Configuration Example

```yaml
- name: CodeReviewAI
  uses: gitstq/CodeReviewAI@v1
  with:
    ai_provider: 'anthropic'
    model: 'claude-3-5-sonnet-20241022'
    review_mode: 'security_only'
    review_comment_languages: 'en,zh'
    exclude_patterns: '**/*.test.js,**/*.spec.js,**/docs/**'
    max_files: '30'
    enable_static_analysis: 'true'
    security_checks: 'true'
    quality_checks: 'false'
    performance_checks: 'true'
    comment_mode: 'review'
    fail_on_severity: 'critical'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 💡 Design Philosophy

### Why Multi-Model?

Different AI models excel at different tasks. CodeReviewAI intelligently routes requests to the most appropriate model:

- **Claude** - Best for complex code understanding and security analysis
- **GPT-4** - Excellent for general code review and suggestions
- **Gemini** - Great for performance optimization and multilingual support
- **Ollama** - Perfect for privacy-conscious teams with local deployment

### Static Analysis + AI

While AI models provide intelligent insights, they can miss certain patterns. Our static analysis engine catches:

- Known security vulnerabilities (OWASP Top 10)
- Common anti-patterns
- Performance bottlenecks
- Code quality issues

---

## 📦 Deployment Guide

### For GitHub Actions (Recommended)

Simply reference the action in your workflow:

```yaml
uses: gitstq/CodeReviewAI@v1
```

### For Self-Hosted Runners

If using Ollama for local LLM inference:

```yaml
- name: CodeReviewAI
  uses: gitstq/CodeReviewAI@v1
  with:
    ai_provider: 'ollama'
    ollama_url: 'http://localhost:11434'
    ollama_model: 'codellama:7b'
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/gitstq/CodeReviewAI.git
cd CodeReviewAI

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by the CodeReviewAI Team
</p>
