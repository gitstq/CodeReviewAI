import * as core from '@actions/core';

export interface Config {
  // AI Provider Configuration
  ai_provider: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'auto';
  openai_api_key: string;
  anthropic_api_key: string;
  gemini_api_key: string;
  ollama_url: string;
  ollama_model: string;

  // Model Configuration
  model: string;
  max_tokens: number;
  temperature: number;

  // Review Configuration
  review_mode: 'full' | 'incremental' | 'security_only' | 'performance_only';
  review_comment_languages: string[];
  exclude_patterns: string[];
  include_patterns: string[];
  max_files: number;
  max_diff_size: number;

  // Static Analysis Configuration
  enable_static_analysis: boolean;
  security_checks: boolean;
  quality_checks: boolean;
  performance_checks: boolean;

  // Output Configuration
  comment_mode: 'review' | 'comment' | 'summary';
  post_general_comments: boolean;
  fail_on_severity: 'none' | 'low' | 'medium' | 'high' | 'critical';

  // Advanced Configuration
  custom_prompt: string;
  context_files: string[];
  ignore_comments_from: string[];

  // GitHub Configuration
  github_token: string;
}

export class Config {
  static load(): Config {
    const config: Config = {
      // AI Provider Configuration
      ai_provider: this.getInput('ai_provider', 'auto') as Config['ai_provider'],
      openai_api_key: this.getInput('openai_api_key', ''),
      anthropic_api_key: this.getInput('anthropic_api_key', ''),
      gemini_api_key: this.getInput('gemini_api_key', ''),
      ollama_url: this.getInput('ollama_url', 'http://localhost:11434'),
      ollama_model: this.getInput('ollama_model', 'codellama:7b'),

      // Model Configuration
      model: this.getInput('model', ''),
      max_tokens: parseInt(this.getInput('max_tokens', '4000')),
      temperature: parseFloat(this.getInput('temperature', '0.1')),

      // Review Configuration
      review_mode: this.getInput('review_mode', 'incremental') as Config['review_mode'],
      review_comment_languages: this.getInput('review_comment_languages', 'en').split(',').map(s => s.trim()),
      exclude_patterns: this.getInput('exclude_patterns', '**/*.lock,**/*.min.js,**/*.min.css,**/dist/**,**/node_modules/**')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0),
      include_patterns: this.getInput('include_patterns', '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0),
      max_files: parseInt(this.getInput('max_files', '50')),
      max_diff_size: parseInt(this.getInput('max_diff_size', '500')),

      // Static Analysis Configuration
      enable_static_analysis: this.getBooleanInput('enable_static_analysis', true),
      security_checks: this.getBooleanInput('security_checks', true),
      quality_checks: this.getBooleanInput('quality_checks', true),
      performance_checks: this.getBooleanInput('performance_checks', true),

      // Output Configuration
      comment_mode: this.getInput('comment_mode', 'review') as Config['comment_mode'],
      post_general_comments: this.getBooleanInput('post_general_comments', true),
      fail_on_severity: this.getInput('fail_on_severity', 'high') as Config['fail_on_severity'],

      // Advanced Configuration
      custom_prompt: this.getInput('custom_prompt', ''),
      context_files: this.getInput('context_files', '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0),
      ignore_comments_from: this.getInput('ignore_comments_from', '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0),

      // GitHub Configuration
      github_token: process.env.GITHUB_TOKEN || core.getInput('github_token', { required: true }),
    };

    // Validate configuration
    Config.validate(config);

    return config;
  }

  private static getInput(name: string, defaultValue: string): string {
    const value = core.getInput(name);
    return value || defaultValue;
  }

  private static getBooleanInput(name: string, defaultValue: boolean): boolean {
    const value = core.getInput(name);
    if (value === '') return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private static validate(config: Config): void {
    // Validate AI provider configuration
    if (config.ai_provider === 'openai' && !config.openai_api_key) {
      throw new Error('OpenAI API key is required when using OpenAI provider');
    }
    if (config.ai_provider === 'anthropic' && !config.anthropic_api_key) {
      throw new Error('Anthropic API key is required when using Anthropic provider');
    }
    if (config.ai_provider === 'gemini' && !config.gemini_api_key) {
      throw new Error('Gemini API key is required when using Gemini provider');
    }

    // Validate temperature range
    if (config.temperature < 0 || config.temperature > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }

    // Validate max tokens
    if (config.max_tokens < 100 || config.max_tokens > 16000) {
      throw new Error('Max tokens must be between 100 and 16000');
    }
  }

  static getActiveProvider(config: Config): string {
    if (config.ai_provider !== 'auto') {
      return config.ai_provider;
    }

    // Auto-select based on available API keys
    if (config.anthropic_api_key) return 'anthropic';
    if (config.openai_api_key) return 'openai';
    if (config.gemini_api_key) return 'gemini';
    
    return 'ollama';
  }
}
