import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('Database health check failed:', error)
      return NextResponse.json({
        status: 'unhealthy',
        database: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    })
  } catch (error: any) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      database: 'unknown',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    }, { status: 500 })
  }
}
