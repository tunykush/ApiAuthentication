import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }
    const res = await fetch('https://edgenai-api.azure-api.net/api/v2/signup/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY!,
      },
      body: JSON.stringify({
        username: name,
        email,
        password,
        institution: 'Demo College', 
        phone: '',
        recaptcha: 'dummy-token',
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Signup failed' },
        { status: res.status }
      )
    }
    const response = NextResponse.json({
      message: 'Signup successful',
      username: data.username,
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