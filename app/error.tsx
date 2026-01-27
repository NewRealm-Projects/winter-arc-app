'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  const isAuthError =
    error.message?.includes('Stack') ||
    error.message?.includes('auth') ||
    error.message?.includes('Unauthorized') ||
    error.message?.includes('401');

  const isNetworkError =
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('Failed to fetch');

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center shadow-xl">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isAuthError
              ? 'bg-yellow-500/20'
              : isNetworkError
                ? 'bg-orange-500/20'
                : 'bg-red-500/20'
          }`}
        >
          {isAuthError ? (
            <svg
              className="w-8 h-8 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          ) : isNetworkError ? (
            <svg
              className="w-8 h-8 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          ) : (
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
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {isAuthError
            ? 'Anmeldung erforderlich'
            : isNetworkError
              ? 'Verbindungsproblem'
              : 'Etwas ist schiefgelaufen'}
        </h1>

        <p className="text-slate-400 mb-6">
          {isAuthError
            ? 'Du musst angemeldet sein, um diese Seite zu sehen. Bitte melde dich an.'
            : isNetworkError
              ? 'Es konnte keine Verbindung zum Server hergestellt werden. Bitte überprüfe deine Internetverbindung.'
              : 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.'}
        </p>

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
          {isAuthError ? (
            <a
              href="/handler/sign-in"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors inline-block"
            >
              Zur Anmeldung
            </a>
          ) : (
            <button
              onClick={reset}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Erneut versuchen
            </button>
          )}

          <a
            href="/"
            className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors inline-block"
          >
            Zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}
