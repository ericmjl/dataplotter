import type { Result } from '../types';
import type { Project } from '../types';
import { CURRENT_PROJECT_VERSION } from '../types';
import { ProjectSchema, migrateProject } from './projectSchema';

export function importProject(json: string): Result<Project> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }
  const migrated = migrateProject(parsed) as { version?: number };
  if (
    typeof migrated.version === 'number' &&
    migrated.version > CURRENT_PROJECT_VERSION
  ) {
    return {
      ok: false,
      error: 'This file was created by a newer version. Please update the app.',
    };
  }
  const result = ProjectSchema.safeParse(migrated);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.message,
    };
  }
  return { ok: true, value: result.data as Project };
}
