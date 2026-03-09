/**
 * @spec PRISM-TBL-021
 */

import { describe, it, expect } from 'vitest';
import {
  getSampleEntries,
  getSampleForFormat,
  validateAllSamples,
  SAMPLE_FORMATS,
} from './sampleDataIndex';
import type { TableFormatId } from '../types';

const IMPLEMENTED_FORMATS: TableFormatId[] = [
  'column',
  'xy',
  'grouped',
  'contingency',
  'survival',
  'partsOfWhole',
];

describe('sampleDataIndex', () => {
  it('exports exactly one sample entry per implemented format', () => {
    const entries = getSampleEntries();
    expect(entries.length).toBe(IMPLEMENTED_FORMATS.length);
    const formats = entries.map((e) => e.format).sort();
    expect(formats).toEqual([...IMPLEMENTED_FORMATS].sort());
  });

  it('SAMPLE_FORMATS matches getSampleEntries formats', () => {
    expect(SAMPLE_FORMATS.sort()).toEqual(IMPLEMENTED_FORMATS.sort());
  });

  it('each sample entry has name and data', () => {
    const entries = getSampleEntries();
    for (const entry of entries) {
      expect(entry.name).toBeTruthy();
      expect(typeof entry.name).toBe('string');
      expect(entry.data).toBeDefined();
      expect(typeof entry.data).toBe('object');
    }
  });

  it('getSampleForFormat returns name and data for each implemented format', () => {
    for (const format of IMPLEMENTED_FORMATS) {
      const sample = getSampleForFormat(format);
      expect(sample).not.toBeNull();
      expect(sample!.name).toBeTruthy();
      expect(sample!.data).toBeDefined();
    }
  });

  it('getSampleForFormat returns null for deferred formats', () => {
    expect(getSampleForFormat('multipleVariables')).toBeNull();
    expect(getSampleForFormat('nested')).toBeNull();
  });

  it('validateAllSamples: every sample passes validateTableData', () => {
    const results = validateAllSamples();
    expect(results.length).toBe(IMPLEMENTED_FORMATS.length);
    for (const r of results) {
      expect(r.ok, `Format ${r.format} should validate: ${r.error ?? ''}`).toBe(true);
    }
  });
});
