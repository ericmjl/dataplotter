import { useState, useEffect } from 'react';
import { useStore } from '../store';
import type { LLMSettings } from '../store/settingsSlice';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const storeLlm = useStore((s) => s.settings.llm);
  const setLLMSettings = useStore((s) => s.setLLMSettings);
  const [llm, setLlm] = useState<LLMSettings>(storeLlm);

  useEffect(() => {
    setLlm(storeLlm);
  }, [storeLlm]);

  const handleSave = () => {
    setLLMSettings(llm);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="dialog-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="dialog-panel" style={{ maxWidth: '32rem' }} onClick={(e) => e.stopPropagation()}>
        <h2 id="settings-title" className="dialog-title">Settings</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
          API keys are stored only on your device and are never sent anywhere except to the provider you choose.
        </p>
        <div className="dialog-field">
          <label className="dialog-label" htmlFor="settings-groq">Groq API key</label>
          <input
            id="settings-groq"
            type="password"
            autoComplete="off"
            className="dialog-input"
            value={llm.groqApiKey}
            onChange={(e) => setLlm((p) => ({ ...p, groqApiKey: e.target.value }))}
            placeholder="Optional"
          />
        </div>
        <div className="dialog-field">
          <label className="dialog-label" htmlFor="settings-anthropic">Anthropic API key</label>
          <input
            id="settings-anthropic"
            type="password"
            autoComplete="off"
            className="dialog-input"
            value={llm.anthropicApiKey}
            onChange={(e) => setLlm((p) => ({ ...p, anthropicApiKey: e.target.value }))}
            placeholder="Optional"
          />
        </div>
        <div className="dialog-field">
          <label className="dialog-label" htmlFor="settings-openai-base">OpenAI-compatible base URL</label>
          <input
            id="settings-openai-base"
            type="url"
            autoComplete="off"
            className="dialog-input"
            value={llm.openaiCompatibleBaseUrl}
            onChange={(e) => setLlm((p) => ({ ...p, openaiCompatibleBaseUrl: e.target.value }))}
            placeholder="e.g. https://api.openai.com/v1"
          />
        </div>
        <div className="dialog-field">
          <label className="dialog-label" htmlFor="settings-openai-key">OpenAI-compatible API key</label>
          <input
            id="settings-openai-key"
            type="password"
            autoComplete="off"
            className="dialog-input"
            value={llm.openaiCompatibleApiKey}
            onChange={(e) => setLlm((p) => ({ ...p, openaiCompatibleApiKey: e.target.value }))}
            placeholder="Optional"
          />
        </div>
        <div className="dialog-field">
          <label className="dialog-label" htmlFor="settings-openai-model">OpenAI-compatible model</label>
          <input
            id="settings-openai-model"
            type="text"
            autoComplete="off"
            className="dialog-input"
            value={llm.openaiCompatibleModel}
            onChange={(e) => setLlm((p) => ({ ...p, openaiCompatibleModel: e.target.value }))}
            placeholder="gpt-4o-mini"
          />
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="dialog-submit" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
