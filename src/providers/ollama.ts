import { Config } from '../config';
import { AIProvider } from '../types';
import { logger } from '../utils/logger';

export class OllamaProvider implements AIProvider {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async review(prompt: string): Promise<string> {
    try {
      const model = this.config.ollama_model;
      const url = `${this.config.ollama_url}/api/generate`;
      
      logger.info(`Sending request to Ollama (${model}) at ${url}...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: `You are an expert code reviewer. Provide detailed, actionable feedback in JSON format.\n\n${prompt}`,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.max_tokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.response || '';
      
      logger.info(`Received response from Ollama (${content.length} chars)`);
      
      return content;
    } catch (error) {
      logger.error(`Ollama API error: ${error}`);
      throw error;
    }
  }
}
