import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // update user's auth session
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/jobs/:path*',
    '/profile/:path*',
    '/applications/:path*',
    '/messages/:path*',
    '/payments/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/login',
    '/register/:path*'
  ]
}
