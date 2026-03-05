import type { Project, AnalysisResult, DataTable, Analysis, Graph, GraphOptions, AnalysisTypeId, GraphTypeId } from '../types';
import { buildContext } from './context';
import { runAnalysis } from '../engine/statistics';
import { getAllowedAnalyses, getAllowedGraphTypes } from '../lib/tableRegistry';
import {
  runAnalysisArgsSchema,
  createGraphArgsSchema,
  updateGraphOptionsArgsSchema,
  createTableArgsSchema,
  listAnalysesArgsSchema,
  listGraphTypesArgsSchema,
} from './schemas';

export interface OrchestratorResult {
  success: boolean;
  outcomes: string[];
  error?: string;
}

export interface StoreActions {
  setProject: (p: Project) => void;
  addTable: (table: Omit<DataTable, 'id'>) => void;
  addAnalysis: (a: Omit<Analysis, 'id'>) => void;
  addGraph: (g: Omit<Graph, 'id'>) => void;
  updateAnalysisResult: (analysisId: string, result: AnalysisResult) => void;
  updateAnalysisError: (analysisId: string, error: string) => void;
  updateGraphOptions: (graphId: string, options: Partial<GraphOptions>) => void;
  setSelection: (s: Project['selection']) => void;
}

export type LLMCall = (messages: { role: 'system' | 'user' | 'assistant'; content: string }[], tools: unknown[]) => Promise<{
  content?: string;
  toolCalls?: { name: string; arguments: string }[];
}>;

