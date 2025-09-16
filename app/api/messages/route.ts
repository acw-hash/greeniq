import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Messages API endpoint - Coming Soon',
    status: 'development',
    timestamp: new Date().toISOString(),
  })
}

export async function POST() {
  return NextResponse.json({
    message: 'Message sending functionality - Coming Soon',
    status: 'development',
  }, { status: 501 })
}
