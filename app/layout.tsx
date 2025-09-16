import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { QueryProvider } from '@/lib/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GreenIQ - Golf Course Maintenance Marketplace',
  description: 'Connect golf courses with qualified maintenance professionals',
  metadataBase: new URL('https://greeniq.app'),
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
