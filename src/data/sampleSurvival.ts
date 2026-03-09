import type { SurvivalTableData } from '../types';

/** @spec PRISM-TBL-021 Sample data for Survival format: time + event, two groups (Drug vs Placebo). */
export const sampleSurvivalData: SurvivalTableData = {
  timeLabel: 'Time (months)',
  eventLabel: 'Event',
  times: [2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 3, 5, 7, 9, 11, 13, 15, 17],
  events: [1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0],
  groups: [
    'Drug',
    'Drug',
    'Drug',
    'Drug',
    'Drug',
    'Drug',
    'Drug',
    'Drug',
    'Drug',
    'Drug',
    'Placebo',
    'Placebo',
    'Placebo',
    'Placebo',
    'Placebo',
    'Placebo',
    'Placebo',
    'Placebo',
  ],
};

export const sampleSurvivalName = 'Sample survival table';
