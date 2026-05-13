import Anthropic from '@anthropic-ai/sdk';
import { Config } from '../config';
import { AIProvider } from '../types';
import { logger } from '../utils/logger';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.anthropic_api_key,
    });
  }

  async review(prompt: string): Promise<string> {
    try {
      const model = this.config.model || 'claude-3-5-sonnet-20241022';
      
      logger.info(`Sending request to Anthropic (${model})...`);

      const response = await this.client.messages.create({
        model: model,
        max_tokens: this.config.max_tokens,
        temperature: this.config.temperature,
        system: 'You are an expert code reviewer. Provide detailed, actionable feedback in JSON format.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '';
      
      logger.info(`Received response from Anthropic (${content.length} chars)`);
      
      return content;
    } catch (error) {
      logger.error(`Anthropic API error: ${error}`);
      throw error;
    }
  }
}
