import { Config } from '../config';
import { AIProvider } from '../types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';
import { logger } from '../utils/logger';

export class AIProviderFactory {
  static create(config: Config): AIProvider {
    const provider = Config.getActiveProvider(config);
    
    logger.info(`Using AI provider: ${provider}`);

    switch (provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'gemini':
        return new GeminiProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }
}
