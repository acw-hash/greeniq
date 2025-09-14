import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint allows resending confirmation emails - should be removed in production
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('📧 Attempting to resend confirmation email to:', email)

    const supabase = await createClient()
    
    // Construct the email redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'
    const emailRedirectTo = `${baseUrl}/auth/callback`

    console.log('📧 Using redirect URL:', emailRedirectTo)

    // Resend confirmation email
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo
      }
    })

    if (error) {
      console.error('❌ Failed to resend confirmation email:', error)
      return NextResponse.json(
        { error: `Failed to resend email: ${error.message}` },
        { status: 400 }
      )
    }

    console.log('✅ Confirmation email resent successfully:', data)

    return NextResponse.json({
      message: 'Confirmation email resent successfully',
      email,
      email_redirect_url: emailRedirectTo,
      data,
      next_steps: [
        'Check your email for the confirmation link',
        'Click the link to confirm your account',
        'Return to login after confirmation'
      ]
    }, { status: 200 })

  } catch (error: any) {
    console.error('💥 Resend confirmation email failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to resend confirmation email', 
        message: error.message || 'An unexpected error occurred',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
