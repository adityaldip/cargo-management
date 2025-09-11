import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    const missingVars = Object.entries(envCheck)
      .filter(([_, exists]) => !exists)
      .map(([key, _]) => key)

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missing: missingVars,
        envCheck
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'All environment variables are set',
      envCheck
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
