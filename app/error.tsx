"use client";

import { useEffect } from "react";
import { Button } from "7k-design-system/react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto flex h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-400">Something went wrong</h2>
        <p className="mt-2 text-sm opacity-70">
          {error.message || "An unexpected error occurred"}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs opacity-50">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex gap-4 justify-center">
          <Button variant="primary" onClick={reset}>
            Try Again
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}
