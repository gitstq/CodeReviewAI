# 🤖 CodeReviewAI - 智慧程式碼審查助手

<p align="center">
  <strong>基於多模型AI的智慧程式碼審查GitHub Action，整合靜態分析引擎</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/版本-1.0.0-blue.svg" alt="版本">
  <img src="https://img.shields.io/badge/授權-MIT-green.svg" alt="授權">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-20+-green.svg" alt="Node.js">
</p>

---

## 🎉 專案介紹

**CodeReviewAI** 是一款智慧程式碼審查工具，結合多個AI模型的能力與靜態分析引擎，為您的Pull Request提供全面、可操作的回饋。

### 為什麼選擇 CodeReviewAI？

- 🔥 **多模型支援** - 自動選擇最佳AI提供商（OpenAI、Anthropic、Gemini、Ollama本地模型）
- 🔥 **增量審查** - 僅審查變更程式碼，節省Token和時間
- 🔥 **安全+品質雙引擎** - AI智慧與基於規則的靜態分析相結合
- 🔥 **多語言支援** - 支援繁體中文、簡體中文、英文、日文、韓文
- 🔥 **輕鬆整合** - 簡單的GitHub Actions設定，配置極少

---

## ✨ 核心特性

| 特性 | 描述 | 狀態 |
|------|------|------|
| 🤖 **多模型AI** | 支援OpenAI GPT-4、Anthropic Claude、Google Gemini和本地Ollama模型 | ✅ |
| 🔒 **安全分析** | 檢測SQL注入、XSS、硬編碼金鑰等 | ✅ |
| ⚡ **效能檢查** | 識別效能瓶頸和最佳化機會 | ✅ |
| ✨ **程式碼品質** | 強制執行最佳實踐和編碼標準 | ✅ |
| 🌍 **多語言** | 使用您偏好的語言查看審查評論 | ✅ |
| 📊 **詳細報告** | 包含問題統計的綜合PR摘要 | ✅ |
| 🎯 **智慧過濾** | 排除模式、檔案限制和diff大小控制 | ✅ |

---

## 🚀 快速開始

### 前置要求

- 啟用Actions的GitHub儲存庫
- 至少一個AI提供商的API金鑰（OpenAI、Anthropic或Gemini）

### 安裝步驟

1. **建立工作流檔案** `.github/workflows/codereview-ai.yml`：

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
      - name: 檢出程式碼
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: CodeReviewAI 程式碼審查
        uses: gitstq/CodeReviewAI@v1
        with:
          ai_provider: 'auto'
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          review_comment_languages: 'zh-tw'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

2. **新增API金鑰到儲存庫金鑰**：
   - 前往 Settings → Secrets and variables → Actions
   - 新增您的API金鑰（`OPENAI_API_KEY`、`ANTHROPIC_API_KEY` 或 `GEMINI_API_KEY`）

3. **建立Pull Request**，見證魔法發生！✨

---

## 📖 詳細使用指南

### 配置選項

| 選項 | 描述 | 預設值 |
|------|------|--------|
| `ai_provider` | AI提供商：`openai`、`anthropic`、`gemini`、`ollama`、`auto` | `auto` |
| `model` | 指定模型（覆蓋自動選擇） | - |
| `review_mode` | 審查範圍：`full`（完整）、`incremental`（增量）、`security_only`（僅安全）、`performance_only`（僅效能） | `incremental` |
| `review_comment_languages` | 評論語言：`en`、`zh`、`zh-tw`、`ja`、`ko` | `en` |
| `exclude_patterns` | 要排除的檔案模式 | `**/*.lock,**/node_modules/**` |
| `max_files` | 最大審查檔案數 | `50` |
| `max_diff_size` | 最大diff大小（KB） | `500` |
| `enable_static_analysis` | 啟用靜態分析 | `true` |
| `security_checks` | 啟用安全檢查 | `true` |
| `quality_checks` | 啟用品質檢查 | `true` |
| `performance_checks` | 啟用效能檢查 | `true` |
| `comment_mode` | 評論樣式：`review`（審查）、`comment`（評論）、`summary`（摘要） | `review` |
| `fail_on_severity` | 嚴重級別失敗：`none`、`low`、`medium`、`high`、`critical` | `high` |

### 進階配置範例

```yaml
- name: CodeReviewAI 程式碼審查
  uses: gitstq/CodeReviewAI@v1
  with:
    ai_provider: 'anthropic'
    model: 'claude-3-5-sonnet-20241022'
    review_mode: 'security_only'
    review_comment_languages: 'zh-tw'
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

## 💡 設計理念

### 為什麼使用多模型？

不同的AI模型擅長不同的任務。CodeReviewAI 智慧地將請求路由到最合適的模型：

- **Claude** - 最適合複雜程式碼理解和安全分析
- **GPT-4** - 擅長一般程式碼審查和建議
- **Gemini** - 在效能最佳化和多語言支援方面表現出色
- **Ollama** - 適合注重隱私的本地部署團隊

### 靜態分析 + AI

雖然AI模型提供智慧洞察，但它們可能會錯過某些模式。我們的靜態分析引擎捕獲：

- 已知安全漏洞（OWASP Top 10）
- 常見反模式
- 效能瓶頸
- 程式碼品質問題

---

## 📦 部署指南

### GitHub Actions（推薦）

只需在工作流中引用該Action：

```yaml
uses: gitstq/CodeReviewAI@v1
```

### 自託管執行器

如果使用Ollama進行本地LLM推理：

```yaml
- name: CodeReviewAI
  uses: gitstq/CodeReviewAI@v1
  with:
    ai_provider: 'ollama'
    ollama_url: 'http://localhost:11434'
    ollama_model: 'codellama:7b'
```

---

## 🤝 貢獻指南

我們歡迎貢獻！請參閱 [CONTRIBUTING.md](CONTRIBUTING.md) 了解指南。

### 開發環境設定

```bash
# 複製儲存庫
git clone https://github.com/gitstq/CodeReviewAI.git
cd CodeReviewAI

# 安裝依賴
npm install

# 建置專案
npm run build

# 執行測試
npm test
```

---

## 📄 開源授權

本專案採用 MIT 授權條款 - 詳情請參閱 [LICENSE](LICENSE) 檔案。

---

<p align="center">
  用 ❤️ 由 CodeReviewAI 團隊製作
</p>
