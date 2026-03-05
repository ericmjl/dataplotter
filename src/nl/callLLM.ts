import { generateText, tool } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LLMCall } from './orchestrator';
import {
  runAnalysisArgsSchema,
  createGraphArgsSchema,
  updateGraphOptionsArgsSchema,
  createTableArgsSchema,
  listAnalysesArgsSchema,
  listGraphTypesArgsSchema,
} from './schemas';

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
const OPENAI_COMPATIBLE_BASE_URL = import.meta.env.VITE_OPENAI_COMPATIBLE_BASE_URL as string | undefined;
const OPENAI_COMPATIBLE_API_KEY = import.meta.env.VITE_OPENAI_COMPATIBLE_API_KEY as string | undefined;
const OPENAI_COMPATIBLE_MODEL = (import.meta.env.VITE_OPENAI_COMPATIBLE_MODEL as string | undefined)?.trim() || 'gpt-4o-mini';

function getModel() {
  if (GROQ_KEY?.trim()) {
    const groq = createGroq({ apiKey: GROQ_KEY });
    return { model: groq('openai/gpt-oss-120b'), provider: 'groq' as const };
  }
  if (ANTHROPIC_KEY?.trim()) {
    const anthropic = createAnthropic({ apiKey: ANTHROPIC_KEY });
    return { model: anthropic('claude-sonnet-4-20250514'), provider: 'anthropic' as const };
  }
  if (OPENAI_COMPATIBLE_BASE_URL?.trim() && OPENAI_COMPATIBLE_API_KEY?.trim()) {
    const openai = createOpenAI({
      baseURL: OPENAI_COMPATIBLE_BASE_URL.trim(),
      apiKey: OPENAI_COMPATIBLE_API_KEY.trim(),
    });
    return { model: openai(OPENAI_COMPATIBLE_MODEL), provider: 'openai-compatible' as const };
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

export const callLLM: LLMCall | null = (() => {
  const modelConfig = getModel();
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
})();

export function getLLMProvider(): 'groq' | 'anthropic' | 'openai-compatible' | null {
  if (GROQ_KEY?.trim()) return 'groq';
  if (ANTHROPIC_KEY?.trim()) return 'anthropic';
  if (OPENAI_COMPATIBLE_BASE_URL?.trim() && OPENAI_COMPATIBLE_API_KEY?.trim()) return 'openai-compatible';
  return null;
}
