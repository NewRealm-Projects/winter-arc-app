'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  const isAuthError =
    error.message?.includes('Stack') ||
    error.message?.includes('auth') ||
    error.message?.includes('NEXT_PUBLIC_STACK');

  return (
    <html lang="de">
      <body className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Etwas ist schiefgelaufen
          </h1>

          {isAuthError ? (
            <p className="text-slate-400 mb-6">
              Es gab ein Problem mit der Authentifizierung. Bitte versuche es
              erneut oder kontaktiere den Support, wenn das Problem weiterhin
              besteht.
            </p>
          ) : (
            <p className="text-slate-400 mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
            </p>
          )}

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-slate-900 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-slate-500 mb-1 font-mono">
                Error Details (nur in Development):
              </p>
              <p className="text-sm text-red-400 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Erneut versuchen
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
            >
              Zur Startseite
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
