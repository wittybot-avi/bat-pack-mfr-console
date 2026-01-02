import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * GLOBAL SYSTEM SAFETY GUARD
 * Catches all runtime exceptions to prevent total white screens.
 */
export class ErrorBoundary extends Component<Props, State> {
  /* Added explicit constructor to guarantee correct 'this' and 'props' binding in TypeScript */
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CRITICAL_RUNTIME_FAIL:", error, errorInfo);
  }

  private handleHardReset = () => {
    if (window.confirm("Hard Reset will clear all local cache. Proceed?")) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: '#0f172a', 
          color: '#f8fafc', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center', border: '1px solid #334155', borderRadius: '8px', padding: '2rem', background: '#1e293b' }}>
            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Console Runtime Failure</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem' }}>
              The application encountered an unexpected error. This is often due to invalid route ledger states or corrupted local data.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button onClick={() => window.location.reload()} style={{ padding: '0.75rem', background: '#4f46e5', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <RefreshCw size={16} /> Reload Page
              </button>
              <button onClick={this.handleHardReset} style={{ padding: '0.75rem', background: '#ef4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Trash2 size={16} /> Hard Reset Cache
              </button>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#0f172a', borderRadius: '4px', textAlign: 'left', overflow: 'auto', maxHeight: '200px' }}>
              <p style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.75rem' }}>{this.state.error?.toString()}</p>
            </div>
          </div>
        </div>
      );
    }

    /* Fixed: Access children via this.props which is correctly inherited from Component */
    return this.props.children;
  }
}

export default ErrorBoundary;