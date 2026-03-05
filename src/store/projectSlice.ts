import { nanoid } from 'nanoid';
import type {
  Project,
  DataTable,
  Analysis,
  Graph,
  Selection,
  ColumnTableData,
  XYTableData,
  AnalysisResult,
} from '../types';
import { CURRENT_PROJECT_VERSION } from '../types';

export interface ProjectState {
  project: Project;
}

function emptyProject(): Project {
  return {
    version: CURRENT_PROJECT_VERSION,
    tables: [],
    analyses: [],
    graphs: [],
    selection: null,
  };
}

export const initialProjectState: ProjectState = {
  project: emptyProject(),
};

export interface ProjectActions {
  setProject: (project: Project) => void;
  addTable: (table: Omit<DataTable, 'id'>) => void;
  removeTable: (tableId: string) => void;
  updateTableData: (
    tableId: string,
    data: ColumnTableData | XYTableData
  ) => void;
  addAnalysis: (analysis: Omit<Analysis, 'id'>) => void;
  removeAnalysis: (analysisId: string) => void;
  updateAnalysisResult: (analysisId: string, result: AnalysisResult) => void;
  updateAnalysisError: (analysisId: string, error: string) => void;
  clearAnalysisResult: (analysisId: string) => void;
  addGraph: (graph: Omit<Graph, 'id'>) => void;
  removeGraph: (graphId: string) => void;
  updateGraphOptions: (
    graphId: string,
    options: Partial<Graph['options']>
  ) => void;
  setSelection: (selection: Selection) => void;
}

export function createProjectSlice(
  set: (fn: (state: ProjectState) => Partial<ProjectState>) => void
) {
  return {
    ...initialProjectState,

    setProject: (project: Project) => {
      set(() => ({ project }));
    },

    addTable: (table: Omit<DataTable, 'id'>) => {
      const id = nanoid();
      set((state) => ({
        project: {
          ...state.project,
          tables: [...state.project.tables, { ...table, id }],
          selection: state.project.selection ?? { type: 'table', tableId: id },
        },
      }));
    },

    removeTable: (tableId: string) => {
      set((state) => {
        const tables = state.project.tables.filter((t) => t.id !== tableId);
        const analyses = state.project.analyses.filter(
          (a) => a.tableId !== tableId
        );
        const graphs = state.project.graphs.filter(
          (g) => g.tableId !== tableId
        );
        let selection = state.project.selection;
        if (selection?.type === 'table' && selection.tableId === tableId) {
          selection = tables[0] ? { type: 'table', tableId: tables[0].id } : null;
        }
        if (selection?.type === 'analysis' && analyses.every((a) => a.id !== (selection as { type: 'analysis'; analysisId: string }).analysisId)) {
          selection = null;
        }
        if (selection?.type === 'graph' && graphs.every((g) => g.id !== (selection as { type: 'graph'; graphId: string }).graphId)) {
          selection = null;
        }
        return {
          project: {
            ...state.project,
            tables,
            analyses,
            graphs,
            selection,
          },
        };
      });
    },

    updateTableData: (
      tableId: string,
      data: ColumnTableData | XYTableData
    ) => {
      set((state) => {
        const tables = state.project.tables.map((t) =>
          t.id === tableId ? { ...t, data } : t
        );
        const analyses = state.project.analyses.map((a) => {
          if (a.tableId !== tableId) return a;
          return { ...a, result: undefined, error: undefined };
        });
        return {
          project: {
            ...state.project,
            tables,
            analyses,
          },
        };
      });
    },

    addAnalysis: (analysis: Omit<Analysis, 'id'>) => {
      const id = nanoid();
      set((state) => ({
        project: {
          ...state.project,
          analyses: [...state.project.analyses, { ...analysis, id }],
          selection: { type: 'analysis', analysisId: id },
        },
      }));
    },

    removeAnalysis: (analysisId: string) => {
      set((state) => {
        const analyses = state.project.analyses.filter(
          (a) => a.id !== analysisId
        );
        const graphs = state.project.graphs.map((g) =>
          g.analysisId === analysisId ? { ...g, analysisId: undefined } : g
        );
        let selection = state.project.selection;
        if (selection?.type === 'analysis' && selection.analysisId === analysisId) {
          selection = null;
        }
        return {
          project: {
            ...state.project,
            analyses,
            graphs,
            selection,
          },
        };
      });
    },

    updateAnalysisResult: (analysisId: string, result: AnalysisResult) => {
      set((state) => ({
        project: {
          ...state.project,
          analyses: state.project.analyses.map((a) =>
            a.id === analysisId
              ? { ...a, result, error: undefined }
              : a
          ),
        },
      }));
    },

    updateAnalysisError: (analysisId: string, error: string) => {
      set((state) => ({
        project: {
          ...state.project,
          analyses: state.project.analyses.map((a) =>
            a.id === analysisId
              ? { ...a, error, result: undefined }
              : a
          ),
        },
      }));
    },

    clearAnalysisResult: (analysisId: string) => {
      set((state) => ({
        project: {
          ...state.project,
          analyses: state.project.analyses.map((a) =>
            a.id === analysisId ? { ...a, result: undefined, error: undefined } : a
          ),
        },
      }));
    },

    addGraph: (graph: Omit<Graph, 'id'>) => {
      const id = nanoid();
      set((state) => ({
        project: {
          ...state.project,
          graphs: [...state.project.graphs, { ...graph, id }],
          selection: { type: 'graph', graphId: id },
        },
      }));
    },

    removeGraph: (graphId: string) => {
      set((state) => {
        const graphs = state.project.graphs.filter((g) => g.id !== graphId);
        let selection = state.project.selection;
        if (selection?.type === 'graph' && selection.graphId === graphId) {
          selection = null;
        }
        return {
          project: {
            ...state.project,
            graphs,
            selection,
          },
        };
      });
    },

    updateGraphOptions: (
      graphId: string,
      options: Partial<Graph['options']>
    ) => {
      set((state) => ({
        project: {
          ...state.project,
          graphs: state.project.graphs.map((g) =>
            g.id === graphId
              ? { ...g, options: { ...g.options, ...options } }
              : g
          ),
        },
      }));
    },

    setSelection: (selection: Selection) => {
      set((state) => ({
        project: { ...state.project, selection },
      }));
    },
  };
}
