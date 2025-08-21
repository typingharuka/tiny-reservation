import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-6">
          <div className="max-w-md mx-auto mt-20">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                문제가 발생했습니다
              </h2>
              <p className="text-gray-600 mb-6">
                예상치 못한 오류가 발생했습니다. 페이지를 새로고침해 주세요.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 text-white px-6 py-2 rounded-lg transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;