import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      let message = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) {
          message = `Firestore Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path}`;
        }
      } catch (e) {
        message = this.state.error.message || message;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background text-foreground">
          <div className="max-w-md w-full space-y-6">
            <div className="bg-destructive/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <span className="text-destructive text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-destructive">Application Error</h2>
            <div className="bg-card border p-4 rounded-lg text-left overflow-auto max-h-[200px]">
              <code className="text-xs text-muted-foreground">{message}</code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors"
            >
              Reload Application
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