export async function handleUserMessage(
  userMessage: string,
  getState: () => Project,
  actions: StoreActions,
  callLLM: LLMCall | null
): Promise<OrchestratorResult> {
  const outcomes: string[] = [];
  if (!callLLM) {
    return { success: false, outcomes: [], error: 'Chat requires an LLM. Set VITE_GROQ_API_KEY or VITE_ANTHROPIC_API_KEY in .env.local.' };
  }
  const context = buildContext(getState());
  const systemMessage = `You are a helpful assistant for a data analysis app (like GraphPad Prism). You have access to tools. Use the context below to answer. Only use the tools when the user asks to run an analysis, create a graph, create a table, or list options. Reply briefly.\n\nContext:\n${context}`;

  let messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage },
  ];

  try {
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'run_analysis',
          description: 'Run a statistical analysis on a table.',
          parameters: {
            type: 'object' as const,
            properties: {
              tableId: { type: 'string' as const },
              analysisType: { type: 'string' as const },
              options: { type: 'object' as const },
            },
            required: ['tableId', 'analysisType', 'options'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'create_graph',
          description: 'Create a new graph from a table.',
          parameters: {
            type: 'object' as const,
            properties: {
              tableId: { type: 'string' as const },
              graphType: { type: 'string' as const },
              analysisId: { type: 'string' as const },
              name: { type: 'string' as const },
            },
            required: ['tableId', 'graphType'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'create_table',
          description: 'Create a new data table.',
          parameters: {
            type: 'object' as const,
            properties: {
              format: { type: 'string' as const },
              name: { type: 'string' as const },
              columnLabels: { type: 'array' as const },
              xLabel: { type: 'string' as const },
              yLabels: { type: 'array' as const },
            },
            required: ['format', 'name'],
          },
        },
      },
    ];

    const response = await callLLM(messages, tools);
    const toolCalls = response.toolCalls ?? [];
    if (toolCalls.length === 0) {
      return { success: true, outcomes: [response.content ?? 'Done.'], error: undefined };
    }

    const project = getState();
    for (const call of toolCalls) {
      let args: unknown;
      try {
        args = JSON.parse(call.arguments || '{}');
      } catch {
        outcomes.push(`Invalid JSON in ${call.name}`);
        continue;
      }
      if (call.name === 'run_analysis') {
        const parsed = runAnalysisArgsSchema.safeParse(args);
        if (!parsed.success) {
          outcomes.push(`run_analysis: ${parsed.error.message}`);
          continue;
        }
        const table = project.tables.find((t) => t.id === parsed.data.tableId);
        if (!table) {
          outcomes.push(`Table ${parsed.data.tableId} not found.`);
          continue;
        }
        const result = runAnalysis(table.format, parsed.data.analysisType as 'descriptive' | 'unpaired_ttest' | 'one_way_anova' | 'linear_regression' | 'dose_response_4pl', table.data, parsed.data.options);
        actions.addAnalysis({
          tableId: parsed.data.tableId,
          type: parsed.data.analysisType as AnalysisTypeId,
          options: parsed.data.options,
        });
        const newProject = getState();
        const analysisId = newProject.selection?.type === 'analysis' ? newProject.selection.analysisId : null;
        if (analysisId) {
          if (result.ok) {
            actions.updateAnalysisResult(analysisId, result.value);
            outcomes.push(`Ran ${parsed.data.analysisType}.`);
          } else {
            actions.updateAnalysisError(analysisId, result.error);
            outcomes.push(`Error: ${result.error}`);
          }
        }
      } else if (call.name === 'create_graph') {
        const parsed = createGraphArgsSchema.safeParse(args);
        if (!parsed.success) {
          outcomes.push(`create_graph: ${parsed.error.message}`);
          continue;
        }
        const table = project.tables.find((t) => t.id === parsed.data.tableId);
        if (!table) {
          outcomes.push(`Table ${parsed.data.tableId} not found.`);
          continue;
        }
        const name = parsed.data.name ?? `Graph ${project.graphs.length + 1}`;
        actions.addGraph({
          name,
          tableId: parsed.data.tableId,
          analysisId: parsed.data.analysisId ?? null,
          graphType: parsed.data.graphType as GraphTypeId,
          options: {},
        });
        outcomes.push(`Created graph "${name}".`);
      } else if (call.name === 'update_graph_options') {
        const parsed = updateGraphOptionsArgsSchema.safeParse(args);
        if (!parsed.success) {
          outcomes.push(`update_graph_options: ${parsed.error.message}`);
          continue;
        }
        actions.updateGraphOptions(parsed.data.graphId, parsed.data.options);
        outcomes.push('Updated graph options.');
      } else if (call.name === 'create_table') {
        const parsed = createTableArgsSchema.safeParse(args);
        if (!parsed.success) {
          outcomes.push(`create_table: ${parsed.error.message}`);
          continue;
        }
        if (parsed.data.format === 'column') {
          const columnLabels = parsed.data.columnLabels ?? ['A', 'B'];
          actions.addTable({
            name: parsed.data.name,
            format: 'column',
            data: { columnLabels, rows: [] },
          });
        } else {
          const yLabels = parsed.data.yLabels ?? ['Y'];
          actions.addTable({
            name: parsed.data.name,
            format: 'xy',
            data: {
              xLabel: parsed.data.xLabel ?? 'X',
              yLabels,
              x: [],
              ys: yLabels.map(() => []),
            },
          });
        }
        outcomes.push(`Created table "${parsed.data.name}".`);
      } else if (call.name === 'list_analyses_for_table') {
        const parsed = listAnalysesArgsSchema.safeParse(args);
        if (parsed.success) {
          const table = project.tables.find((t) => t.id === parsed.data!.tableId);
          if (table) {
            const allowed = getAllowedAnalyses(table.format);
            const existing = project.analyses.filter((a) => a.tableId === table.id);
            outcomes.push(`Allowed: ${allowed.join(', ')}. Existing: ${existing.length} analyses.`);
          }
        }
      } else if (call.name === 'list_graph_types_for_table') {
        const parsed = listGraphTypesArgsSchema.safeParse(args);
        if (parsed.success) {
          const table = project.tables.find((t) => t.id === parsed.data!.tableId);
          if (table) {
            const types = getAllowedGraphTypes(table.format);
            outcomes.push(`Allowed graph types: ${types.join(', ')}.`);
          }
        }
      }
    }
    return { success: outcomes.length > 0, outcomes, error: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, outcomes: [], error: `LLM request failed: ${message}. Try again.` };
  }
}
