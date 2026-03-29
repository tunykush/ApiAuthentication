import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { name, password } = await req.json()
  console.log(name, password);
  try {
    const res = await fetch('https://edgenai-api.azure-api.net/api/v2/token?username=' + name + '&password=' + password, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY!,
       },
      
      body: JSON.stringify({ username: name, password }),
    })
    const data = await res.json()
    console.log('data :>> ', data);
    if (!data.access) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const response = NextResponse.json({ access_token: data.access })
    response.cookies.set('access_token', data.access, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
    return response
  } catch (err) {
    return NextResponse.json({ error: 'Signin failed' }, { status: 500 })
  }
}