import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GreenCrew - Golf Course Maintenance Marketplace',
  description: 'Connect golf courses with qualified maintenance professionals',
  keywords: 'golf course, maintenance, greenskeeping, jobs, marketplace',
  metadataBase: new URL('https://greeniqapp.com'),
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'GreenCrew - Golf Course Maintenance Marketplace',
    description: 'Connect golf courses with qualified maintenance professionals',
    url: 'https://greeniqapp.com',
    siteName: 'GreenCrew',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GreenCrew - Golf Course Maintenance Marketplace',
    description: 'Connect golf courses with qualified maintenance professionals',
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
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
