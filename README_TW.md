<div align="center">

# 🔍 CodeReviewAI

**輕量級AI驅動的代碼審查CLI工具**

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/gitstq/CodeReviewAI/actions/workflows/ci.yml/badge.svg)](https://github.com/gitstq/CodeReviewAI/actions)

[简体中文](README_CN.md) | [繁體中文](README_TW.md) | [English](README_EN.md)

</div>

---

## 🎉 專案介紹

CodeReviewAI 是一款**輕量級AI驅動的代碼審查CLI工具**，專為個人開發者和小團隊設計。它能夠自動檢測Git代碼變更，利用多LLM後端（OpenAI、Claude等）進行智能審查，輸出結構化的代碼品質報告。

### 💡 靈感來源

在開發過程中，我們發現：
- 大型AI編程助手（如aider、Claude Code）功能強大但過於複雜
- 現有代碼審查工具要么功能單一，要么集成困難
- 小團隊需要一款**輕量、專注、易集成**的代碼審查工具

CodeReviewAI 應運而生，專注於**增量代碼審查**這一核心場景，提供開箱即用的解決方案。

---

## ✨ 核心特性

| 特性 | 描述 | 狀態 |
|------|------|------|
| 🔄 **增量審查** | 自動檢測Git變更，只審查新增/修改的代碼 | ✅ |
| 🤖 **多LLM支持** | 支持OpenAI GPT、Claude、本地Ollama等 | ✅ |
| 📊 **結構化輸出** | Markdown/JSON格式，便於集成和閱讀 | ✅ |
| 🎯 **自定義規則** | 支持配置審查重點（安全、性能、風格等） | ✅ |
| 🔧 **CI/CD友好** | 輕鬆集成GitHub Actions、GitLab CI | ✅ |
| 📈 **代碼評分** | 量化代碼品質，追蹤改進趨勢 | ✅ |
| 🌐 **多語言支持** | 支持Python、JavaScript、Go等主流語言 | ✅ |
| ⚡ **輕量快速** | 零依賴部署，啟動速度快 | ✅ |

---

## 🚀 快速開始

### 環境要求

- **Python**: 3.9 或更高版本
- **Git**: 2.0 或更高版本
- **API密鑰**: OpenAI 或 Claude API密鑰

### 安裝

```bash
# 使用 pip 安裝
pip install codereviewai

# 或使用 pipx（推薦）
pipx install codereviewai
```

### 配置

```bash
# 初始化配置文件
codereviewai init

# 或設置環境變量
export OPENAI_API_KEY="your-api-key"
# 或
export ANTHROPIC_API_KEY="your-api-key"
```

### 使用示例

```bash
# 審查當前工作區的變更
codereviewai review

# 審查已暫存的變更
codereviewai review --staged

# 審查指定提交
codereviewai review --commit HEAD~1

# 審查分支差異
codereviewai review --branch main

# 指定輸出格式
codereviewai review --output json --output-file report.json

# 指定審查重點
codereviewai review --focus security --focus performance
```

---

## 📖 詳細使用指南

### CLI 命令

```
Usage: codereviewai [OPTIONS] COMMAND [ARGS]...

Commands:
  review     執行代碼審查
  config     配置管理
  init       初始化配置文件
  providers  列出支持的LLM提供商
```

### 審查命令選項

| 選項 | 說明 | 示例 |
|------|------|------|
| `--provider` | LLM提供商 | `--provider openai` |
| `--output` | 輸出格式 | `--output markdown` |
| `--focus` | 審查重點 | `--focus security` |
| `--commit` | 審查指定提交 | `--commit HEAD~1` |
| `--branch` | 審查分支差異 | `--branch main` |
| `--staged` | 只審查暫存區 | `--staged` |
| `--output-file` | 輸出到文件 | `--output-file report.md` |

### 配置文件示例

```yaml
# codereviewai.yaml
llm:
  provider: openai
  api_key: sk-...  # 或使用環境變量 OPENAI_API_KEY
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

## 💡 設計思路與迭代規劃

### 設計理念

1. **專注單一職責**: 只做代碼審查，不做代碼生成
2. **開發者優先**: CLI優先，終端友好
3. **可擴展架構**: 插件化LLM提供商，易於擴展
4. **零配置啟動**: 合理的默認值，開箱即用

### 技術選型

- **Python 3.9+**: 成熟的生態，豐富的庫支持
- **Click**: 強大的CLI框架
- **GitPython**: 可靠的Git操作庫
- **Pydantic**: 類型安全的數據驗證
- **Rich**: 美觀的終端輸出

### 迭代計劃

**v1.0.0** (當前)
- ✅ 基礎代碼審查功能
- ✅ OpenAI/Claude支持
- ✅ Markdown/JSON輸出
- ✅ 基礎配置管理

**v1.1.0** (計劃中)
- 🚧 Ollama本地模型支持
- 🚧 自定義審查規則
- 🚧 代碼評分功能增強

**v1.2.0** (計劃中)
- 📝 CI/CD集成示例庫
- 📝 更多輸出格式（HTML、PDF）
- 📝 性能優化

---

## 📦 打包與部署

### PyPI 安裝

```bash
pip install codereviewai
```

### 源碼安裝

```bash
git clone https://github.com/gitstq/CodeReviewAI.git
cd CodeReviewAI
pip install -e ".[dev]"
```

### 構建二進制

```bash
# 安裝構建依賴
pip install pyinstaller

# 構建可執行文件
make build-binary
```

---

## 🤝 貢獻指南

我們歡迎所有形式的貢獻！

### 提交 PR

1. Fork 本倉庫
2. 創建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 創建 Pull Request

### 提交規範

- `feat`: 新功能
- `fix`: 修復問題
- `docs`: 文檔更新
- `refactor`: 代碼重構
- `test`: 測試相關
- `chore`: 構建/工具相關

### 開發環境

```bash
# 克隆倉庫
git clone https://github.com/gitstq/CodeReviewAI.git
cd CodeReviewAI

# 安裝開發依賴
pip install -e ".[dev]"

# 運行測試
make test

# 代碼檢查
make lint

# 格式化代碼
make format
```

---

## 📄 開源協議

本專案採用 [MIT](LICENSE) 協議開源。

---

<div align="center">

**Made with ❤️ by CodeReviewAI Team**

⭐ Star 我們 if you find this helpful!

</div>
