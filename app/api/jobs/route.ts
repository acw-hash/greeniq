import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createJobSchema, jobFiltersSchema } from '@/lib/validations/jobs'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Simple query without complex joins for now
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }
    
    return NextResponse.json(jobs || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createJobSchema.parse(body)
    
    // Create job in database
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...validatedData,
        course_id: user.id,
        location: `POINT(${validatedData.location.lng} ${validatedData.location.lat})`
      })
      .select()
      .single()
    
    if (error) {
      console.error('Database insertion error:', error)
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}