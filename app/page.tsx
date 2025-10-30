'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useStore } from './store/useStore'
import { useAuth } from './hooks/useAuth'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const user = useStore((state) => state.user)
  const isOnboarded = useStore((state) => state.isOnboarded)

  // Initialize Firebase auth hook for compatibility
  useAuth()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session && status === 'unauthenticated') {
      // Not authenticated, redirect to sign in
      router.push('/auth/signin')
      return
    }

    if (session && user) {
      // Authenticated with user data
      if (!isOnboarded) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    }
  }, [session, status, user, isOnboarded, router])

  // Show loading screen while checking auth
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-winter-500 to-winter-700">
      <div className="text-center">
        <div className="text-6xl mb-4">❄️</div>
        <div className="text-white text-lg font-semibold">Winter Arc</div>
        <div className="text-winter-200 mt-2">Loading...</div>
      </div>
    </div>
  )
}
