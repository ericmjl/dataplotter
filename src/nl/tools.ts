export const NL_TOOLS = [
  {
    name: 'run_analysis',
    description: 'Run a statistical analysis on a table.',
    parameters: {
      type: 'object',
      properties: {
        tableId: { type: 'string', description: 'ID of the table' },
        analysisType: {
          type: 'string',
          enum: ['descriptive', 'unpaired_ttest', 'one_way_anova', 'linear_regression', 'dose_response_4pl'],
          description: 'Type of analysis',
        },
        options: {
          type: 'object',
          description: 'Analysis options; for unpaired_ttest use { type: "unpaired_ttest", columnLabels: ["Label1", "Label2"] }; for descriptive use { type: "descriptive" }',
        },
      },
      required: ['tableId', 'analysisType', 'options'],
    },
  },
  {
    name: 'create_graph',
    description: 'Create a new graph from a table.',
    parameters: {
      type: 'object',
      properties: {
        tableId: { type: 'string' },
        graphType: {
          type: 'string',
          enum: ['bar', 'scatter', 'line', 'scatterLine', 'doseResponse'],
        },
        analysisId: { type: 'string', description: 'Optional linked analysis ID' },
        name: { type: 'string', description: 'Graph name' },
      },
      required: ['tableId', 'graphType'],
    },
  },
  {
    name: 'update_graph_options',
    description: 'Update options (title, axis labels, etc.) of a graph.',
    parameters: {
      type: 'object',
      properties: {
        graphId: { type: 'string' },
        options: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            xAxisLabel: { type: 'string' },
            yAxisLabel: { type: 'string' },
          },
        },
      },
      required: ['graphId', 'options'],
    },
  },
  {
    name: 'create_table',
    description: 'Create a new data table.',
    parameters: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['xy', 'column'] },
        name: { type: 'string' },
        columnLabels: { type: 'array', items: { type: 'string' } },
        xLabel: { type: 'string' },
        yLabels: { type: 'array', items: { type: 'string' } },
      },
      required: ['format', 'name'],
    },
  },
  {
    name: 'list_analyses_for_table',
    description: 'List allowed analysis types and existing analyses for a table (read-only).',
    parameters: {
      type: 'object',
      properties: { tableId: { type: 'string' } },
      required: ['tableId'],
    },
  },
  {
    name: 'list_graph_types_for_table',
    description: 'List allowed graph types for a table (read-only).',
    parameters: {
      type: 'object',
      properties: { tableId: { type: 'string' } },
      required: ['tableId'],
    },
  },
] as const;
