// app/api/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  id: string
  name: string
  email: string
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value  
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  try {
    const decoded = jwtDecode<DecodedToken>(token)
    return NextResponse.json({
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}