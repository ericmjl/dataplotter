import type { ContingencyTableData } from '../types';

/** @spec PRISM-TBL-021 Sample data for Contingency format: 2x2 (Treatment x Response). */
export const sampleContingencyData: ContingencyTableData = {
  rowLabels: ['Treatment A', 'Treatment B'],
  columnLabels: ['Response Yes', 'Response No'],
  counts: [
    [23, 7],
    [11, 19],
  ],
};

export const sampleContingencyName = 'Sample contingency table';
