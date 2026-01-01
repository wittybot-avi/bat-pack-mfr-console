
import React, { ErrorInfo, ReactNode, Component } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from './ui/design-system';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronRight, Home, Database, ClipboardCopy, Trash2 } from 'lucide-react';
import { logger } from '../utils/logger';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Standard React Error Boundary component to catch rendering errors.
 */
// Fix: Use Component explicitly to ensure TypeScript correctly resolves inherited members like state and props
class ErrorBoundary extends Component<Props, State> {
  // Fix: Property initializer for state resolves issues with this.state accessibility in constructor vs inheritance
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  // Fixed static method signature to correctly return Partial<State> for the error boundary lifecycle
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  // Fix line 37: Ensure setState is recognized as an inherited method by extending Component
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    logger.error("Global Error Boundary caught exception", error);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    if (window.confirm("This will clear all local data, demo selections, and log you out. Proceed?")) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  private copyDiagnostics = () => {
    // Correctly accessing state.error which is now recognized by TypeScript
    const data = logger.getDiagnostics(this.state.error || undefined);
    navigator.clipboard.writeText(data);
    alert("Diagnostic info copied to clipboard.");
  };

  // Fix line 61: Ensure setState is recognized as an inherited method by extending Component
  private toggleDetails = () => {
    // Functional state update ensures we toggle the showDetails flag safely
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    // TypeScript now correctly identifies state members within the render lifecycle
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
          <Card className="w-full max-w-3xl border-rose-200 dark:border-rose-900 shadow-2xl">
            <CardHeader className="bg-rose-50 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900">
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-xl">Console System Failure</CardTitle>
                    <p className="text-xs opacity-70 font-mono">CRITICAL_RUNTIME_ERR</p>
                  </div>
                </div>
                <Badge variant="destructive">Safety Guard Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  The application encountered a fatal error that prevented it from rendering.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This often happens during demo data switching if assets expected by the current route are purged or if the session state becomes incoherent.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => window.location.href = '#/'} className="gap-2 justify-start h-12">
                  <Home className="h-4 w-4" /> Return to Dashboard
                </Button>
                <Button onClick={this.handleReload} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white border-none h-12 justify-start">
                  <RefreshCw className="h-4 w-4" /> Hot Reload Component
                </Button>
                <Button variant="outline" onClick={this.handleHardReset} className="gap-2 text-rose-600 hover:bg-rose-50 h-12 justify-start">
                  <Trash2 className="h-4 w-4" /> Clear All Cache & Logout
                </Button>
                <Button variant="outline" onClick={this.copyDiagnostics} className="gap-2 h-12 justify-start">
                  <ClipboardCopy className="h-4 w-4" /> Copy Diagnostic Bundle
                </Button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-slate-900 text-slate-300 font-mono text-xs">
                <button 
                  onClick={this.toggleDetails}
                  className="w-full flex items-center gap-2 p-3 bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 text-slate-400 transition-colors border-b border-slate-700 dark:border-slate-800"
                >
                  {this.state.showDetails ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Developer Trace Log
                </button>
                {this.state.showDetails && (
                  <div className="p-4 overflow-auto max-h-[250px] leading-relaxed">
                    <p className="text-rose-400 mb-2 font-bold select-all">{this.state.error?.toString()}</p>
                    <pre className="whitespace-pre-wrap text-slate-500 text-[10px]">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Fix line 131: Correctly accessing this.props by inheriting from Component
    return this.props.children;
  }
}

export default ErrorBoundary;
