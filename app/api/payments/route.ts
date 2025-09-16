import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Payments API endpoint - Coming Soon',
    status: 'development',
    timestamp: new Date().toISOString(),
  })
}

export async function POST() {
  return NextResponse.json({
    message: 'Payment processing functionality - Coming Soon',
    status: 'development',
  }, { status: 501 })
}
