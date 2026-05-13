import OpenAI from 'openai';
import { Config } from '../config';
import { AIProvider } from '../types';
import { logger } from '../utils/logger';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.openai_api_key,
    });
  }

  async review(prompt: string): Promise<string> {
    try {
      const model = this.config.model || 'gpt-4o-mini';
      
      logger.info(`Sending request to OpenAI (${model})...`);

      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer. Provide detailed, actionable feedback in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.config.max_tokens,
        temperature: this.config.temperature,
      });

      const content = response.choices[0]?.message?.content || '';
      logger.info(`Received response from OpenAI (${content.length} chars)`);
      
      return content;
    } catch (error) {
      logger.error(`OpenAI API error: ${error}`);
      throw error;
    }
  }
}
