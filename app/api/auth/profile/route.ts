import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        golf_course_profiles(*),
        professional_profiles(*)
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: profile })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, phone, ...otherFields } = body

    // Update main profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name,
        phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Update role-specific profile if needed
    if (Object.keys(otherFields).length > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (profile?.user_type === 'golf_course') {
        await supabase
          .from('golf_course_profiles')
          .update(otherFields)
          .eq('profile_id', user.id)
      } else if (profile?.user_type === 'professional') {
        await supabase
          .from('professional_profiles')
          .update(otherFields)
          .eq('profile_id', user.id)
      }
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
