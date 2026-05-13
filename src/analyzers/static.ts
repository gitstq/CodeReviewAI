import { Config } from '../config';
import { DiffFile, Issue, StaticAnalysisResult } from '../types';
import { logger } from '../utils/logger';

export class StaticAnalyzer {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async analyze(file: DiffFile): Promise<Issue[]> {
    const issues: Issue[] = [];
    const language = this.detectLanguage(file.filename);

    // Security checks
    if (this.config.security_checks) {
      const securityIssues = this.checkSecurity(file, language);
      issues.push(...securityIssues);
    }

    // Quality checks
    if (this.config.quality_checks) {
      const qualityIssues = this.checkQuality(file, language);
      issues.push(...qualityIssues);
    }

    // Performance checks
    if (this.config.performance_checks) {
      const performanceIssues = this.checkPerformance(file, language);
      issues.push(...performanceIssues);
    }

    return issues;
  }

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
    };

    return languageMap[ext] || 'unknown';
  }

  private checkSecurity(file: DiffFile, language: string): Issue[] {
    const issues: Issue[] = [];
    const content = file.diff;

    // Common security patterns
    const securityPatterns: Array<{ pattern: RegExp; message: string; severity: Issue['severity'] }> = [
      // SQL Injection
      {
        pattern: /(SELECT|INSERT|UPDATE|DELETE|DROP).*\+.*\$\{/i,
        message: 'Potential SQL injection vulnerability detected. Use parameterized queries.',
        severity: 'critical',
      },
      {
        pattern: /execute\s*\(\s*["\'].*\$\{/i,
        message: 'Potential SQL injection in execute() call. Use parameterized queries.',
        severity: 'critical',
      },
      // XSS
      {
        pattern: /innerHTML\s*=.*\$\{/,
        message: 'Potential XSS vulnerability. Avoid using innerHTML with user input.',
        severity: 'high',
      },
      {
        pattern: /dangerouslySetInnerHTML/,
        message: 'Using dangerouslySetInnerHTML can lead to XSS. Ensure content is sanitized.',
        severity: 'high',
      },
      // Hardcoded secrets
      {
        pattern: /(password|secret|token|key|api_key)\s*=\s*["\'][^"\']{8,}["\']/i,
        message: 'Potential hardcoded secret detected. Use environment variables.',
        severity: 'critical',
      },
      // Eval usage
      {
        pattern: /\beval\s*\(/,
        message: 'Using eval() is dangerous and can lead to code injection.',
        severity: 'high',
      },
      // Insecure randomness
      {
        pattern: /Math\.random\s*\(\s*\)/,
        message: 'Math.random() is not cryptographically secure. Use crypto.randomBytes() for security-sensitive operations.',
        severity: 'medium',
      },
    ];

    for (const { pattern, message, severity } of securityPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        // Find line number
        const lines = content.split('\n');
        let lineNumber = 0;
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            lineNumber = i + 1;
            break;
          }
        }

        issues.push({
          line: lineNumber,
          severity,
          category: 'security',
          message,
          suggestion: 'Review and fix this security issue immediately.',
          source: 'static',
          rule: pattern.source,
        });
      }
    }

    // Language-specific security checks
    if (language === 'python') {
      issues.push(...this.checkPythonSecurity(file));
    } else if (language === 'javascript' || language === 'typescript') {
      issues.push(...this.checkJavaScriptSecurity(file));
    }

    return issues;
  }

  private checkPythonSecurity(file: DiffFile): Issue[] {
    const issues: Issue[] = [];
    const content = file.diff;

    const patterns: Array<{ pattern: RegExp; message: string; severity: Issue['severity'] }> = [
      {
        pattern: /pickle\.loads?\s*\(/,
        message: 'Using pickle can lead to arbitrary code execution. Use json for untrusted data.',
        severity: 'high',
      },
      {
        pattern: /yaml\.load\s*\(/,
        message: 'yaml.load() without Loader is unsafe. Use yaml.safe_load() instead.',
        severity: 'high',
      },
      {
        pattern: /subprocess\.call\s*\(\s*shell\s*=\s*True/,
        message: 'Using shell=True with subprocess is dangerous. Avoid it if possible.',
        severity: 'high',
      },
      {
        pattern: /exec\s*\(/,
        message: 'Using exec() can lead to code injection. Consider safer alternatives.',
        severity: 'high',
      },
    ];

    for (const { pattern, message, severity } of patterns) {
      if (pattern.test(content)) {
        issues.push({
          line: 0,
          severity,
          category: 'security',
          message,
          suggestion: 'Replace with a safer alternative.',
          source: 'static',
          rule: pattern.source,
        });
      }
    }

    return issues;
  }

  private checkJavaScriptSecurity(file: DiffFile): Issue[] {
    const issues: Issue[] = [];
    const content = file.diff;

    const patterns: Array<{ pattern: RegExp; message: string; severity: Issue['severity'] }> = [
      {
        pattern: /document\.write\s*\(/,
        message: 'document.write() can lead to XSS vulnerabilities. Use safer DOM manipulation methods.',
        severity: 'medium',
      },
      {
        pattern: /window\.location\s*=\s*[^;]*\+/,
        message: 'Potential open redirect vulnerability. Validate URLs before redirection.',
        severity: 'medium',
      },
    ];

    for (const { pattern, message, severity } of patterns) {
      if (pattern.test(content)) {
        issues.push({
          line: 0,
          severity,
          category: 'security',
          message,
          suggestion: 'Use safer alternatives.',
          source: 'static',
          rule: pattern.source,
        });
      }
    }

    return issues;
  }

  private checkQuality(file: DiffFile, language: string): Issue[] {
    const issues: Issue[] = [];
    const content = file.diff;

    // Common quality patterns
    const qualityPatterns: Array<{ pattern: RegExp; message: string; severity: Issue['severity'] }> = [
      {
        pattern: /console\.(log|debug|warn|error)\s*\(/,
        message: 'Debug console statements should be removed before production.',
        severity: 'low',
      },
      {
        pattern: /TODO|FIXME|XXX|HACK/,
        message: 'Code contains TODO/FIXME comments. Consider addressing them.',
        severity: 'info',
      },
      {
        pattern: /var\s+/,
        message: 'Using var is discouraged. Use let or const instead.',
        severity: 'low',
      },
    ];

    for (const { pattern, message, severity } of qualityPatterns) {
      if (pattern.test(content)) {
        issues.push({
          line: 0,
          severity,
          category: 'quality',
          message,
          suggestion: 'Review and fix this quality issue.',
          source: 'static',
          rule: pattern.source,
        });
      }
    }

    return issues;
  }

  private checkPerformance(file: DiffFile, language: string): Issue[] {
    const issues: Issue[] = [];
    const content = file.diff;

    // Performance patterns
    const perfPatterns: Array<{ pattern: RegExp; message: string; severity: Issue['severity'] }> = [
      {
        pattern: /for\s*\([^)]*\)\s*\{[^}]*for\s*\(/,
        message: 'Nested loops detected. Consider optimizing algorithm complexity.',
        severity: 'medium',
      },
      {
        pattern: /\.map\s*\([^)]*\)\.filter\s*\(/,
        message: 'Chaining map() and filter() creates intermediate arrays. Consider using reduce() for better performance.',
        severity: 'low',
      },
    ];

    for (const { pattern, message, severity } of perfPatterns) {
      if (pattern.test(content)) {
        issues.push({
          line: 0,
          severity,
          category: 'performance',
          message,
          suggestion: 'Consider performance optimization.',
          source: 'static',
          rule: pattern.source,
        });
      }
    }

    return issues;
  }
}
