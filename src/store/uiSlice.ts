export type ActiveTab = 'tables' | 'analyses' | 'graphs';

export interface UIState {
  activeTab: ActiveTab;
  chatOpen: boolean;
}

export const initialUIState: UIState = {
  activeTab: 'tables',
  chatOpen: false,
};

export interface UIActions {
  setActiveTab: (tab: ActiveTab) => void;
  setChatOpen: (open: boolean) => void;
}

export function createUISlice(
  set: (fn: (state: { ui: UIState }) => Partial<{ ui: UIState }>) => void
) {
  return {
    setActiveTab: (tab: ActiveTab) => {
      set((state) => ({ ui: { ...state.ui, activeTab: tab } }));
    },
    setChatOpen: (open: boolean) => {
      set((state) => ({ ui: { ...state.ui, chatOpen: open } }));
    },
  };
}
