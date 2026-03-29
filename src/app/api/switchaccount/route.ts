import { NextResponse } from 'next/server'
import { getUserById } from '@/lib/mockdb'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const user = getUserById(Number(userId))

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const response = NextResponse.json({
      message: 'Switched account successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        initials: user.initials,
      },
    })

    response.cookies.set('auth_user_id', String(user.id), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'Switch account failed' },
      { status: 500 }
    )
  }
}