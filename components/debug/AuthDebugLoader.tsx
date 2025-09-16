"use client"

import { useEffect } from 'react'

export function AuthDebugLoader() {
  useEffect(() => {
    // Only load auth debugging utilities in development mode and on client side
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/utils/auth-debug').catch((error) => {
        console.warn('Failed to load auth debug utilities:', error)
      })
    }
  }, [])

  // This component doesn't render anything
  return null
}
