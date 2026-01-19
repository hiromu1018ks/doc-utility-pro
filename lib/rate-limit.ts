/**
 * シンプルなインメモリレート制限
 *
 * 【重要な制約】
 * Vercel Serverless環境では、各関数呼び出しでメモリが独立しているため、
 * この実装は完全なレート制限としては機能しません。
 * 本番環境では以下のいずれかを使用することを推奨します：
 * - Vercel KV (Redis互換)
 * - Upstash Redis
 * - Edge Config
 *
 * 当実装は、同じサーバーレスインスタンス内での短時間の
 * 再送信防止としてのみ機能します。
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// リクエストごとの最大数
const MAX_REQUESTS = 10
// 時間枠（ミリ秒）
const WINDOW_MS = 60 * 1000 // 1分

// メモリストア（Serverless環境では各インスタンスで独立）
const store = new Map<string, RateLimitEntry>()

/**
 * レート制限をチェック
 *
 * @param identifier - 識別子（IPアドレス、ユーザーID等）
 * @returns レート制限を超過している場合はtrue
 */
export function checkRateLimit(identifier: string): boolean {
  const now = Date.now()

  // 古いエントリをクリーンアップ（エラーハンドリング付き）
  try {
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key)
      }
    }
  } catch (error) {
    // クリーンアップ失敗時はログのみ記録して続行
    console.error('[RATE_LIMIT] Cleanup failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      identifier,
      storeSize: store.size,
    })
    // ストアサイズが異常に大きい場合はリセットして無限成長を防止
    if (store.size > 10000) {
      store.clear()
    }
  }

  const entry = store.get(identifier)

  if (!entry || now > entry.resetTime) {
    // 新しい時間枠
    store.set(identifier, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    console.log('[RATE_LIMIT] Request allowed', {
      identifier,
      remaining: MAX_REQUESTS - 1,
      resetTime: new Date(now + WINDOW_MS).toISOString(),
    })
    return false
  }

  if (entry.count >= MAX_REQUESTS) {
    // レート制限超過をログ記録
    console.warn('[RATE_LIMIT] Exceeded', {
      identifier,
      count: entry.count,
      resetTime: new Date(entry.resetTime).toISOString(),
    })
    return true
  }

  entry.count++
  console.log('[RATE_LIMIT] Request allowed', {
    identifier,
    count: entry.count,
    remaining: MAX_REQUESTS - entry.count,
  })
  return false
}

/**
 * レート制限の残りリクエスト数を取得
 *
 * @param identifier - 識別子（IPアドレス、ユーザーID等）
 * @returns 残りリクエスト数（枠がリセットされている場合はMAX_REQUESTS）
 */
export function getRemainingRequests(identifier: string): number {
  const entry = store.get(identifier)
  if (!entry || Date.now() > entry.resetTime) {
    return MAX_REQUESTS
  }
  return Math.max(0, MAX_REQUESTS - entry.count)
}

/**
 * リセットまでの時間（秒）を取得
 *
 * @param identifier - 識別子（IPアドレス、ユーザーID等）
 * @returns リセットまでの秒数（既にリセットされている場合は0）
 */
export function getResetTime(identifier: string): number {
  const entry = store.get(identifier)
  if (!entry) {
    return 0
  }
  return Math.max(0, Math.ceil((entry.resetTime - Date.now()) / 1000))
}
