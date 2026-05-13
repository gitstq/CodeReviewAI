import { Issue, IssueSeverity } from '../types';
import { logger } from './logger';

export class ResponseParser {
  static parseAIResponse(response: string): { issues: Issue[] } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                       response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        logger.warn('No JSON found in AI response');
        return { issues: [] };
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      if (!parsed.issues || !Array.isArray(parsed.issues)) {
        logger.warn('No issues array found in AI response');
        return { issues: [] };
      }

      const issues: Issue[] = parsed.issues.map((issue: any) => this.normalizeIssue(issue));
      
      logger.info(`Parsed ${issues.length} issues from AI response`);
      return { issues };
    } catch (error) {
      logger.warn(`Failed to parse AI response: ${error}`);
      return { issues: [] };
    }
  }

  private static normalizeIssue(issue: any): Issue {
    return {
      line: parseInt(issue.line) || 0,
      column: issue.column ? parseInt(issue.column) : undefined,
      severity: this.normalizeSeverity(issue.severity),
      category: this.normalizeCategory(issue.category),
      message: String(issue.message || 'Unknown issue'),
      suggestion: issue.suggestion ? String(issue.suggestion) : undefined,
      code: issue.code ? String(issue.code) : undefined,
      source: 'ai',
      rule: issue.rule ? String(issue.rule) : undefined,
    };
  }

  private static normalizeSeverity(severity: string): IssueSeverity {
    const normalized = String(severity).toLowerCase().trim();
    
    const severityMap: Record<string, IssueSeverity> = {
      'critical': 'critical',
      'crit': 'critical',
      'c': 'critical',
      'high': 'high',
      'h': 'high',
      'error': 'high',
      'e': 'high',
      'medium': 'medium',
      'med': 'medium',
      'm': 'medium',
      'warning': 'medium',
      'w': 'medium',
      'low': 'low',
      'l': 'low',
      'info': 'info',
      'i': 'info',
      'information': 'info',
      'suggestion': 'info',
    };

    return severityMap[normalized] || 'info';
  }

  private static normalizeCategory(category: string): Issue['category'] {
    const normalized = String(category).toLowerCase().trim();
    
    const categoryMap: Record<string, Issue['category']> = {
      'security': 'security',
      'vulnerability': 'security',
      'vuln': 'security',
      'quality': 'quality',
      'maintainability': 'quality',
      'code-quality': 'quality',
      'performance': 'performance',
      'perf': 'performance',
      'optimization': 'performance',
      'style': 'style',
      'formatting': 'style',
      'documentation': 'documentation',
      'docs': 'documentation',
    };

    return categoryMap[normalized] || 'quality';
  }

  static formatIssueForComment(issue: Issue, language: string = 'en'): string {
    const severityEmoji: Record<IssueSeverity, string> = {
      'critical': '🔴',
      'high': '🟠',
      'medium': '🟡',
      'low': '🟢',
      'info': '🔵',
    };

    const categoryEmoji: Record<Issue['category'], string> = {
      'security': '🔒',
      'quality': '✨',
      'performance': '⚡',
      'style': '🎨',
      'documentation': '📝',
    };

    const lines: string[] = [];
    
    lines.push(`${severityEmoji[issue.severity]} **${this.capitalize(issue.severity)}** ${categoryEmoji[issue.category]} ${this.capitalize(issue.category)}`);
    lines.push('');
    lines.push(`**${this.getMessageLabel(language)}:** ${issue.message}`);
    
    if (issue.suggestion) {
      lines.push('');
      lines.push(`**${this.getSuggestionLabel(language)}:** ${issue.suggestion}`);
    }

    if (issue.code) {
      lines.push('');
      lines.push(`**${this.getCodeLabel(language)}:**`);
      lines.push('```');
      lines.push(issue.code);
      lines.push('```');
    }

    return lines.join('\n');
  }

  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private static getMessageLabel(language: string): string {
    const labels: Record<string, string> = {
      'en': 'Issue',
      'zh': '问题',
      'zh-tw': '問題',
      'ja': '問題',
      'ko': '문제',
    };
    return labels[language] || labels['en'];
  }

  private static getSuggestionLabel(language: string): string {
    const labels: Record<string, string> = {
      'en': 'Suggestion',
      'zh': '建议',
      'zh-tw': '建議',
      'ja': '提案',
      'ko': '제안',
    };
    return labels[language] || labels['en'];
  }

  private static getCodeLabel(language: string): string {
    const labels: Record<string, string> = {
      'en': 'Code',
      'zh': '代码',
      'zh-tw': '程式碼',
      'ja': 'コード',
      'ko': '코드',
    };
    return labels[language] || labels['en'];
  }
}
