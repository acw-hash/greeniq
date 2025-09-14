import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🔧 Profile completion/creation endpoint called')
  
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ No authenticated user:', userError)
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    console.log('👤 User authenticated:', user.id)
    
    // Check if profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking for existing profile:', profileCheckError)
      return NextResponse.json(
        { error: 'Profile check failed' },
        { status: 500 }
      )
    }
    
    if (existingProfile) {
      console.log('✅ Profile already exists')
      return NextResponse.json({
        message: 'Profile already exists',
        profile: existingProfile
      })
    }
    
    // Profile doesn't exist, create one from user metadata
    console.log('🔨 Creating profile from user metadata...')
    console.log('📋 User metadata:', user.user_metadata)
    
    const profileData = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      user_type: user.user_metadata?.user_type || null,
      phone: user.user_metadata?.phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 Creating profile with data:', profileData)
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Profile creation failed:', createError)
      return NextResponse.json(
        { 
          error: 'Profile creation failed',
          details: createError.message
        },
        { status: 500 }
      )
    }
    
    console.log('✅ Profile created successfully')
    
    // Create role-specific profile if user_type is available
    if (user.user_metadata?.user_type === 'golf_course' && user.user_metadata?.course_data) {
      console.log('🏌️ Creating golf course profile...')
      
      const golfData = user.user_metadata.course_data
      const { error: golfError } = await supabase
        .from('golf_course_profiles')
        .insert({
          profile_id: user.id,
          course_name: golfData.course_name || 'Course Name Pending',
          course_type: golfData.course_type || 'public',
          address: golfData.address || 'Address Pending',
          description: golfData.description || null,
          created_at: new Date().toISOString()
        })
      
      if (golfError) {
        console.error('⚠️ Golf course profile creation failed:', golfError)
      } else {
        console.log('✅ Golf course profile created')
      }
    } else if (user.user_metadata?.user_type === 'professional' && user.user_metadata?.professional_data) {
      console.log('👷 Creating professional profile...')
      
      const profData = user.user_metadata.professional_data
      const { error: profError } = await supabase
        .from('professional_profiles')
        .insert({
          profile_id: user.id,
          bio: profData.bio || null,
          experience_level: profData.experience_level || 'entry',
          specializations: profData.specializations || [],
          hourly_rate: profData.hourly_rate || null,
          travel_radius: profData.travel_radius || 25,
          created_at: new Date().toISOString()
        })
      
      if (profError) {
        console.error('⚠️ Professional profile creation failed:', profError)
      } else {
        console.log('✅ Professional profile created')
      }
    }
    
    return NextResponse.json({
      message: 'Profile created successfully',
      profile: newProfile
    })
    
  } catch (error: any) {
    console.error('💥 Unexpected error in profile completion:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    )
  }
}