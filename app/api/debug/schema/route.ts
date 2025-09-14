import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint checks database schema - should be removed in production
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const supabase = await createClient()

    // Check if tables exist and are accessible
    const tableChecks = await Promise.allSettled([
      supabase.from('profiles').select('count', { count: 'exact', head: true }),
      supabase.from('golf_course_profiles').select('count', { count: 'exact', head: true }),
      supabase.from('professional_profiles').select('count', { count: 'exact', head: true }),
      supabase.from('jobs').select('count', { count: 'exact', head: true }),
      supabase.from('applications').select('count', { count: 'exact', head: true }),
    ])

    const results = {
      profiles: tableChecks[0].status === 'fulfilled' 
        ? { exists: true, count: tableChecks[0].value.count, error: tableChecks[0].value.error?.message }
        : { exists: false, error: tableChecks[0].reason?.message },
      golf_course_profiles: tableChecks[1].status === 'fulfilled'
        ? { exists: true, count: tableChecks[1].value.count, error: tableChecks[1].value.error?.message }
        : { exists: false, error: tableChecks[1].reason?.message },
      professional_profiles: tableChecks[2].status === 'fulfilled'
        ? { exists: true, count: tableChecks[2].value.count, error: tableChecks[2].value.error?.message }
        : { exists: false, error: tableChecks[2].reason?.message },
      jobs: tableChecks[3].status === 'fulfilled'
        ? { exists: true, count: tableChecks[3].value.count, error: tableChecks[3].value.error?.message }
        : { exists: false, error: tableChecks[3].reason?.message },
      applications: tableChecks[4].status === 'fulfilled'
        ? { exists: true, count: tableChecks[4].value.count, error: tableChecks[4].value.error?.message }
        : { exists: false, error: tableChecks[4].reason?.message },
    }

    // Test foreign key relationship by trying to insert a test profile
    const testUserId = '00000000-0000-0000-0000-000000000000'
    const { error: testError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        user_type: 'professional',
        full_name: 'Test User',
        email: 'test@example.com'
      })
      .select()
      .single()

    // This should fail with foreign key constraint error if schema is correct
    const foreignKeyTest = {
      attempted: true,
      error: testError?.message,
      error_code: testError?.code,
      foreign_key_working: testError?.code === '23503' // Foreign key violation expected
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tables: results,
      foreign_key_test: foreignKeyTest,
      environment: process.env.NODE_ENV
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
