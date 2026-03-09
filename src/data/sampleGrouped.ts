import type { GroupedTableData } from '../types';

/** @spec PRISM-TBL-021 Sample data for Grouped format: 2x2 (Male/Female x Control/Treated), replicates per cell. */
export const sampleGroupedData: GroupedTableData = {
  rowGroupLabels: ['Male', 'Female'],
  colGroupLabels: ['Control', 'Treated'],
  cellValues: [
    [
      [12, 14, 11, 13, 12],
      [18, 20, 19, 17, 21],
    ],
    [
      [10, 11, 12, 9, 11],
      [16, 17, 18, 15, 19],
    ],
  ],
};

export const sampleGroupedName = 'Sample grouped table';
