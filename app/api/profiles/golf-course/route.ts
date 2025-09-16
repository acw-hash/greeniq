import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { golfCourseProfileSchema } from '@/lib/validations/profile'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a golf course
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.user_type !== 'golf_course') {
      return NextResponse.json(
        { error: 'Access denied. Golf course account required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = golfCourseProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Update or create golf course profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('golf_course_profiles')
      .upsert({
        profile_id: user.id,
        ...validatedData,
      })
      .select()
      .single()

    if (updateError) {
      console.error('Golf course profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update golf course profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Golf course profile updated successfully',
      golfCourseProfile: updatedProfile
    })

  } catch (error) {
    console.error('Golf course profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
