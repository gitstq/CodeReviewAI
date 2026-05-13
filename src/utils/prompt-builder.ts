import { Config } from '../config';
import { DiffFile, Issue } from '../types';

export class PromptBuilder {
  static buildReviewPrompt(file: DiffFile, staticIssues: Issue[], config: Config): string {
    const language = this.detectLanguage(file.filename);
    const reviewFocus = this.getReviewFocus(config);
    
    let prompt = this.getSystemPrompt(config.review_comment_languages[0]);
    
    prompt += `\n\n## File Information\n`;
    prompt += `- Filename: ${file.filename}\n`;
    prompt += `- Language: ${language}\n`;
    prompt += `- Status: ${file.status}\n`;
    prompt += `- Additions: ${file.additions}\n`;
    prompt += `- Deletions: ${file.deletions}\n`;

    if (staticIssues.length > 0) {
      prompt += `\n## Static Analysis Issues Found\n`;
      for (const issue of staticIssues) {
        prompt += `- Line ${issue.line}: [${issue.severity.toUpperCase()}] ${issue.message}\n`;
      }
    }

    prompt += `\n## Code Diff\n\`\`\`${language}\n`;
    prompt += file.diff;
    prompt += `\n\`\`\`\n`;

    prompt += `\n## Review Focus\n${reviewFocus}\n`;

    prompt += `\n## Output Format\n`;
    prompt += `Please provide your review in the following JSON format:\n`;
    prompt += `\`\`\`json\n`;
    prompt += `{\n`;
    prompt += `  "issues": [\n`;
    prompt += `    {\n`;
    prompt += `      "line": <line_number>,\n`;
    prompt += `      "severity": "critical|high|medium|low|info",\n`;
    prompt += `      "category": "security|quality|performance|style|documentation",\n`;
    prompt += `      "message": "<clear description of the issue>",\n`;
    prompt += `      "suggestion": "<specific suggestion to fix>"\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}\n`;
    prompt += `\`\`\`\n`;

    if (config.custom_prompt) {
      prompt += `\n## Additional Instructions\n${config.custom_prompt}\n`;
    }

    return prompt;
  }

  private static getSystemPrompt(language: string): string {
    const prompts: Record<string, string> = {
      'en': `You are an expert code reviewer with deep knowledge of software engineering best practices, security vulnerabilities, and performance optimization. Your task is to review code changes and provide actionable feedback.

Review Guidelines:
1. Focus on critical issues: security vulnerabilities, bugs, and performance bottlenecks
2. Check for code quality: readability, maintainability, and adherence to best practices
3. Identify potential edge cases and error handling issues
4. Suggest specific improvements with code examples when possible
5. Be concise but thorough in your explanations

Severity Levels:
- CRITICAL: Security vulnerabilities, potential crashes, data loss risks
- HIGH: Logic errors, significant performance issues, major anti-patterns
- MEDIUM: Code smells, minor performance issues, maintainability concerns
- LOW: Style issues, minor improvements, documentation gaps
- INFO: Suggestions, best practice reminders`,

      'zh': `你是一位拥有软件工程最佳实践、安全漏洞和性能优化深入知识的专家代码审查员。你的任务是审查代码更改并提供可操作的反馈。

审查指南：
1. 重点关注关键问题：安全漏洞、错误和性能瓶颈
2. 检查代码质量：可读性、可维护性和对最佳实践的遵循
3. 识别潜在的边缘情况和错误处理问题
4. 尽可能提供具体的改进建议和代码示例
5. 解释要简洁但全面

严重级别：
- CRITICAL（严重）: 安全漏洞、潜在崩溃、数据丢失风险
- HIGH（高）: 逻辑错误、重大性能问题、主要反模式
- MEDIUM（中）: 代码异味、轻微性能问题、可维护性问题
- LOW（低）: 风格问题、轻微改进、文档缺失
- INFO（信息）: 建议、最佳实践提醒`,

      'zh-tw': `你是一位擁有軟體工程最佳實踐、安全漏洞和效能優化深入知識的專家程式碼審查員。你的任務是審查程式碼變更並提供可操作的回饋。

審查指南：
1. 重點關注關鍵問題：安全漏洞、錯誤和效能瓶頸
2. 檢查程式碼品質：可讀性、可維護性和對最佳實踐的遵循
3. 識別潛在的邊緣情況和錯誤處理問題
4. 盡可能提供具體的改進建議和程式碼範例
5. 解釋要簡潔但全面

嚴重級別：
- CRITICAL（嚴重）: 安全漏洞、潛在崩潰、資料遺失風險
- HIGH（高）: 邏輯錯誤、重大效能問題、主要反模式
- MEDIUM（中）: 程式碼異味、輕微效能問題、可維護性問題
- LOW（低）: 風格問題、輕微改進、文件缺失
- INFO（資訊）: 建議、最佳實踐提醒`,
    };

    return prompts[language] || prompts['en'];
  }

  private static detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'r': 'r',
      'sql': 'sql',
      'sh': 'bash',
      'yaml': 'yaml',
      'yml': 'yaml',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'md': 'markdown',
      'dockerfile': 'dockerfile',
    };

    return languageMap[ext] || 'text';
  }

  private static getReviewFocus(config: Config): string {
    const focuses: string[] = [];

    if (config.security_checks) {
      focuses.push('- Security vulnerabilities (SQL injection, XSS, CSRF, etc.)');
    }
    if (config.quality_checks) {
      focuses.push('- Code quality and maintainability');
    }
    if (config.performance_checks) {
      focuses.push('- Performance optimization opportunities');
    }

    if (focuses.length === 0) {
      focuses.push('- General code review (quality, security, performance)');
    }

    return focuses.join('\n');
  }

  static buildSummaryPrompt(results: any, language: string): string {
    const prompts: Record<string, string> = {
      'en': `Summarize the following code review results in a concise, actionable format. Highlight critical issues and provide recommendations.`,
      'zh': `以简洁、可操作的格式总结以下代码审查结果。突出显示关键问题并提供建议。`,
      'zh-tw': `以簡潔、可操作的格式總結以下程式碼審查結果。突出顯示關鍵問題並提供建議。`,
    };

    return `${prompts[language] || prompts['en']}\n\n${JSON.stringify(results, null, 2)}`;
  }
}
