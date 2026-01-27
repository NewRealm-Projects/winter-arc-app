'use client'

import { useUser } from '@stackframe/stack'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useUser()
  const router = useRouter()

  useEffect(() => {
    // user is undefined while loading, null when not authenticated
    if (user === undefined) return // Still loading

    if (user === null) {
      router.push('/handler/sign-in')
      return
    }
  }, [user, router])

  // Loading state
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-winter-900 to-winter-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-winter-400 mx-auto mb-4"></div>
          <p className="text-winter-300">Laden...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - will redirect
  if (user === null) {
    return null
  }

  return <>{children}</>
}
