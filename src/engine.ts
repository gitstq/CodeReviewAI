import { Config } from './config';
import { GitHubService } from './services/github';
import { AIProviderFactory } from './providers/factory';
import { StaticAnalyzer } from './analyzers/static';
import { DiffParser } from './utils/diff-parser';
import { PromptBuilder } from './utils/prompt-builder';
import { ResponseParser } from './utils/response-parser';
import { logger } from './utils/logger';
import { ReviewResult, FileReview, IssueSeverity } from './types';

export class CodeReviewEngine {
  private config: Config;
  private githubService: GitHubService;
  private aiProvider: any;
  private staticAnalyzer: StaticAnalyzer;
  private diffParser: DiffParser;

  constructor(config: Config, githubService: GitHubService) {
    this.config = config;
    this.githubService = githubService;
    this.aiProvider = AIProviderFactory.create(config);
    this.staticAnalyzer = new StaticAnalyzer(config);
    this.diffParser = new DiffParser(config);
  }

  async review(): Promise<ReviewResult> {
    logger.info('🔍 Starting code review process...');

    const startTime = Date.now();
    const results: ReviewResult = {
      files: [],
      summary: {
        totalFiles: 0,
        filesReviewed: 0,
        issuesFound: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
      },
      hasCriticalIssues: false,
      reviewTime: 0,
    };

    try {
      // Get PR diff
      const diff = await this.githubService.getPRDiff();
      const files = this.diffParser.parse(diff);

      logger.info(`📁 Found ${files.length} files in PR`);

      // Filter files based on configuration
      const filteredFiles = this.filterFiles(files);
      results.summary.totalFiles = files.length;
      results.summary.filesReviewed = filteredFiles.length;

      logger.info(`🔎 Reviewing ${filteredFiles.length} files after filtering`);

      // Review each file
      for (const file of filteredFiles) {
        try {
          const fileReview = await this.reviewFile(file);
          if (fileReview) {
            results.files.push(fileReview);
            this.updateSummary(results, fileReview);
          }
        } catch (error) {
          logger.error(`Error reviewing file ${file.filename}: ${error}`);
        }
      }

      // Check for critical issues
      results.hasCriticalIssues = results.summary.criticalIssues > 0;
      results.reviewTime = Date.now() - startTime;

      logger.info(`✅ Review completed in ${results.reviewTime}ms`);
      logger.info(`📊 Summary: ${JSON.stringify(results.summary, null, 2)}`);

      return results;
    } catch (error) {
      logger.error(`Review process failed: ${error}`);
      throw error;
    }
  }

  private async reviewFile(file: any): Promise<FileReview | null> {
    logger.info(`🔍 Reviewing: ${file.filename}`);

    // Skip binary files
    if (file.isBinary) {
      logger.info(`⏭️ Skipping binary file: ${file.filename}`);
      return null;
    }

    // Run static analysis if enabled
    let staticIssues: any[] = [];
    if (this.config.enable_static_analysis) {
      try {
        staticIssues = await this.staticAnalyzer.analyze(file);
        logger.info(`📋 Static analysis found ${staticIssues.length} issues in ${file.filename}`);
      } catch (error) {
        logger.warn(`Static analysis failed for ${file.filename}: ${error}`);
      }
    }

    // Build prompt for AI review
    const prompt = PromptBuilder.buildReviewPrompt(file, staticIssues, this.config);

    // Get AI review
    let aiReview: any = null;
    try {
      const aiResponse = await this.aiProvider.review(prompt);
      aiReview = ResponseParser.parseAIResponse(aiResponse);
      logger.info(`🤖 AI review found ${aiReview.issues?.length || 0} issues in ${file.filename}`);
    } catch (error) {
      logger.warn(`AI review failed for ${file.filename}: ${error}`);
    }

    // Combine results
    const combinedIssues = this.combineIssues(staticIssues, aiReview?.issues || []);

    // Skip if no issues found
    if (combinedIssues.length === 0) {
      logger.info(`✨ No issues found in ${file.filename}`);
      return null;
    }

    return {
      filename: file.filename,
      issues: combinedIssues,
      staticAnalysisIssues: staticIssues.length,
      aiReviewIssues: aiReview?.issues?.length || 0,
    };
  }

  private filterFiles(files: any[]): any[] {
    return files.filter(file => {
      // Check include patterns
      if (this.config.include_patterns.length > 0) {
        const included = this.config.include_patterns.some(pattern =>
          this.matchPattern(file.filename, pattern)
        );
        if (!included) return false;
      }

      // Check exclude patterns
      const excluded = this.config.exclude_patterns.some(pattern =>
        this.matchPattern(file.filename, pattern)
      );
      if (excluded) return false;

      // Check file limit
      if (files.indexOf(file) >= this.config.max_files) {
        return false;
      }

      return true;
    });
  }

  private matchPattern(filename: string, pattern: string): boolean {
    // Simple glob matching
    const regex = pattern
      .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<<DOUBLESTAR>>>/g, '.*')
      .replace(/\?/g, '.');
    
    const regExp = new RegExp(`^${regex}$`);
    return regExp.test(filename);
  }

  private combineIssues(staticIssues: any[], aiIssues: any[]): any[] {
    const combined = [...staticIssues];

    for (const aiIssue of aiIssues) {
      // Check for duplicates
      const isDuplicate = staticIssues.some(staticIssue =>
        staticIssue.line === aiIssue.line &&
        staticIssue.message.toLowerCase().includes(aiIssue.message.toLowerCase().substring(0, 20))
      );

      if (!isDuplicate) {
        combined.push(aiIssue);
      }
    }

    return combined;
  }

  private updateSummary(results: ReviewResult, fileReview: FileReview): void {
    results.summary.issuesFound += fileReview.issues.length;

    for (const issue of fileReview.issues) {
      switch (issue.severity) {
        case 'critical':
          results.summary.criticalIssues++;
          break;
        case 'high':
          results.summary.highIssues++;
          break;
        case 'medium':
          results.summary.mediumIssues++;
          break;
        case 'low':
          results.summary.lowIssues++;
          break;
      }
    }
  }

  async postResults(results: ReviewResult): Promise<void> {
    logger.info('💬 Posting review results...');

    if (this.config.comment_mode === 'review') {
      await this.githubService.postReview(results);
    } else if (this.config.comment_mode === 'comment') {
      await this.githubService.postComments(results);
    } else if (this.config.comment_mode === 'summary') {
      await this.githubService.postSummary(results);
    }

    logger.info('✅ Results posted successfully');
  }
}
