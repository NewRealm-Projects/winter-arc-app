"use client";

import { useUser } from "@stackframe/stack";

/**
 * Unified auth hook for client components.
 * Wraps Stack's useUser hook with a consistent API compatible with legacy NextAuth code.
 */
export function useStackAuth() {
  const user = useUser();

  return {
    user,
    isAuthenticated: !!user,
    loading: false, // Stack handles loading internally
    // Legacy compatibility properties
    status: user ? ('authenticated' as const) : ('unauthenticated' as const),
    isOnboarded: !!user, // In Stack, if user exists, they're onboarded
  };
}
