import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { handleUserMessage } from '../nl/orchestrator';
import { callLLM } from '../nl/callLLM';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || loading) return;
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    const getState = () => useStore.getState().project;
    const state = useStore.getState();
    const actions = {
      setProject: state.setProject,
      addTable: state.addTable,
      addAnalysis: state.addAnalysis,
      addGraph: state.addGraph,
      updateAnalysisResult: state.updateAnalysisResult,
      updateAnalysisError: state.updateAnalysisError,
      updateGraphOptions: state.updateGraphOptions,
      setSelection: state.setSelection,
    };
    const result = await handleUserMessage(msg, getState, actions, callLLM);
    setLoading(false);
    const reply = result.error ?? (result.outcomes.join(' ') || 'Done.');
    setMessages((m) => [...m, { role: 'assistant', content: reply }]);
  }

  return (
    <aside className="chat-panel" role="region" aria-label="Chat panel">
      <div className="chat-panel-header">Chat</div>
      <div className="chat-panel-messages">
        {messages.length === 0 && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
            Ask to run analyses, create graphs, or tables. Set VITE_GROQ_API_KEY, VITE_ANTHROPIC_API_KEY, or VITE_OPENAI_COMPATIBLE_* in .env.local.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong> {m.content}
          </div>
        ))}
        {loading && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>…</p>}
        <div ref={bottomRef} />
      </div>
      <form
        className="chat-panel-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          className="dialog-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          aria-label="Chat input"
          disabled={loading}
        />
        <button type="submit" className="dialog-submit" style={{ marginTop: '0.25rem' }} disabled={loading}>
          Send
        </button>
      </form>
    </aside>
  );
}
