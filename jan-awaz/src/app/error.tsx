"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error boundary caught:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-300/20 bg-red-300/10 p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-300" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          
          <p className="mt-3 text-slate-300">
            We encountered an unexpected error. Please try again.
          </p>
          
          <p className="mt-2 text-sm text-slate-400">
            कुछ गलत हो गया। कृपया पुनः प्रयास करें।
          </p>

          {process.env.NODE_ENV === "development" && error.message && (
            <div className="mt-4 rounded-lg bg-slate-900/50 p-3 text-left">
              <p className="text-xs font-mono text-red-300">{error.message}</p>
            </div>
          )}

          <button
            onClick={reset}
            className="mt-6 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            Try again / पुनः प्रयास करें
          </button>

          <button
            onClick={() => window.location.href = "/"}
            className="mt-3 block w-full rounded-xl border border-slate-600 bg-slate-800 px-6 py-3 font-bold text-slate-200 hover:bg-slate-700"
          >
            Go home / होम पर जाएं
          </button>
        </div>
      </body>
    </html>
  );
}
