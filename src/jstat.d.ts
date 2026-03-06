declare module 'jstat' {
  const jStat: {
    mean(arr: number[]): number;
    median(arr: number[]): number;
    stdev(arr: number[], flag?: boolean): number;
    percentile(arr: number[], k: number, exclusive?: boolean): number;
    anovafscore(...groups: number[][]): number;
    anovaftest(f: number, df1: number, df2: number): number;
    builddxmatrix(rows: number[][]): unknown;
    buildymatrix(arr: number[]): unknown;
    regress(X: unknown, Y: unknown): number[];
    regresst(X: unknown, Y: unknown, sides: number): {
      anova: { r2: number };
      stats?: Array<[number, number, number, number]>;
    };
    studentt: {
      cdf(x: number, df: number): number;
      inv(p: number, df: number): number;
    };
    chisquare: {
      cdf(x: number, df: number): number;
    };
    normal: {
      cdf(x: number, mean?: number, std?: number): number;
    };
  };
  export default jStat;
}
