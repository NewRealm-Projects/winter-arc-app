'use client'

import { useEffect } from 'react'
import { useUser } from '@stackframe/stack'
import { useRouter } from 'next/navigation'
import { useStore } from './store/useStore'
import { useAuth } from './hooks/useAuth'

export default function HomePage() {
  const stackUser = useUser()
  const router = useRouter()
  const user = useStore((state) => state.user)
  const isOnboarded = useStore((state) => state.isOnboarded)

  // Initialize auth hook for user data sync
  useAuth()

  useEffect(() => {
    // stackUser is undefined while loading, null when not authenticated
    if (stackUser === undefined) return // Still loading

    if (stackUser === null) {
      // Not authenticated, redirect to sign in
      router.push('/handler/sign-in')
      return
    }

    if (stackUser && user) {
      // Authenticated with user data
      if (!isOnboarded) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    }
  }, [stackUser, user, isOnboarded, router])

  // Show loading screen while checking auth
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-winter-500 to-winter-700">
      <div className="text-center">
        <div className="text-6xl mb-4">Snowflake</div>
        <div className="text-white text-lg font-semibold">Winter Arc</div>
        <div className="text-winter-200 mt-2">Loading...</div>
      </div>
    </div>
  )
}
