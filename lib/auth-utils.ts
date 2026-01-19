// 認証ユーティリティ関数

import { auth } from './auth'
import { ROLE_HIERARCHY } from '@/types/auth'
import type { Role } from '@/types/auth'

/**
 * サーバーコンポーネントで現在のセッションを取得する
 */
export async function getSession() {
  return await auth()
}

/**
 * 認証済みユーザーを取得する。未認証の場合はnullを返す
 */
export async function getOptionalUser() {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * 認証が必要な操作で使用。未認証の場合はエラーを投げる
 */
export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    throw new Error('認証が必要です')
  }
  return session.user
}

/**
 * 管理者権限が必要な操作で使用
 */
export async function requireAdmin(): Promise<{
  id: string
  email: string
  name: string
  role: Role
}> {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') {
    throw new Error('管理者権限が必要です')
  }
  return user
}

/**
 * ユーザーが指定されたロール以上の権限を持っているかチェック
 */
export async function hasRole(requiredRole: Role): Promise<boolean> {
  const session = await getSession()
  if (!session?.user) return false
  return (ROLE_HIERARCHY[session.user.role as Role] ?? 0) >= ROLE_HIERARCHY[requiredRole]
}
