// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  exp?: number
  [key: string]: unknown
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value
  const refreshToken = req.cookies.get('refresh_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/signin', req.url))
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token)
    const now = Math.floor(Date.now() / 1000)

    if (decoded.exp && decoded.exp < now) {
      if (!refreshToken) return NextResponse.redirect(new URL('/signin', req.url))

      const res = await fetch(
        `https://edgenai-api.azure-api.net/api/v2/token/refresh?refresh=${refreshToken}`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.EDAI_API_KEY!,
            'Content-Type': 'application/json',
          },
        }
      )
      const data = await res.json()
      if (!data.access) return NextResponse.redirect(new URL('/signin', req.url))

      const response = NextResponse.next()
      response.cookies.set('access_token', data.access, { httpOnly: true, path: '/' })
      if (data.refresh) response.cookies.set('refresh_token', data.refresh, { httpOnly: true, path: '/' })
      return response
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/signin', req.url))
  }
}

export const config = {
  matcher: ['/profile/:path*', '/dashboard/:path*'],
}