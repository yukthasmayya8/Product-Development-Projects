import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center glass-surface-vibrant rounded-[40px] border border-white/10 m-4">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30 glow-orange">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-display uppercase tracking-tighter mb-4">Something went wrong</h2>
          <p className="text-sm opacity-60 max-w-md mb-8 leading-relaxed">
            An unexpected error occurred while rendering this component. Our team has been notified.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <RefreshCw size={16} />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
