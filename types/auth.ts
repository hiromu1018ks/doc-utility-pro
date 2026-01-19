// 認証関連の型定義
//
// NOTE: Role と AuditAction は Prisma schema でも定義されています。
// 両方を同期させる必要があります。変更時は prisma/schema.prisma も更新してください。

/** ユーザーロール */
export type Role = 'ADMIN' | 'USER'

/** 監査アクション種別 */
export type AuditAction =
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'USER_PASSWORD_CHANGED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'

/** 招待制のためのユーザー作成入力 */
export interface CreateUserInput {
  email: string
  password: string
  name: string
  role?: Role
}

/** ログインフォームの入力 */
export interface LoginFormData {
  email: string
  password: string
}

/** パスワード要件 */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

/** ロール階層（高いほど権限が強い） */
export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 100,
  USER: 10,
} as const

/**
 * ロールが権限を持っているかチェック
 * @param userRole ユーザーのロール
 * @param requiredRole 必要なロール
 */
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}
