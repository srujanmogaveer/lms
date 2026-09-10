import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { config } from '../config/env';
import { ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { EDUSPHERE_STUDENT_AI_BASE_PROMPT } from '../config/aiPrompt';
import type { LlmMessage, LlmRequestOptions, LlmResponse } from '../types';

export class LlmProviderService {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openAiClient: OpenAI | null = null;

  constructor() {
    this.initClients();
  }

  /**
   * Initializes SDK clients based on backend configuration
   */
  private initClients() {
    if (config.ai.geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(config.ai.geminiApiKey);
    }
    if (config.ai.openaiApiKey) {
      this.openAiClient = new OpenAI({ apiKey: config.ai.openaiApiKey });
    }
  }

  /**
   * Validates that the active AI provider is properly configured
   */
  public validateConfig(): void {
    if (config.ai.provider === 'gemini') {
      if (!config.ai.geminiApiKey || config.ai.geminiApiKey.includes('placeholder')) {
        throw ApiError.internal('Gemini AI Provider is not configured on the backend. Please verify GEMINI_API_KEY.');
      }
    } else if (config.ai.provider === 'openai') {
      if (!config.ai.openaiApiKey || config.ai.openaiApiKey.includes('placeholder')) {
        throw ApiError.internal('OpenAI Provider is not configured on the backend. Please verify OPENAI_API_KEY.');
      }
    } else {
      throw ApiError.internal(`Unsupported AI Provider: ${config.ai.provider}`);
    }
  }

  /**
   * Enforces request timeout promise wrapper
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(ApiError.internal(`AI request timed out after ${timeoutMs / 1000} seconds. Please try again.`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timer!);
      return result;
    } catch (err) {
      clearTimeout(timer!);
      throw err;
    }
  }

  /**
   * Sanitizes errors to prevent exposing raw API keys or internal stack traces
   */
  private sanitizeError(err: any): ApiError {
    logger.error('LLM Provider Error:', err);
    if (err instanceof ApiError) return err;

    const msg = String(err?.message || err || 'Unknown AI Provider error');

    if (msg.includes('API_KEY_INVALID') || msg.includes('incorrect API key') || msg.includes('401')) {
      return ApiError.internal('AI service authentication failed on the server. Please verify provider credentials.');
    }
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate limit') || msg.includes('429')) {
      return ApiError.badRequest('AI service rate limit exceeded. Please wait a moment before trying again.');
    }
    if (msg.includes('timed out')) {
      return ApiError.internal('AI service request timed out.');
    }

    return ApiError.internal('Failed to generate learning response from AI assistant. Please try again.');
  }

  /**
   * Generates a chat response using the configured real LLM provider
   */
  public async generateChatResponse(
    messages: LlmMessage[],
    options: LlmRequestOptions = {}
  ): Promise<LlmResponse> {
    this.validateConfig();

    const timeoutMs = options.timeoutMs || config.ai.requestTimeoutMs || 30000;
    const systemPrompt = (options.systemPrompt || EDUSPHERE_STUDENT_AI_BASE_PROMPT).trim();

    try {
      if (config.ai.provider === 'openai') {
        return await this.withTimeout(this.callOpenAi(messages, systemPrompt, options), timeoutMs);
      } else {
        return await this.withTimeout(this.callGemini(messages, systemPrompt, options), timeoutMs);
      }
    } catch (err) {
      throw this.sanitizeError(err);
    }
  }

  /**
   * Calls Google Gemini Generative AI SDK
   */
  private async callGemini(
    messages: LlmMessage[],
    systemPrompt: string,
    options: LlmRequestOptions
  ): Promise<LlmResponse> {
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenerativeAI(config.ai.geminiApiKey);
    }

    const modelName = config.ai.modelName || 'gemini-3.6-flash';
    const model = this.geminiClient.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    });

    const geminiHistory = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const latestUserText = lastMessage?.content || '';

    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        temperature: options.temperature ?? 0.4,
        maxOutputTokens: options.maxTokens ?? 1500,
      },
    });

    const result = await chat.sendMessage(latestUserText);
    const response = result.response;
    const responseText = response.text();

    const usageMetadata = response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || Math.ceil((systemPrompt.length + latestUserText.length) / 4);
    const outputTokens = usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4);

    return {
      content: responseText,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      model: modelName,
      provider: 'gemini',
    };
  }

  /**
   * Calls OpenAI Chat Completions SDK
   */
  private async callOpenAi(
    messages: LlmMessage[],
    systemPrompt: string,
    options: LlmRequestOptions
  ): Promise<LlmResponse> {
    if (!this.openAiClient) {
      this.openAiClient = new OpenAI({ apiKey: config.ai.openaiApiKey });
    }

    const modelName = config.ai.modelName || 'gpt-4o-mini';

    const openAiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      })),
    ];

    const completion = await this.openAiClient.chat.completions.create({
      model: modelName,
      messages: openAiMessages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 1500,
    });

    const content = completion.choices[0]?.message?.content || '';
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;

    return {
      content,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      model: modelName,
      provider: 'openai',
    };
  }
}

export const llmProvider = new LlmProviderService();
