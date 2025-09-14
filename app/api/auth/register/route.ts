import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  golfCourseSignupSchema, 
  professionalSignupSchema,
  type GolfCourseSignupInput,
  type ProfessionalSignupInput 
} from '@/lib/validations/auth'

// Utility function to wait/delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Verify if user exists in auth.users table
async function verifyUserExists(supabase: any, userId: string): Promise<boolean> {
  try {
    console.log('🔍 Verifying user exists in auth.users:', userId)
    
    // Use admin client to check if user exists in auth.users
    const { data, error } = await supabase.auth.admin.getUserById(userId)
    
    if (error) {
      console.error('❌ Error checking user existence:', error)
      return false
    }
    
    const exists = !!data.user
    console.log(`${exists ? '✅' : '❌'} User ${exists ? 'exists' : 'does not exist'} in auth.users:`, userId)
    
    return exists
  } catch (error) {
    console.error('💥 Exception while checking user existence:', error)
    return false
  }
}

// Retry function for database operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      console.log(`Attempt ${attempt} failed:`, error)
      
      if (attempt < maxRetries) {
        await delay(delayMs * attempt) // Exponential backoff
      }
    }
  }
  
  throw lastError
}

export async function POST(request: NextRequest) {
  console.log('🚀 Starting registration process...')
  
  try {
    const body = await request.json()
    console.log('📝 Registration data received:', { 
      email: body.email, 
      user_type: body.user_type,
      full_name: body.full_name 
    })

    // Validate the request body based on user type
    let validatedData: GolfCourseSignupInput | ProfessionalSignupInput
    
    if (body.user_type === 'golf_course') {
      validatedData = golfCourseSignupSchema.parse(body)
    } else if (body.user_type === 'professional') {
      validatedData = professionalSignupSchema.parse(body)
    } else {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Step 1: Create the auth user with complete registration data in metadata
    console.log('👤 Creating Supabase auth user...')
    
    // Prepare user metadata with all registration information
    const userMetadata: any = {
      full_name: validatedData.full_name,
      user_type: validatedData.user_type,
      phone: validatedData.phone,
    }
    
    // Add role-specific data to metadata for later profile creation
    if (validatedData.user_type === 'golf_course') {
      const golfData = validatedData as GolfCourseSignupInput
      userMetadata.course_data = {
        course_name: golfData.course_name,
        course_type: golfData.course_type,
        address: golfData.address,
        description: golfData.description,
      }
    } else if (validatedData.user_type === 'professional') {
      const profData = validatedData as ProfessionalSignupInput
      userMetadata.professional_data = {
        bio: profData.bio,
        experience_level: profData.experience_level,
        specializations: profData.specializations,
        hourly_rate: profData.hourly_rate,
        travel_radius: profData.travel_radius,
      }
    }
    
    // Construct the email redirect URL for confirmation
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'
    const emailRedirectTo = `${baseUrl}/auth/callback`
    
    console.log('📧 Email configuration:', {
      baseUrl,
      emailRedirectTo,
      email: validatedData.email
    })

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo,
        data: userMetadata
      }
    })

    console.log('📊 Raw auth signup response:', {
      user: authData?.user ? {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at,
        created_at: authData.user.created_at,
        confirmation_sent_at: authData.user.confirmation_sent_at || 'Not found'
      } : null,
      session: authData?.session ? 'session_exists' : 'no_session',
      error: authError ? {
        message: authError.message,
        status: authError.status,
        code: (authError as any).code
      } : null
    })
    
    // Additional email debugging
    if (authData?.user && !authData.user.email_confirmed_at) {
      console.log('📧 Email confirmation status:', {
        email_confirmed_at: authData.user.email_confirmed_at,
        confirmation_sent_at: authData.user.confirmation_sent_at,
        last_sign_in_at: authData.user.last_sign_in_at,
        email_change_sent_at: authData.user.email_change_sent_at,
        user_metadata: authData.user.user_metadata
      })
    }

    if (authError) {
      console.error('❌ Auth user creation failed:', authError)
      return NextResponse.json(
        { error: `Authentication failed: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth signup')
      return NextResponse.json(
        { error: 'Failed to create user account - no user returned' },
        { status: 400 }
      )
    }

    const userId = authData.user.id
    const emailConfirmationRequired = !authData.user.email_confirmed_at
    
    console.log('✅ Auth user created successfully:', {
      userId,
      email: authData.user.email,
      emailConfirmationRequired,
      email_confirmed_at: authData.user.email_confirmed_at
    })

    // Check if email confirmation is required
    if (emailConfirmationRequired) {
      console.log('📧 Email confirmation required - user won\'t be in auth.users until confirmed')
      console.log('📧 Email should have been sent to:', validatedData.email)
      console.log('📧 Redirect URL configured as:', emailRedirectTo)
      
      // Check if confirmation_sent_at field indicates email was sent
      const emailSent = authData.user.confirmation_sent_at || authData.user.created_at
      
      // For email confirmation flow, we need to wait or handle differently
      return NextResponse.json({
        message: 'Registration initiated! Please check your email to confirm your account before you can log in.',
        user_id: userId,
        user_type: validatedData.user_type,
        email: validatedData.email,
        email_confirmation_required: true,
        email_sent_at: emailSent,
        email_redirect_url: emailRedirectTo,
        next_steps: [
          'Check your email for a confirmation link',
          'Click the confirmation link to activate your account', 
          'Return to the login page to sign in'
        ],
        troubleshooting: {
          email_not_received: [
            'Check your spam/junk folder',
            'Verify the email address is correct',
            'Check Supabase Auth settings for email configuration',
            'Visit /api/debug/email-config for configuration details'
          ]
        }
      }, { status: 201 })
    }

    // Step 2: Verify user exists in auth.users table before proceeding
    console.log('⏳ Verifying user exists in auth.users before creating profile...')
    
    const userExists = await retryOperation(async () => {
      await delay(1000) // Initial wait
      const exists = await verifyUserExists(supabase, userId)
      
      if (!exists) {
        throw new Error('User not yet available in auth.users table')
      }
      
      return exists
    }, 10, 2000) // Retry up to 10 times with 2 second delays
    
    if (!userExists) {
      console.error('❌ User verification failed - user not available in auth.users after multiple attempts')
      return NextResponse.json({
        error: 'User creation verification failed',
        message: 'The user account was created but is not yet available. This may be due to email confirmation requirements.',
        user_id: userId,
        email_confirmation_required: true,
        next_steps: [
          'Check your email for a confirmation link',
          'Click the confirmation link to activate your account', 
          'Try logging in again after confirmation'
        ]
      }, { status: 202 }) // 202 Accepted - processing not complete
    }

    console.log('✅ User verified in auth.users table')

    // Step 3: Create the profile with retry logic
    console.log('👥 Creating user profile...')
    const profileData = {
      id: userId,
      user_type: validatedData.user_type,
      full_name: validatedData.full_name,
      email: validatedData.email,
      phone: validatedData.phone || null,
    }

    console.log('📋 Profile data to insert:', profileData)

    const { error: profileError } = await retryOperation(async () => {
      const result = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()
      
      if (result.error) {
        console.error('Profile insertion error:', {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code
        })
        
        // Special handling for foreign key constraint errors
        if (result.error.code === '23503') {
          console.error('🚨 Foreign key constraint violation - auth user may not exist yet')
          console.error('User ID being used:', userId)
          
          // Verify user still exists before retry
          const stillExists = await verifyUserExists(supabase, userId)
          if (!stillExists) {
            throw new Error('User no longer exists in auth.users table')
          }
        }
        
        throw result.error
      }
      
      console.log('✅ Profile inserted successfully:', result.data)
      return result
    }, 3, 1000) // Reduced retries since we've already verified user exists

    if (profileError) {
      console.error('❌ Profile creation failed after retries:', profileError)
      
      return NextResponse.json(
        { 
          error: `Profile creation failed: ${(profileError as any)?.message || 'Unknown error'}`,
          details: (profileError as any)?.details,
          hint: (profileError as any)?.hint,
          code: (profileError as any)?.code,
          user_id: userId
        },
        { status: 500 }
      )
    }

    console.log('✅ Profile created successfully')

    // Step 4: Create role-specific profile
    if (validatedData.user_type === 'golf_course') {
      console.log('🏌️ Creating golf course profile...')
      const golfData = validatedData as GolfCourseSignupInput
      
      const { error: golfError } = await retryOperation(async () => {
        const result = await supabase
          .from('golf_course_profiles')
          .insert({
            profile_id: userId,
            course_name: golfData.course_name,
            course_type: golfData.course_type,
            address: golfData.address,
            description: golfData.description || null,
          })
          .select()
          .single()
        
        if (result.error) {
          console.error('Golf course profile insertion error:', result.error)
          throw result.error
        }
        
        return result
      }, 3, 1000)

      if (golfError) {
        console.error('❌ Golf course profile creation failed:', golfError)
        return NextResponse.json(
          { error: `Golf course profile creation failed: ${(golfError as any)?.message || 'Unknown error'}` },
          { status: 500 }
        )
      }

      console.log('✅ Golf course profile created successfully')

    } else if (validatedData.user_type === 'professional') {
      console.log('👷 Creating professional profile...')
      const profData = validatedData as ProfessionalSignupInput
      
      const { error: profError } = await retryOperation(async () => {
        const result = await supabase
          .from('professional_profiles')
          .insert({
            profile_id: userId,
            bio: profData.bio || null,
            experience_level: profData.experience_level,
            specializations: profData.specializations,
            hourly_rate: profData.hourly_rate || null,
            travel_radius: profData.travel_radius || 25,
          })
          .select()
          .single()
        
        if (result.error) {
          console.error('Professional profile insertion error:', result.error)
          throw result.error
        }
        
        return result
      }, 3, 1000)

      if (profError) {
        console.error('❌ Professional profile creation failed:', profError)
        return NextResponse.json(
          { error: `Professional profile creation failed: ${(profError as any)?.message || 'Unknown error'}` },
          { status: 500 }
        )
      }

      console.log('✅ Professional profile created successfully')
    }

    console.log('🎉 Registration completed successfully!')

    return NextResponse.json({
      message: 'Registration successful! Please check your email to verify your account.',
      user_id: userId,
      user_type: validatedData.user_type
    }, { status: 201 })

  } catch (error: any) {
    console.error('💥 Registration process failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Registration failed', 
        message: error.message || 'An unexpected error occurred',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
