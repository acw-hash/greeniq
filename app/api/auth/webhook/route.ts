import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// This webhook handles Supabase auth events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔗 Webhook received:', {
      type: body.type,
      event: body.record?.id ? `user_${body.record.id.slice(0, 8)}` : 'unknown'
    })

    // Handle email confirmation event
    if (body.type === 'user.updated' && body.record) {
      const user = body.record
      
      // Check if this is an email confirmation event
      if (user.email_confirmed_at && user.raw_user_meta_data) {
        console.log('📧 Email confirmed for user:', user.id)
        
        const userData = user.raw_user_meta_data
        
        // Check if we have the necessary registration data
        if (userData.user_type && userData.full_name) {
          console.log('🔄 Attempting to complete profile for confirmed user...')
          
          try {
            // Call our profile completion endpoint
            const completeProfileResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/complete-profile`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: user.id,
                user_data: {
                  user_type: userData.user_type,
                  full_name: userData.full_name,
                  email: user.email,
                  phone: userData.phone,
                  // Include role-specific data if available
                  ...(userData.user_type === 'golf_course' && userData.course_data && {
                    course_data: userData.course_data
                  }),
                  ...(userData.user_type === 'professional' && userData.professional_data && {
                    professional_data: userData.professional_data
                  })
                }
              })
            })
            
            const result = await completeProfileResponse.json()
            
            if (completeProfileResponse.ok) {
              console.log('✅ Profile completion successful via webhook:', result)
            } else {
              console.error('❌ Profile completion failed via webhook:', result)
            }
            
          } catch (error) {
            console.error('💥 Error calling profile completion endpoint:', error)
          }
        } else {
          console.log('⚠️ Insufficient user metadata for profile completion:', userData)
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error: any) {
    console.error('💥 Webhook processing failed:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
