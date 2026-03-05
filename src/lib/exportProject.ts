import type { Project } from '../types';

export function exportProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}
