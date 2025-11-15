'use client'

import { SessionProvider } from 'next-auth/react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from 'next-auth'
import type { AuthHydration, AuthStatus, SerializedUser } from '@/app/lib/getCurrentUser'
import type { User } from '@/app/types'
import { useStore } from '@/app/store/useStore'
import { clearDemoModeMarker, isDemoModeActive } from '@/app/constants/demo'
import { addBreadcrumb } from '@/app/services/sentryService'

const DEFAULT_ACTIVITIES = ['pushups', 'sports', 'water', 'protein'] as const
const DEFAULT_PUSHUP_STATE = { baseReps: 0, sets: 5, restTime: 90 } as const

type SerializedAuth = Pick<AuthHydration, 'session' | 'status' | 'user' | 'isOnboarded'>

interface AuthProviderProps extends SerializedAuth {
  children: ReactNode
}

interface AuthContextValue {
  session: Session | null
  status: AuthStatus
  user: User | null
  isOnboarded: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function deserializeUser(serialized: SerializedUser): User {
  return {
    ...serialized,
    birthday: serialized.birthday ?? undefined,
    createdAt: new Date(serialized.createdAt),
    enabledActivities: serialized.enabledActivities?.length
      ? serialized.enabledActivities
      : [...DEFAULT_ACTIVITIES],
    pushupState: serialized.pushupState ?? { ...DEFAULT_PUSHUP_STATE },
  }
}

export function AuthProvider({
  children,
  session,
  status: initialStatus,
  user: initialUser,
  isOnboarded: initialIsOnboarded,
}: AuthProviderProps) {
  const setUser = useStore((state) => state.setUser)
  const setIsOnboarded = useStore((state) => state.setIsOnboarded)
  const setAuthLoading = useStore((state) => state.setAuthLoading)
  const setTracking = useStore((state) => state.setTracking)

  const storeUser = useStore((state) => state.user)
  const storeIsOnboarded = useStore((state) => state.isOnboarded)

  const [status, setStatus] = useState<AuthStatus>(initialStatus ?? 'unauthenticated')

  const fallbackUser = useMemo(() => (initialUser ? deserializeUser(initialUser) : null), [initialUser])

  useEffect(() => {
    setStatus(initialStatus ?? 'unauthenticated')
  }, [initialStatus])

  useEffect(() => {
    if (initialStatus === 'authenticated') {
      if (fallbackUser) {
        addBreadcrumb('Auth: hydrated user from server', { id: fallbackUser.id })
        clearDemoModeMarker()
        setUser(fallbackUser)
        setIsOnboarded(initialIsOnboarded)
      } else {
        setUser(null)
        setIsOnboarded(false)
      }
      setAuthLoading(false)
      return
    }

    if (isDemoModeActive()) {
      setAuthLoading(false)
      return
    }

    setUser(null)
    setIsOnboarded(false)
    setTracking({})
    setAuthLoading(false)

    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        if (
          key.startsWith('winterarc_') ||
          key.startsWith('wa_') ||
          key.startsWith('tracking_') ||
          key.startsWith('nextauth.') ||
          key.includes('session')
        ) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))

      const sessionKeysToRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (!key) continue
        if (key.startsWith('winterarc_') || key.startsWith('wa_') || key.includes('session')) {
          sessionKeysToRemove.push(key)
        }
      }
      sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key))
    } catch (error) {
      console.warn('Selective session cleanup failed', error)
    }
  }, [fallbackUser, initialIsOnboarded, initialStatus, setAuthLoading, setIsOnboarded, setTracking, setUser])

  const contextUser = storeUser ?? fallbackUser
  const contextIsOnboarded = storeUser ? storeIsOnboarded : initialIsOnboarded

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      user: contextUser,
      isOnboarded: contextIsOnboarded,
    }),
    [contextIsOnboarded, contextUser, session, status],
  )

  return (
    <SessionProvider session={session}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </SessionProvider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
