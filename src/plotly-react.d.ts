declare module 'react-plotly.js' {
  import type { ComponentType } from 'react';
  interface PlotParams {
    data: unknown[];
    layout?: Partial<Record<string, unknown>>;
    config?: Partial<Record<string, unknown>>;
    onInitialized?: (figure: unknown, graphDiv: HTMLDivElement) => void;
    onClick?: (event: { points: Array<{ x: string | number; y: number; pointNumber: number; curveNumber: number }> }) => void;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
  }
  const Plot: ComponentType<PlotParams>;
  export default Plot;
}

declare module 'plotly.js' {
  const Plotly: {
    toImage(
      root: HTMLElement,
      opts: { format: 'png' | 'svg'; width: number; height: number }
    ): Promise<string>;
    Layout: unknown;
  };
  export default Plotly;
}
