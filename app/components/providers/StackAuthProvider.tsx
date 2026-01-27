"use client";

import { StackProvider, StackTheme, StackClientApp } from "@stackframe/stack";

const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  urls: {
    signIn: "/handler/sign-in",
    afterSignIn: "/dashboard",
    signUp: "/handler/sign-up",
    afterSignOut: "/",
    home: "/",
  },
});

export function StackAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  );
}
