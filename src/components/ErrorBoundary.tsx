import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected interface error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-[#0b0c10] dark:text-white">
              Something interrupted this view
            </h2>
            <p className="text-sm text-[#4b5563] dark:text-slate-400 break-words">
              {this.state.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restore View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
