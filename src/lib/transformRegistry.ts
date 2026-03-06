/**
 * Pre-defined column transformations. Each applies to a single value.
 * @spec TRANSFORM-001 (pre-defined)
 */

import type { TransformId } from '../types/transformations';

export type { TransformId };

export interface PredefinedTransform {
  id: TransformId;
  label: string;
  /** Apply to a single value; return null for invalid (e.g. log of ≤0). */
  fn: (v: number | null) => number | null;
}

export const PREDEFINED_TRANSFORMS: PredefinedTransform[] = [
  { id: 'log10', label: 'Log (base 10)', fn: (v) => (v != null && v > 0 && Number.isFinite(v) ? Math.log10(v) : null) },
  { id: 'ln', label: 'Ln (natural log)', fn: (v) => (v != null && v > 0 && Number.isFinite(v) ? Math.log(v) : null) },
  { id: 'log2', label: 'Log₂', fn: (v) => (v != null && v > 0 && Number.isFinite(v) ? Math.log2(v) : null) },
  { id: 'sqrt', label: 'Square root', fn: (v) => (v != null && v >= 0 && Number.isFinite(v) ? Math.sqrt(v) : null) },
  { id: 'square', label: 'Square (x²)', fn: (v) => (v != null && Number.isFinite(v) ? v * v : null) },
  { id: 'exp', label: 'eˣ', fn: (v) => (v != null && Number.isFinite(v) ? Math.exp(v) : null) },
  { id: 'abs', label: 'Absolute value', fn: (v) => (v != null && Number.isFinite(v) ? Math.abs(v) : null) },
  { id: 'reciprocal', label: 'Reciprocal (1/x)', fn: (v) => (v != null && v !== 0 && Number.isFinite(v) ? 1 / v : null) },
];

const byId = new Map<TransformId, PredefinedTransform>(PREDEFINED_TRANSFORMS.map((t) => [t.id, t]));

export function getTransformById(id: string): PredefinedTransform | undefined {
  return byId.get(id as TransformId);
}

export function getTransformLabel(id: string): string {
  return getTransformById(id)?.label ?? id;
}
