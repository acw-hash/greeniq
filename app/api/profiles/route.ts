import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { profileUpdateSchema } from '@/lib/validations/profile'

export async function GET() {
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

    // Get base profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    let golfCourseProfile = null
    let professionalProfile = null
    let completionProgress = 0

    // Get role-specific profile
    if (profile.user_type === 'golf_course') {
      const { data } = await supabase
        .from('golf_course_profiles')
        .select('*')
        .eq('profile_id', user.id)
        .single()
      
      golfCourseProfile = data
    } else if (profile.user_type === 'professional') {
      const { data } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('profile_id', user.id)
        .single()
      
      professionalProfile = data
    }

    // Calculate completion progress
    completionProgress = calculateCompletionProgress(profile, golfCourseProfile, professionalProfile)

    return NextResponse.json({
      profile,
      golfCourseProfile,
      professionalProfile,
      completionProgress
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    
    // Validate request body
    const validationResult = profileUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { full_name, email, phone, location } = validationResult.data

    // Prepare update data
    const updateData: any = {
      full_name,
      email,
      phone,
    }

    // Handle location if provided
    if (location) {
      updateData.location = `POINT(${location.lng} ${location.lat})`
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateCompletionProgress(
  profile: any,
  golfCourseProfile: any,
  professionalProfile: any
): number {
  let totalFields = 0
  let completedFields = 0

  // Base profile fields
  const baseFields = ['full_name', 'email', 'phone', 'location']
  totalFields += baseFields.length
  
  baseFields.forEach(field => {
    if (profile[field]) {
      completedFields++
    }
  })

  // Role-specific fields
  if (profile.user_type === 'golf_course' && golfCourseProfile) {
    const golfFields = ['course_name', 'course_type', 'address', 'description']
    totalFields += golfFields.length
    
    golfFields.forEach(field => {
      if (golfCourseProfile[field]) {
        completedFields++
      }
    })

    // Bonus for facilities and qualifications
    if (golfCourseProfile.facilities && Object.keys(golfCourseProfile.facilities).length > 0) {
      completedFields += 0.5
    }
    if (golfCourseProfile.preferred_qualifications && golfCourseProfile.preferred_qualifications.length > 0) {
      completedFields += 0.5
    }
  } else if (profile.user_type === 'professional' && professionalProfile) {
    const profFields = ['bio', 'experience_level', 'specializations', 'hourly_rate', 'travel_radius']
    totalFields += profFields.length
    
    profFields.forEach(field => {
      const value = professionalProfile[field]
      if (value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          completedFields++
        } else if (!Array.isArray(value)) {
          completedFields++
        }
      }
    })

    // Bonus for equipment skills
    if (professionalProfile.equipment_skills && professionalProfile.equipment_skills.length > 0) {
      completedFields += 0.5
    }
  }

  return Math.round((completedFields / totalFields) * 100)
}
