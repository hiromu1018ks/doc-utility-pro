// セキュリティ強化ユーティリティ

import { db } from './db'
import type { AuditAction } from '@/types/auth'

// ============= パスワード複雑性検証 =============

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * パスワードの複雑性を検証
 * - 最低8文字
 * - 少なくとも1つの小文字
 * - 少なくとも1つの大文字
 * - 少なくとも1つの数字
 */
export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('パスワードは8文字以上である必要があります')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('パスワードには少なくとも1つの小文字を含める必要があります')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('パスワードには少なくとも1つの大文字を含める必要があります')
  }
  if (!/\d/.test(password)) {
    errors.push('パスワードには少なくとも1つの数字を含める必要があります')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============= メールアドレス正規化 =============

/**
 * メールアドレスを正規化（小文字化とトリミング）
 * 同一メールアドレスでの重複登録を防ぐため
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// ============= レート制限（インメモリ） =============

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

/**
 * レート制限をチェック（ログイン試行など）
 * @param identifier 識別子（IPアドレス、メールアドレスなど）
 * @param config レート制限設定
 * @returns 制限を超過しているかどうか
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxAttempts: 5, windowMs: 60000 } // デフォルト: 1分間に5回
): { allowed: boolean; remainingAttempts: number; resetAt?: Date } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetTime) {
    // 新規エントリまたは期間切れ
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
      resetAt: new Date(now + config.windowMs),
    }
  }

  if (entry.count >= config.maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetAt: new Date(entry.resetTime),
    }
  }

  entry.count++
  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - entry.count,
    resetAt: new Date(entry.resetTime),
  }
}

/**
 * レート制限をリセット
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

// ============= アカウントロックアウト =============

export interface AccountLockoutConfig {
  maxFailedAttempts: number
  lockoutDurationMs: number
}

const DEFAULT_LOCKOUT_CONFIG: AccountLockoutConfig = {
  maxFailedAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000, // 15分
}

/**
 * アカウントがロックされているかチェック
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: { lockUntil: true },
    })

    if (!user?.lockUntil) return false

    // ロック期間が過ぎている場合は解除
    if (new Date() > user.lockUntil) {
      try {
        await db.user.update({
          where: { email: normalizeEmail(email) },
          data: {
            lockUntil: null,
            failedLoginAttempts: 0,
          },
        })
      } catch (err) {
        console.error('Failed to unlock account:', err)
      }
      return false
    }

    return true
  } catch (error) {
    // データベースエラー時はfail-open（ログインを許可）
    // セキュリティのためログは記録
    console.error('Account lock check failed:', error)
    return false
  }
}

/**
 * ログイン失敗を記録
 * @returns アカウントがロックされたかどうか
 */
export async function recordFailedLogin(
  email: string,
  config: AccountLockoutConfig = DEFAULT_LOCKOUT_CONFIG
): Promise<{ locked: boolean; lockUntil?: Date; remainingAttempts: number }> {
  try {
    const normalizedEmail = normalizeEmail(email)
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, failedLoginAttempts: true },
    })

    if (!user) {
      return { locked: false, remainingAttempts: config.maxFailedAttempts - 1 }
    }

    const newAttempts = user.failedLoginAttempts + 1

    if (newAttempts >= config.maxFailedAttempts) {
      // アカウントをロック
      const lockUntil = new Date(Date.now() + config.lockoutDurationMs)
      await db.user.update({
        where: { email: normalizedEmail },
        data: {
          failedLoginAttempts: newAttempts,
          lockUntil,
        },
      })

      // 監査ログを記録
      await createAuditLog(user.id, 'ACCOUNT_LOCKED', {
        details: { reason: `連続ログイン失敗: ${newAttempts}回` },
      })

      return {
        locked: true,
        lockUntil,
        remainingAttempts: 0,
      }
    }

    await db.user.update({
      where: { email: normalizedEmail },
      data: { failedLoginAttempts: newAttempts },
    })

    return {
      locked: false,
      remainingAttempts: config.maxFailedAttempts - newAttempts,
    }
  } catch (error) {
    // エラー時はロックなしを返す（ログは記録）
    console.error('Failed to record login failure:', error)
    return { locked: false, remainingAttempts: 0 }
  }
}

/**
 * ログイン成功時に失敗回数をリセット
 */
export async function resetFailedLogins(email: string): Promise<void> {
  try {
    await db.user.update({
      where: { email: normalizeEmail(email) },
      data: {
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    })
  } catch (error) {
    // エラーをログに記録
    console.error('Failed to reset failed logins:', error)
    throw error // 呼び出し元でハンドリングするため再スロー
  }
}

// ============= 監査ログ =============

export interface AuditLogOptions {
  ipAddress?: string
  userAgent?: string
  details?: Record<string, unknown>
}

/**
 * 監査ログを作成
 */
export async function createAuditLog(
  userId: string,
  action: AuditAction,
  options: AuditLogOptions = {}
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        details: options.details ? JSON.stringify(options.details) : null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      },
    })
  } catch (error) {
    // 監査ログの記録に失敗した場合のエラー記録
    console.error('[AUDIT_LOG_FAILURE]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error?.constructor?.name,
      userId,
      action,
      timestamp: new Date().toISOString(),
    })
    // TODO: 本番環境ではSentry等のモニタリングサービスに送信
    // Sentry.captureException(error, { tags: { type: 'audit_log_failure' } })
  }
}

/**
 * ユーザーの監査ログを取得
 */
export async function getUserAuditLogs(
  userId: string,
  limit = 50
): Promise<Array<{ id: string; action: string; details: string | null; createdAt: Date }>> {
  return db.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      details: true,
      createdAt: true,
    },
  })
}
