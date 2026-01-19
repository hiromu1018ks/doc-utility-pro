// サインアウトAPI

import { NextResponse } from 'next/server'
import { signOut, auth } from '@/lib/auth'

export async function POST() {
  try {
    // セッションを検証してからサインアウト（CSRF保護）
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 })
    }

    await signOut({ redirect: false })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json(
      { error: 'サインアウトに失敗しました。ブラウザのクッキーをクリアしてからもう一度お試しください。' },
      { status: 500 }
    )
  }
}
