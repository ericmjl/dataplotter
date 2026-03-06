/**
 * Runtime LLM configuration. Never read from build-time env in production.
 * Persisted under a key separate from project autosave.
 */
export const LLM_SETTINGS_STORAGE_KEY = 'dataplotter-llm-settings';

export interface LLMSettings {
  groqApiKey: string;
  anthropicApiKey: string;
  openaiCompatibleBaseUrl: string;
  openaiCompatibleApiKey: string;
  openaiCompatibleModel: string;
}

export const defaultLLMSettings: LLMSettings = {
  groqApiKey: '',
  anthropicApiKey: '',
  openaiCompatibleBaseUrl: '',
  openaiCompatibleApiKey: '',
  openaiCompatibleModel: 'gpt-4o-mini',
};

function loadLLMSettingsFromStorage(): LLMSettings {
  try {
    const raw = localStorage.getItem(LLM_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...defaultLLMSettings };
    const parsed = JSON.parse(raw) as Partial<LLMSettings>;
    return {
      groqApiKey: typeof parsed.groqApiKey === 'string' ? parsed.groqApiKey : '',
      anthropicApiKey: typeof parsed.anthropicApiKey === 'string' ? parsed.anthropicApiKey : '',
      openaiCompatibleBaseUrl: typeof parsed.openaiCompatibleBaseUrl === 'string' ? parsed.openaiCompatibleBaseUrl : '',
      openaiCompatibleApiKey: typeof parsed.openaiCompatibleApiKey === 'string' ? parsed.openaiCompatibleApiKey : '',
      openaiCompatibleModel: typeof parsed.openaiCompatibleModel === 'string' && parsed.openaiCompatibleModel.trim()
        ? parsed.openaiCompatibleModel.trim()
        : defaultLLMSettings.openaiCompatibleModel,
    };
  } catch {
    return { ...defaultLLMSettings };
  }
}

export interface SettingsState {
  llm: LLMSettings;
}

export const initialSettingsState: SettingsState = {
  llm: loadLLMSettingsFromStorage(),
};

export interface SettingsActions {
  setLLMSettings: (partial: Partial<LLMSettings>) => void;
}

function persistLLMSettings(llm: LLMSettings): void {
  try {
    localStorage.setItem(LLM_SETTINGS_STORAGE_KEY, JSON.stringify(llm));
  } catch {
    // ignore quota or disabled localStorage
  }
}

export function createSettingsSlice(
  set: (fn: (state: { settings: SettingsState }) => Partial<{ settings: SettingsState }>) => void
) {
  return {
    setLLMSettings: (partial: Partial<LLMSettings>) => {
      set((state) => {
        const next = { ...state.settings.llm, ...partial };
        persistLLMSettings(next);
        return { settings: { ...state.settings, llm: next } };
      });
    },
  };
}
