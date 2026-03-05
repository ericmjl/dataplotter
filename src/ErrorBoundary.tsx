import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          style={{
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 600,
            margin: '2rem auto',
            background: '#1e1e1e',
            color: '#f87171',
            borderRadius: 8,
            border: '1px solid #f87171',
          }}
        >
          <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
          <pre style={{ overflow: 'auto', fontSize: '0.875rem' }}>
            {this.state.error.message}
          </pre>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
            Check the browser console for details.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
