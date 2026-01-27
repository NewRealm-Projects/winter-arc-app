"use client";

import { StackProvider, StackTheme, StackClientApp } from "@stackframe/stack";
import { useState, useEffect, ReactNode } from "react";

function AuthErrorFallback({ error }: { error: string }) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Authentifizierung nicht verfügbar
        </h1>

        <p className="text-slate-400 mb-6">
          Die App konnte die Authentifizierung nicht initialisieren. Bitte versuche
          es später erneut oder kontaktiere den Support.
        </p>

        {isDev && (
          <div className="bg-slate-900 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-slate-500 mb-2 font-mono">
              Development Info:
            </p>
            <p className="text-sm text-red-400 font-mono break-all mb-3">
              {error}
            </p>
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Checklist:</p>
              <p>
                • NEXT_PUBLIC_STACK_PROJECT_ID:{" "}
                {process.env.NEXT_PUBLIC_STACK_PROJECT_ID ? "✅" : "❌ fehlt"}
              </p>
              <p>
                • NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY:{" "}
                {process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
                  ? "✅"
                  : "❌ fehlt"}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Lade...</p>
      </div>
    </div>
  );
}

function validateEnvVars(): { valid: boolean; error?: string } {
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

  if (!projectId || projectId === "undefined") {
    return {
      valid: false,
      error: "NEXT_PUBLIC_STACK_PROJECT_ID ist nicht konfiguriert",
    };
  }

  if (!publishableKey || publishableKey === "undefined") {
    return {
      valid: false,
      error: "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ist nicht konfiguriert",
    };
  }

  return { valid: true };
}

export function StackAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error";
    app: StackClientApp | null;
    error: string | null;
  }>({
    status: "loading",
    app: null,
    error: null,
  });

  useEffect(() => {
    const envValidation = validateEnvVars();

    if (!envValidation.valid) {
      setState({
        status: "error",
        app: null,
        error: envValidation.error || "Umgebungsvariablen fehlen",
      });
      return;
    }

    try {
      const stackClientApp = new StackClientApp({
        tokenStore: "nextjs-cookie",
        projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
        publishableClientKey:
          process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
        urls: {
          signIn: "/handler/sign-in",
          afterSignIn: "/dashboard",
          signUp: "/handler/sign-up",
          afterSignOut: "/",
          home: "/",
        },
      });

      setState({
        status: "ready",
        app: stackClientApp,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unbekannter Fehler bei der Auth-Initialisierung";
      console.error("StackAuthProvider initialization failed:", err);
      setState({
        status: "error",
        app: null,
        error: errorMessage,
      });
    }
  }, []);

  if (state.status === "loading") {
    return <LoadingScreen />;
  }

  if (state.status === "error" || !state.app) {
    return <AuthErrorFallback error={state.error || "Unbekannter Fehler"} />;
  }

  return (
    <StackProvider app={state.app}>
      <StackTheme>{children}</StackTheme>
    </StackProvider>
  );
}
