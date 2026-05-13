# 🤖 CodeReviewAI - 智能代码审查助手

<p align="center">
  <strong>基于多模型AI的智能代码审查GitHub Action，集成静态分析引擎</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/版本-1.0.0-blue.svg" alt="版本">
  <img src="https://img.shields.io/badge/许可证-MIT-green.svg" alt="许可证">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-20+-green.svg" alt="Node.js">
</p>

---

## 🎉 项目介绍

**CodeReviewAI** 是一款智能代码审查工具，结合多个AI模型的能力与静态分析引擎，为您的Pull Request提供全面、可操作的反馈。

### 为什么选择 CodeReviewAI？

- 🔥 **多模型支持** - 自动选择最佳AI提供商（OpenAI、Anthropic、Gemini、Ollama本地模型）
- 🔥 **增量审查** - 仅审查变更代码，节省Token和时间
- 🔥 **安全+质量双引擎** - AI智能与基于规则的静态分析相结合
- 🔥 **多语言支持** - 支持简体中文、繁体中文、英文、日文、韩文
- 🔥 **轻松集成** - 简单的GitHub Actions设置，配置极少

---

## ✨ 核心特性

| 特性 | 描述 | 状态 |
|------|------|------|
| 🤖 **多模型AI** | 支持OpenAI GPT-4、Anthropic Claude、Google Gemini和本地Ollama模型 | ✅ |
| 🔒 **安全分析** | 检测SQL注入、XSS、硬编码密钥等 | ✅ |
| ⚡ **性能检查** | 识别性能瓶颈和优化机会 | ✅ |
| ✨ **代码质量** | 强制执行最佳实践和编码标准 | ✅ |
| 🌍 **多语言** | 使用您偏好的语言查看审查评论 | ✅ |
| 📊 **详细报告** | 包含问题统计的综合PR摘要 | ✅ |
| 🎯 **智能过滤** | 排除模式、文件限制和diff大小控制 | ✅ |

---

## 🚀 快速开始

### 前置要求

- 启用Actions的GitHub仓库
- 至少一个AI提供商的API密钥（OpenAI、Anthropic或Gemini）

### 安装步骤

1. **创建工作流文件** `.github/workflows/codereview-ai.yml`：

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
      - name: 检出代码
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: CodeReviewAI 代码审查
        uses: gitstq/CodeReviewAI@v1
        with:
          ai_provider: 'auto'
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          review_comment_languages: 'zh'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

2. **添加API密钥到仓库密钥**：
   - 前往 Settings → Secrets and variables → Actions
   - 添加您的API密钥（`OPENAI_API_KEY`、`ANTHROPIC_API_KEY` 或 `GEMINI_API_KEY`）

3. **创建Pull Request**，见证魔法发生！✨

---

## 📖 详细使用指南

### 配置选项

| 选项 | 描述 | 默认值 |
|------|------|--------|
| `ai_provider` | AI提供商：`openai`、`anthropic`、`gemini`、`ollama`、`auto` | `auto` |
| `model` | 指定模型（覆盖自动选择） | - |
| `review_mode` | 审查范围：`full`（完整）、`incremental`（增量）、`security_only`（仅安全）、`performance_only`（仅性能） | `incremental` |
| `review_comment_languages` | 评论语言：`en`、`zh`、`zh-tw`、`ja`、`ko` | `en` |
| `exclude_patterns` | 要排除的文件模式 | `**/*.lock,**/node_modules/**` |
| `max_files` | 最大审查文件数 | `50` |
| `max_diff_size` | 最大diff大小（KB） | `500` |
| `enable_static_analysis` | 启用静态分析 | `true` |
| `security_checks` | 启用安全检查 | `true` |
| `quality_checks` | 启用质量检查 | `true` |
| `performance_checks` | 启用性能检查 | `true` |
| `comment_mode` | 评论样式：`review`（审查）、`comment`（评论）、`summary`（摘要） | `review` |
| `fail_on_severity` | 严重级别失败：`none`、`low`、`medium`、`high`、`critical` | `high` |

### 高级配置示例

```yaml
- name: CodeReviewAI 代码审查
  uses: gitstq/CodeReviewAI@v1
  with:
    ai_provider: 'anthropic'
    model: 'claude-3-5-sonnet-20241022'
    review_mode: 'security_only'
    review_comment_languages: 'zh'
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

## 💡 设计理念

### 为什么使用多模型？

不同的AI模型擅长不同的任务。CodeReviewAI 智能地将请求路由到最合适的模型：

- **Claude** - 最适合复杂代码理解和安全分析
- **GPT-4** - 擅长一般代码审查和建议
- **Gemini** - 在性能优化和多语言支持方面表现出色
- **Ollama** - 适合注重隐私的本地部署团队

### 静态分析 + AI

虽然AI模型提供智能洞察，但它们可能会错过某些模式。我们的静态分析引擎捕获：

- 已知安全漏洞（OWASP Top 10）
- 常见反模式
- 性能瓶颈
- 代码质量问题

---

## 📦 部署指南

### GitHub Actions（推荐）

只需在工作流中引用该Action：

```yaml
uses: gitstq/CodeReviewAI@v1
```

### 自托管运行器

如果使用Ollama进行本地LLM推理：

```yaml
- name: CodeReviewAI
  uses: gitstq/CodeReviewAI@v1
  with:
    ai_provider: 'ollama'
    ollama_url: 'http://localhost:11434'
    ollama_model: 'codellama:7b'
```

---

## 🤝 贡献指南

我们欢迎贡献！请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解指南。

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/gitstq/CodeReviewAI.git
cd CodeReviewAI

# 安装依赖
npm install

# 构建项目
npm run build

# 运行测试
npm test
```

---

## 📄 开源协议

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

---

<p align="center">
  用 ❤️ 由 CodeReviewAI 团队制作
</p>
