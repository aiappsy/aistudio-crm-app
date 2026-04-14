import React, { useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    let message = "Something went wrong.";
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error) {
        message = `Firestore Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path}`;
      }
    } catch (e) {
      message = error.message || message;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Application Error</h2>
        <p className="text-muted-foreground mb-4">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Reload Application
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
