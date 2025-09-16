import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Admin API endpoint - Coming Soon',
    status: 'development',
    timestamp: new Date().toISOString(),
  })
}

export async function POST() {
  return NextResponse.json({
    message: 'Admin functionality - Coming Soon',
    status: 'development',
  }, { status: 501 })
}
