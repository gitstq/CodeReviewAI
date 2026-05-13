import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { Config } from '../config';
import { AIProvider } from '../types';
import { logger } from '../utils/logger';

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.gemini_api_key);
  }

  async review(prompt: string): Promise<string> {
    try {
      const modelName = this.config.model || 'gemini-1.5-flash';
      
      logger.info(`Sending request to Gemini (${modelName})...`);

      const model = this.client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: this.config.max_tokens,
          temperature: this.config.temperature,
        },
      });

      const contents: Content[] = [
        {
          role: 'user',
          parts: [
            { text: 'You are an expert code reviewer. Provide detailed, actionable feedback in JSON format.' },
          ],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I will review code and provide feedback in JSON format.' }],
        },
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ];

      const result = await model.generateContent({ contents });
      const content = result.response.text();
      
      logger.info(`Received response from Gemini (${content.length} chars)`);
      
      return content;
    } catch (error) {
      logger.error(`Gemini API error: ${error}`);
      throw error;
    }
  }
}
