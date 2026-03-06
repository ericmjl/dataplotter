import { generateText, tool } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LLMCall } from './orchestrator';
import type { LLMSettings } from '../store/settingsSlice';
import {
  runAnalysisArgsSchema,
  createGraphArgsSchema,
  updateGraphOptionsArgsSchema,
  createTableArgsSchema,
  listAnalysesArgsSchema,
  listGraphTypesArgsSchema,
} from './schemas';

/** In development only: fall back to env if settings are empty. Never use in production build. */
function getEffectiveConfig(storeSettings: LLMSettings): LLMSettings {
  if (import.meta.env.PROD) return storeSettings;
  const groq = (storeSettings.groqApiKey?.trim() || (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim()) ?? '';
  const anthropic = (storeSettings.anthropicApiKey?.trim() || (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined)?.trim()) ?? '';
  const baseUrl = (storeSettings.openaiCompatibleBaseUrl?.trim() || (import.meta.env.VITE_OPENAI_COMPATIBLE_BASE_URL as string | undefined)?.trim()) ?? '';
  const openaiKey = (storeSettings.openaiCompatibleApiKey?.trim() || (import.meta.env.VITE_OPENAI_COMPATIBLE_API_KEY as string | undefined)?.trim()) ?? '';
  const model = (storeSettings.openaiCompatibleModel?.trim() || (import.meta.env.VITE_OPENAI_COMPATIBLE_MODEL as string | undefined)?.trim()) || 'gpt-4o-mini';
  return { groqApiKey: groq, anthropicApiKey: anthropic, openaiCompatibleBaseUrl: baseUrl, openaiCompatibleApiKey: openaiKey, openaiCompatibleModel: model };
}

function buildModelFromConfig(config: LLMSettings): { model: ReturnType<ReturnType<typeof createGroq>>; provider: 'groq' } | { model: ReturnType<ReturnType<typeof createAnthropic>>; provider: 'anthropic' } | { model: ReturnType<ReturnType<typeof createOpenAI>>; provider: 'openai-compatible' } | null {
  if (config.groqApiKey?.trim()) {
    const groq = createGroq({ apiKey: config.groqApiKey.trim() });
    return { model: groq('openai/gpt-oss-120b'), provider: 'groq' };
  }
  if (config.anthropicApiKey?.trim()) {
    const anthropic = createAnthropic({ apiKey: config.anthropicApiKey.trim() });
    return { model: anthropic('claude-sonnet-4-20250514'), provider: 'anthropic' };
  }
  if (config.openaiCompatibleBaseUrl?.trim() && config.openaiCompatibleApiKey?.trim()) {
    const openai = createOpenAI({
      baseURL: config.openaiCompatibleBaseUrl.trim(),
      apiKey: config.openaiCompatibleApiKey.trim(),
    });
    return { model: openai(config.openaiCompatibleModel?.trim() || 'gpt-4o-mini'), provider: 'openai-compatible' };
  }
  return null;
}

const tools = {
  run_analysis: tool({
    description: 'Run a statistical analysis on a table.',
    inputSchema: runAnalysisArgsSchema,
  }),
  create_graph: tool({
    description: 'Create a new graph from a table.',
    inputSchema: createGraphArgsSchema,
  }),
  update_graph_options: tool({
    description: 'Update options (title, axis labels, etc.) for a graph.',
    inputSchema: updateGraphOptionsArgsSchema,
  }),
  create_table: tool({
    description: 'Create a new data table.',
    inputSchema: createTableArgsSchema,
  }),
  list_analyses_for_table: tool({
    description: 'List allowed analysis types for a table and existing analyses.',
    inputSchema: listAnalysesArgsSchema,
  }),
  list_graph_types_for_table: tool({
    description: 'List allowed graph types for a table.',
    inputSchema: listGraphTypesArgsSchema,
  }),
};

/**
 * Returns an LLM call function for the given config, or null if no provider is configured.
 * Config should come from the settings store (or getEffectiveConfig(store.llm) for dev fallback).
 */
export function getLLMCall(storeSettings: LLMSettings): LLMCall | null {
  const config = getEffectiveConfig(storeSettings);
  const modelConfig = buildModelFromConfig(config);
  if (!modelConfig) return null;

  return async (messages, _tools) => {
    const { model } = modelConfig;
    const systemMessage = messages.find((m) => m.role === 'system')?.content;
    const otherMessages = messages.filter((m) => m.role !== 'system');

    const result = await generateText({
      model,
      system: systemMessage ?? undefined,
      messages: otherMessages.map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
      tools,
    });

    const content = result.text ?? undefined;
    const toolCalls = (result.toolCalls ?? []).map((tc) => ({
      name: tc.toolName,
      arguments: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input ?? {}),
    }));

    return { content, toolCalls };
  };
}

export function getLLMProvider(storeSettings: LLMSettings): 'groq' | 'anthropic' | 'openai-compatible' | null {
  const config = getEffectiveConfig(storeSettings);
  if (config.groqApiKey?.trim()) return 'groq';
  if (config.anthropicApiKey?.trim()) return 'anthropic';
  if (config.openaiCompatibleBaseUrl?.trim() && config.openaiCompatibleApiKey?.trim()) return 'openai-compatible';
  return null;
}
