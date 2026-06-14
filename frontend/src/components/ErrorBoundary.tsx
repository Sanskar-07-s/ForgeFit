// ForgeFit AI - React Error Boundary & Skeleton Loaders UI (v4.4)
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { errorMonitor } from '../services/error-monitor';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global/Page level Error Boundary capturing runtime React render crashes.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorMonitor.logError(
      'ui_runtime',
      `React Error Boundary caught crash: ${error.message}`,
      error.stack,
      { componentStack: errorInfo.componentStack }
    );
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          role="alert" 
          aria-live="assertive"
          className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-lg mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-glow-red animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">Application Runtime Error</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              We encountered an unexpected rendering failure while processing the fitness metrics. The crash has been logged automatically.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-black/40 border border-white/5 rounded-xl text-[10px] text-red-300 text-left overflow-x-auto max-w-md font-mono select-all">
                {this.state.error.message}
              </pre>
            )}
          </div>

          <button
            onClick={this.handleRetry}
            className="glass-btn-primary flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold"
            aria-label="Reload and retry application loading"
          >
            <RefreshCw className="w-4 h-4" /> Reload Workspace
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Isolated Component Error Boundary to prevent a single widget crash from bringing down the entire page.
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorMonitor.logError(
      'ui_runtime',
      `Component level crash: ${error.message}`,
      error.stack,
      { componentStack: errorInfo.componentStack }
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          role="alert"
          className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-center space-y-2 text-xs"
        >
          <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
          <div className="font-bold text-white">Widget Crashed</div>
          <p className="text-[10px] text-slate-400">Failed to render this panel.</p>
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300 font-bold hover:bg-white/10"
          >
            Reset Panel
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Accessible Skeleton Loader mapping page cards.
 */
export const SkeletonLoader: React.FC<{ rows?: number; heightClass?: string }> = ({ 
  rows = 3, 
  heightClass = 'h-24' 
}) => {
  return (
    <div 
      className="space-y-4 w-full" 
      aria-label="Loading content placeholder" 
      aria-busy="true"
    >
      {Array.from({ length: rows }).map((_, idx) => (
        <div 
          key={idx} 
          className={`w-full rounded-2xl bg-white/5 border border-white/5 animate-pulse ${heightClass}`}
        />
      ))}
    </div>
  );
};

/**
 * Reusable accessible Empty State UI.
 */
export const EmptyState: React.FC<{ 
  title: string; 
  description: string; 
  icon?: ReactNode;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, icon, actionText, onAction }) => {
  return (
    <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl text-slate-500 font-bold text-xs flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
        {icon || <Layers className="w-6 h-6" />}
      </div>
      <div className="space-y-1">
        <h4 className="font-extrabold text-sm text-white">{title}</h4>
        <p className="text-slate-400 font-medium leading-relaxed max-w-sm">{description}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 glass-btn-primary px-4 py-2 rounded-xl text-[10px] font-bold"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
