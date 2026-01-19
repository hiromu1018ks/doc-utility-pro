// ミドルウェア - ルート保護

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // パブリックルート（認証不要）
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/'

  // 認証済みでログインページにアクセスした場合、ダッシュボードへリダイレクト
  if (req.auth && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // 未認証でダッシュボードにアクセスした場合、ログインページへリダイレクト
  // パブリックルート以外の場合チェック
  if (!req.auth && !isPublicRoute && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

// ミドルウェアを適用するパスの設定
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
