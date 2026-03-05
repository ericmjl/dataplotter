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

export type StoreState = ProjectState & { ui: UIState } & ProjectActions & UIActions;

export const useStore = create<StoreState>((set) => ({
  ...initialProjectState,
  ui: initialUIState,
  ...createProjectSlice((fn) =>
    set((state) => fn({ project: state.project }) as Partial<StoreState>)
  ),
  ...createUISlice((fn) =>
    set((state) => fn({ ui: state.ui }) as Partial<StoreState>)
  ),
}));
