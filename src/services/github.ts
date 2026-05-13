import * as github from '@actions/github';
import { ReviewResult, FileReview, Issue } from '../types';
import { logger } from '../utils/logger';

export class GitHubService {
  private octokit: ReturnType<typeof github.getOctokit>;
  private context: typeof github.context;

  constructor(token: string) {
    this.octokit = github.getOctokit(token);
    this.context = github.context;
  }

  async getPRInfo(): Promise<{ number: number; title: string; body: string; head: string; base: string }> {
    const { data: pr } = await this.octokit.rest.pulls.get({
      owner: this.context.repo.owner,
      repo: this.context.repo.repo,
      pull_number: this.context.issue.number,
    });

    return {
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      head: pr.head.sha,
      base: pr.base.sha,
    };
  }

  async getPRDiff(): Promise<string> {
    const response = await this.octokit.rest.pulls.get({
      owner: this.context.repo.owner,
      repo: this.context.repo.repo,
      pull_number: this.context.issue.number,
      mediaType: {
        format: 'diff',
      },
    });

    // The diff is returned as a string in the data property when using mediaType format
    return response.data as unknown as string;
  }

  async postReview(results: ReviewResult): Promise<void> {
    const { data: review } = await this.octokit.rest.pulls.createReview({
      owner: this.context.repo.owner,
      repo: this.context.repo.repo,
      pull_number: this.context.issue.number,
      body: this.buildReviewBody(results),
      event: results.hasCriticalIssues ? 'REQUEST_CHANGES' : 'COMMENT',
      comments: this.buildReviewComments(results),
    });

    logger.info(`Posted review: ${review.html_url}`);
  }

  async postComments(results: ReviewResult): Promise<void> {
    // Get the latest commit SHA for the PR
    const prInfo = await this.getPRInfo();
    
    for (const file of results.files) {
      for (const issue of file.issues) {
        try {
          await this.octokit.rest.pulls.createReviewComment({
            owner: this.context.repo.owner,
            repo: this.context.repo.repo,
            pull_number: this.context.issue.number,
            body: this.formatIssue(issue),
            commit_id: prInfo.head,
            path: file.filename,
            line: issue.line,
            side: 'RIGHT',
          });
        } catch (error) {
          logger.warn(`Failed to post comment for ${file.filename}:${issue.line}: ${error}`);
        }
      }
    }
  }

  async postSummary(results: ReviewResult): Promise<void> {
    await this.octokit.rest.issues.createComment({
      owner: this.context.repo.owner,
      repo: this.context.repo.repo,
      issue_number: this.context.issue.number,
      body: this.buildReviewBody(results),
    });
  }

  private buildReviewBody(results: ReviewResult): string {
    const lines: string[] = [];

    // Header
    lines.push('## 🤖 CodeReviewAI Report');
    lines.push('');

    // Summary
    lines.push('### 📊 Summary');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Files Reviewed | ${results.summary.filesReviewed} / ${results.summary.totalFiles} |`);
    lines.push(`| Total Issues | ${results.summary.issuesFound} |`);
    lines.push(`| 🔴 Critical | ${results.summary.criticalIssues} |`);
    lines.push(`| 🟠 High | ${results.summary.highIssues} |`);
    lines.push(`| 🟡 Medium | ${results.summary.mediumIssues} |`);
    lines.push(`| 🟢 Low | ${results.summary.lowIssues} |`);
    lines.push(`| ⏱️ Review Time | ${results.reviewTime}ms |`);
    lines.push('');

    // Status
    if (results.hasCriticalIssues) {
      lines.push('❌ **Critical issues found. Please address them before merging.**');
    } else if (results.summary.issuesFound > 0) {
      lines.push('⚠️ **Issues found. Please review the comments below.**');
    } else {
      lines.push('✅ **No issues found. Great job!**');
    }
    lines.push('');

    // Files with issues
    if (results.files.length > 0) {
      lines.push('### 📁 Files with Issues');
      lines.push('');
      
      for (const file of results.files) {
        const criticalCount = file.issues.filter(i => i.severity === 'critical').length;
        const highCount = file.issues.filter(i => i.severity === 'high').length;
        
        lines.push(`- **${file.filename}**`);
        lines.push(`  - Issues: ${file.issues.length}`);
        if (criticalCount > 0) lines.push(`  - 🔴 Critical: ${criticalCount}`);
        if (highCount > 0) lines.push(`  - 🟠 High: ${highCount}`);
      }
      lines.push('');
    }

    // Footer
    lines.push('---');
    lines.push('*Powered by [CodeReviewAI](https://github.com/yourusername/codereview-ai)*');

    return lines.join('\n');
  }

  private buildReviewComments(results: ReviewResult): any[] {
    const comments: any[] = [];

    for (const file of results.files) {
      for (const issue of file.issues) {
        comments.push({
          path: file.filename,
          line: issue.line,
          side: 'RIGHT',
          body: this.formatIssue(issue),
        });
      }
    }

    return comments;
  }

  private formatIssue(issue: Issue): string {
    const severityEmoji: Record<string, string> = {
      'critical': '🔴',
      'high': '🟠',
      'medium': '🟡',
      'low': '🟢',
      'info': '🔵',
    };

    const categoryEmoji: Record<string, string> = {
      'security': '🔒',
      'quality': '✨',
      'performance': '⚡',
      'style': '🎨',
      'documentation': '📝',
    };

    const lines: string[] = [];
    lines.push(`${severityEmoji[issue.severity]} **${this.capitalize(issue.severity)}** ${categoryEmoji[issue.category]} ${this.capitalize(issue.category)}`);
    lines.push('');
    lines.push(`**Issue:** ${issue.message}`);
    
    if (issue.suggestion) {
      lines.push('');
      lines.push(`**Suggestion:** ${issue.suggestion}`);
    }

    return lines.join('\n');
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
