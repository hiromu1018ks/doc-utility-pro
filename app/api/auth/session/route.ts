// セッション情報取得API

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
    })
  } catch (error) {
    // 認証エラーは「セッションなし」として扱う
    console.error('Session verification error:', error)
    return NextResponse.json(null)
  }
}
