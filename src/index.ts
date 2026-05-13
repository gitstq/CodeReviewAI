import * as core from '@actions/core';
import * as github from '@actions/github';
import { CodeReviewEngine } from './engine';
import { Config } from './config';
import { GitHubService } from './services/github';
import { logger } from './utils/logger';

async function run(): Promise<void> {
  try {
    logger.info('🚀 CodeReviewAI Starting...');
    
    // Load configuration
    const config = Config.load();
    logger.info(`Configuration loaded: ${JSON.stringify(config, null, 2)}`);
    
    // Initialize GitHub service
    const githubService = new GitHubService(config.github_token);
    
    // Get PR information
    const prInfo = await githubService.getPRInfo();
    logger.info(`Reviewing PR #${prInfo.number}: ${prInfo.title}`);
    
    // Initialize and run review engine
    const engine = new CodeReviewEngine(config, githubService);
    const results = await engine.review();
    
    // Post results
    await engine.postResults(results);
    
    // Check if we should fail the workflow
    const shouldFail = results.hasCriticalIssues && config.fail_on_severity !== 'none';
    if (shouldFail) {
      core.setFailed('❌ Critical issues found in code review');
    } else {
      logger.info('✅ Code review completed successfully');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ CodeReviewAI failed: ${errorMessage}`);
    core.setFailed(`CodeReviewAI failed: ${errorMessage}`);
  }
}

// Run the action
run();
