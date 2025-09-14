import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { QueryProvider } from '@/lib/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import { AuthDebugger } from '@/components/debug/AuthDebugger'
import { AuthFlowTester } from '@/components/debug/AuthFlowTester'
import '@/lib/utils/auth-debug' // Load auth debugging utilities
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GreenCrew - Golf Course Maintenance Marketplace',
  description: 'Connect golf courses with qualified maintenance professionals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
            {process.env.NODE_ENV === 'development' && (
              <>
                <AuthDebugger />
                <AuthFlowTester />
              </>
            )}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
