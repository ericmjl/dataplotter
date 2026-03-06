/**
 * @spec TRANSFORM-002
 */

import { describe, it, expect } from 'vitest';
import { evaluateEquation } from './equationEval';

const colVars = new Set(['col0', 'col1']);
const xyVars = new Set(['x', 'y0', 'y1']);

describe('evaluateEquation', () => {
  it('evaluates a simple number', () => {
    expect(evaluateEquation('42', {}, colVars)).toBe(42);
  });

  it('evaluates variable from scope', () => {
    expect(evaluateEquation('col0', { col0: 10 }, colVars)).toBe(10);
    expect(evaluateEquation('x', { x: 3 }, xyVars)).toBe(3);
  });

  it('returns null for disallowed variable', () => {
    expect(evaluateEquation('col0', { col0: 1 }, new Set())).toBe(null);
    expect(evaluateEquation('evil', { evil: 1 }, colVars)).toBe(null);
  });

  it('returns null when variable value is null', () => {
    expect(evaluateEquation('col0', { col0: null }, colVars)).toBe(null);
  });

  it('evaluates arithmetic', () => {
    expect(evaluateEquation('col0 + col1', { col0: 2, col1: 3 }, colVars)).toBe(5);
    expect(evaluateEquation('col0 - col1', { col0: 5, col1: 2 }, colVars)).toBe(3);
    expect(evaluateEquation('col0 * col1', { col0: 4, col1: 5 }, colVars)).toBe(20);
    expect(evaluateEquation('col0 / col1', { col0: 10, col1: 2 }, colVars)).toBe(5);
  });

  it('returns null on division by zero', () => {
    expect(evaluateEquation('col0 / col1', { col0: 1, col1: 0 }, colVars)).toBe(null);
  });

  it('evaluates log10', () => {
    expect(evaluateEquation('log10(y0)', { y0: 100 }, xyVars)).toBe(2);
    expect(evaluateEquation('log10(1000)', {}, colVars)).toBeCloseTo(3);
  });

  it('returns null for log10 of non-positive', () => {
    expect(evaluateEquation('log10(y0)', { y0: 0 }, xyVars)).toBe(null);
    expect(evaluateEquation('log10(y0)', { y0: -1 }, xyVars)).toBe(null);
  });

  it('evaluates sqrt and abs', () => {
    expect(evaluateEquation('sqrt(16)', {}, colVars)).toBe(4);
    expect(evaluateEquation('abs(col0)', { col0: -7 }, colVars)).toBe(7);
  });

  it('evaluates min and max', () => {
    expect(evaluateEquation('min(col0, col1)', { col0: 10, col1: 3 }, colVars)).toBe(3);
    expect(evaluateEquation('max(col0, col1)', { col0: 10, col1: 3 }, colVars)).toBe(10);
  });

  it('evaluates parentheses', () => {
    expect(evaluateEquation('(col0 + col1) * 2', { col0: 1, col1: 2 }, colVars)).toBe(6);
  });

  it('returns null for invalid expression', () => {
    expect(evaluateEquation('', {}, colVars)).toBe(null);
    expect(evaluateEquation('col0 +', { col0: 1 }, colVars)).toBe(null);
    expect(evaluateEquation('log10()', {}, colVars)).toBe(null);
  });
});
