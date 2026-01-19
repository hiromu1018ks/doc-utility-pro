// ユーザー削除API

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/security'

/**
 * DELETE /api/users/[id] - ユーザーを削除（管理者のみ）
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id } = await params

    // 自分自身を削除できないようにチェック
    if (id === admin.id) {
      return NextResponse.json(
        { error: '自分自身を削除することはできません' },
        { status: 400 }
      )
    }

    // 削除前にユーザー情報を取得（監査ログ用）
    const userToDelete = await db.user.findUnique({
      where: { id },
      select: { email: true, name: true },
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // ユーザーを削除
    await db.user.delete({
      where: { id },
    })

    // 監査ログを記録
    await createAuditLog(admin.id, 'USER_DELETED', {
      details: { email: userToDelete.email, name: userToDelete.name, targetUserId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // 認証エラーとサーバーエラーを区別
    if (error instanceof Error) {
      const isAuthError =
        error.message === '認証が必要です' || error.message === '管理者権限が必要です'

      if (isAuthError) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }

      // Prismaの特定のエラーをチェック
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { error: 'ユーザーが見つかりません' },
          { status: 404 }
        )
      }

      // その他のエラーはログに出力して500を返す
      console.error('User deletion error:', error)
      return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
    }
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
