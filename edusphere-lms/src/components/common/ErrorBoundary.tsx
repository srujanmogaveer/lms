import { Component, type ErrorInfo, type ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    }
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[250px] flex items-center justify-center p-6 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto shadow-sm">
              <FiAlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Something went wrong displaying this view
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReset}
                className="text-xs flex items-center gap-1.5"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
