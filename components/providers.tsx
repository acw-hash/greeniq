"use client"

import { AuthProvider } from '@/components/auth/AuthProvider'
import { QueryProvider } from '@/lib/providers/QueryProvider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  )
}
