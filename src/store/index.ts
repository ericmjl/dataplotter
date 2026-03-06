import { create } from 'zustand';
import {
  createProjectSlice,
  initialProjectState,
  type ProjectState,
  type ProjectActions,
} from './projectSlice';
import {
  createUISlice,
  initialUIState,
  type UIState,
  type UIActions,
} from './uiSlice';
import {
  createSettingsSlice,
  initialSettingsState,
  type SettingsState,
  type SettingsActions,
} from './settingsSlice';

export type StoreState = ProjectState & { ui: UIState; settings: SettingsState } & ProjectActions & UIActions & SettingsActions;

export const useStore = create<StoreState>((set) => ({
  ...initialProjectState,
  ui: initialUIState,
  settings: initialSettingsState,
  ...createProjectSlice((fn) =>
    set((state) => fn({ project: state.project }) as Partial<StoreState>)
  ),
  ...createUISlice((fn) =>
    set((state) => fn({ ui: state.ui }) as Partial<StoreState>)
  ),
  ...createSettingsSlice((fn) =>
    set((state) => fn({ settings: state.settings }) as Partial<StoreState>)
  ),
}));
