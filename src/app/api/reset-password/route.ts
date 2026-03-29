import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {  email } = body

    if (email === undefined) {
      return NextResponse.json(
        { error: 'Email are required' },
        { status: 400 }
      )
    }
    const res = await fetch('https://edgenai-api.azure-api.net/api/v2/password-reset/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY!,
      },
      body: JSON.stringify({
        email,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Reset failed' },
        { status: res.status }
      )
    }
    const response = NextResponse.json({
      message: 'Reset successful',
    })
    response.cookies.set('auth_user', data.username, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signup failed' },
      { status: 500 }
    )
  }
}