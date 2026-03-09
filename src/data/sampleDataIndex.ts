/**
 * Central index of sample data for each implemented table format.
 * @spec PRISM-TBL-021, PRISM-TBL-022
 */

import type { TableFormatId } from '../types';
import type {
  ColumnTableData,
  XYTableData,
  GroupedTableData,
  ContingencyTableData,
  SurvivalTableData,
  PartsOfWholeTableData,
} from '../types';
import { sampleColumnData, sampleColumnName } from './sampleColumn';
import { sampleXYData, sampleXYName } from './sampleXY';
import { sampleGroupedData, sampleGroupedName } from './sampleGrouped';
import { sampleContingencyData, sampleContingencyName } from './sampleContingency';
import { sampleSurvivalData, sampleSurvivalName } from './sampleSurvival';
import { samplePartsOfWholeData, samplePartsOfWholeName } from './samplePartsOfWhole';
import { validateTableData } from '../lib/tableRegistry';

export type SampleTableData =
  | ColumnTableData
  | XYTableData
  | GroupedTableData
  | ContingencyTableData
  | SurvivalTableData
  | PartsOfWholeTableData;

export interface SampleEntry {
  format: TableFormatId;
  name: string;
  data: SampleTableData;
}

const SAMPLE_ENTRIES: SampleEntry[] = [
  { format: 'column', name: sampleColumnName, data: sampleColumnData },
  { format: 'xy', name: sampleXYName, data: sampleXYData },
  { format: 'grouped', name: sampleGroupedName, data: sampleGroupedData },
  { format: 'contingency', name: sampleContingencyName, data: sampleContingencyData },
  { format: 'survival', name: sampleSurvivalName, data: sampleSurvivalData },
  { format: 'partsOfWhole', name: samplePartsOfWholeName, data: samplePartsOfWholeData },
];

export const SAMPLE_FORMATS: TableFormatId[] = SAMPLE_ENTRIES.map((e) => e.format);

/** All sample entries for Sidebar menu etc. */
export function getSampleEntries(): SampleEntry[] {
  return SAMPLE_ENTRIES;
}

/** Get sample name and data for a format, or null if no sample for that format. */
export function getSampleForFormat(
  format: TableFormatId
): { name: string; data: SampleTableData } | null {
  const entry = SAMPLE_ENTRIES.find((e) => e.format === format);
  return entry ? { name: entry.name, data: entry.data } : null;
}

/** Validate that all sample entries pass registry validation. Used by tests. */
export function validateAllSamples(): { format: TableFormatId; ok: boolean; error?: string }[] {
  return SAMPLE_ENTRIES.map((entry) => {
    const result = validateTableData(entry.format, entry.data);
    if (result.valid) return { format: entry.format, ok: true };
    return { format: entry.format, ok: false, error: result.errors?.[0] ?? 'Validation failed' };
  });
}
