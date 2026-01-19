/**
 * localStorageユーティリティ
 *
 * ユーザーごとのアクティビティ記録と統計計算を担当する純粋関数群
 */

import type { Activity, DashboardStatistics, ActivityType } from '@/types'

// ============================================================================
// 定数
// ============================================================================

/** ストレージキーのプレフィックス */
const STORAGE_PREFIX = 'doc-utility-v1'

/** 保持する最大アクティビティ数 */
const MAX_ACTIVITIES = 100

/** アクティビティ保存用のキーを生成 */
function getActivityKey(userId: string): string {
  return `${STORAGE_PREFIX}-activities-${userId}`
}

// ============================================================================
// アクティビティ操作
// ============================================================================

/**
 * ユーザーのアクティビティ一覧を取得
 *
 * @param userId - ユーザーID
 * @returns アクティビティ配列（破損時は空配列）
 */
export function getActivities(userId: string): Activity[] {
  if (!userId) return []

  try {
    const key = getActivityKey(userId)
    const stored = localStorage.getItem(key)

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    // 配列であることを確認
    if (!Array.isArray(parsed)) {
      console.warn('Invalid activities format, clearing storage')
      localStorage.removeItem(key)
      return []
    }

    // タイムスタンプでソート（新しい順）
    return parsed.sort((a: Activity, b: Activity) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Failed to load activities:', error)
    return []
  }
}

/**
 * アクティビティを保存
 *
 * @param userId - ユーザーID
 * @param activity - 保存するアクティビティ
 */
export function saveActivity(userId: string, activity: Activity): void {
  if (!userId) return

  try {
    const activities = getActivities(userId)

    // 新しいアクティビティを追加
    activities.unshift(activity)

    // 最大数を超えていれば古いものを削除
    const trimmed = activities.slice(0, MAX_ACTIVITIES)

    const key = getActivityKey(userId)
    localStorage.setItem(key, JSON.stringify(trimmed))
  } catch (error) {
    // クォータ超過時の処理
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, clearing old activities')
      clearActivities(userId)
      // 再試行
      try {
        const key = getActivityKey(userId)
        localStorage.setItem(key, JSON.stringify([activity]))
      } catch (retryError) {
        console.error('Failed to save activity after cleanup:', retryError)
      }
    } else {
      console.error('Failed to save activity:', error)
    }
  }
}

/**
 * アクティビティを作成して保存
 *
 * @param userId - ユーザーID
 * @param type - アクティビティ種別
 * @param fileName - ファイル名
 * @param status - ステータス
 * @param metadata - 追加メタデータ
 * @returns 作成されたアクティビティID
 */
export function createActivity(
  userId: string,
  type: ActivityType,
  fileName: string,
  status: 'completed' | 'failed' | 'processing',
  metadata?: {
    fileSize?: number
    pageCount?: number
    errorMessage?: string
  }
): string {
  const activity: Activity = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    userId,
    type,
    fileName,
    timestamp: Date.now(),
    status,
    fileSize: metadata?.fileSize,
    pageCount: metadata?.pageCount,
    errorMessage: metadata?.errorMessage,
  }

  saveActivity(userId, activity)
  return activity.id
}

/**
 * ユーザーの全アクティビティを削除
 *
 * @param userId - ユーザーID
 */
export function clearActivities(userId: string): void {
  if (!userId) return

  const key = getActivityKey(userId)
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear activities:', error)
  }
}

/**
 * 特定のアクティビティを削除
 *
 * @param userId - ユーザーID
 * @param activityId - 削除するアクティビティID
 */
export function deleteActivity(userId: string, activityId: string): void {
  if (!userId) return

  try {
    const activities = getActivities(userId)
    const filtered = activities.filter(a => a.id !== activityId)

    const key = getActivityKey(userId)
    localStorage.setItem(key, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to delete activity:', error)
  }
}

// ============================================================================
// 統計計算
// ============================================================================

/**
 * ユーザーの統計情報を計算
 *
 * @param userId - ユーザーID
 * @returns 統計情報
 */
export function calculateStatistics(userId: string): DashboardStatistics {
  const activities = getActivities(userId)

  const completed = activities.filter(a => a.status === 'completed')
  const failed = activities.filter(a => a.status === 'failed')

  return {
    totalDocuments: activities.length,
    processedCount: completed.length,
    failedCount: failed.length,
    totalStorageUsed: completed.reduce((sum, a) => sum + (a.fileSize || 0), 0),
  }
}

// ============================================================================
// ユーティリティ関数
// ============================================================================

/**
 * バイト数を人間が読める形式に変換
 *
 * @param bytes - バイト数
 * @returns フォーマットされた文字列（例: "1.5 MB"）
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * タイムスタンプを相対時間文字列に変換
 *
 * @param timestamp - タイムスタンプ（ミリ秒）
 * @returns 相対時間文字列（例: "2時間前"）
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  if (hours < 24) return `${hours}時間前`
  if (days < 7) return `${days}日前`

  return new Date(timestamp).toLocaleDateString('ja-JP')
}

/**
 * アクティビティ種別から日本語ラベルを取得
 *
 * @param type - アクティビティ種別
 * @returns 日本語ラベル
 */
export function getActivityLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    merge: '結合',
    split: '分割',
    compress: '圧縮',
    numbering: 'ページ番号',
    'page-manage': 'ページ管理',
    proofread: '校正',
  }
  return labels[type] ?? type
}
