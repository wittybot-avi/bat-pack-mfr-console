
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from './ui/design-system';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronRight, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

// Fixed: Correctly extending Component with generics to ensure TypeScript recognizes state, props, and setState
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Correctly initialize state as a property of the class instance
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // setState is now correctly recognized as inherited from Component
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private toggleDetails = () => {
    // setState is now correctly recognized as inherited from Component
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    // state property access is now correctly recognized via Component inheritance
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
          <Card className="w-full max-w-2xl border-rose-200 dark:border-rose-900 shadow-xl">
            <CardHeader className="bg-rose-50 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
                <CardTitle>Application Error</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                The application encountered an unexpected runtime error. This might be due to a temporary state mismatch or a routing issue.
              </p>
              
              <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-slate-900 text-slate-300 font-mono text-xs">
                <button 
                  onClick={this.toggleDetails}
                  className="w-full flex items-center gap-2 p-2 bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 text-slate-400 transition-colors border-b border-slate-700 dark:border-slate-800"
                >
                  {/* Correctly accessing showDetails from state */}
                  {this.state.showDetails ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Diagnostics
                </button>
                {/* Correctly accessing showDetails from state */}
                {this.state.showDetails && (
                  <div className="p-3 overflow-auto max-h-[300px]">
                    {/* Correctly accessing error from state */}
                    <p className="text-rose-400 mb-2 font-bold">{this.state.error?.toString()}</p>
                    {/* Correctly accessing errorInfo from state */}
                    <pre className="whitespace-pre-wrap text-slate-500">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2">
                  <Home className="h-4 w-4" /> Reset to Dashboard
                </Button>
                <Button onClick={this.handleReload} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white border-none">
                  <RefreshCw className="h-4 w-4" /> Reload Console
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Correctly accessing children from props via Component inheritance
    return this.props.children;
  }
}

export default ErrorBoundary;
