// ユーザー管理API

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import {
  normalizeEmail,
  validatePasswordComplexity,
  createAuditLog,
} from '@/lib/security'
import type { Role } from '@/types/auth'

/**
 * GET /api/users - ユーザー一覧を取得（管理者のみ）
 */
export async function GET() {
  try {
    await requireAdmin()

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    // 認証エラーとサーバーエラーを区別
    if (error instanceof Error) {
      const isAuthError =
        error.message === '認証が必要です' || error.message === '管理者権限が必要です'

      if (isAuthError) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }

      // その他のエラーはログに出力して500を返す
      console.error('User list error:', error)
      return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
    }
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

/**
 * POST /api/users - 新規ユーザーを作成（管理者のみ）
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()

    const body = await req.json()
    const { email, name, password, role = 'USER' } = body

    // バリデーション
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'メールアドレス、名前、パスワードは必須です' },
        { status: 400 }
      )
    }

    // メールアドレスを正規化
    const normalizedEmail = normalizeEmail(email)

    // パスワード複雑性検証
    const passwordValidation = validatePasswordComplexity(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join('、') },
        { status: 400 }
      )
    }

    // メールアドレスの重複チェック
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // パスワードをハッシュ化
    const hashedPassword = await hashPassword(password)

    // ユーザーを作成
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name,
        password: hashedPassword,
        role: role as Role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    // 監査ログを記録
    await createAuditLog(admin.id, 'USER_CREATED', {
      details: { email: normalizedEmail, targetUserId: user.id },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    // 認証エラーとサーバーエラーを区別
    if (error instanceof Error) {
      const isAuthError =
        error.message === '認証が必要です' || error.message === '管理者権限が必要です'

      if (isAuthError) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }

      // その他のエラーはログに出力して500を返す
      console.error('User creation error:', error)
      return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
    }
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
