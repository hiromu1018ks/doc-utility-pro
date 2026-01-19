/**
 * ダッシュボードデータフック
 *
 * localStorageからアクティビティを読み込み、統計と最近のアクティビティを提供する
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from './use-session'
import type { Activity, RecentActivity, DashboardStatistics, ActivityType } from '@/types'
import {
  getActivities,
  calculateStatistics,
  clearActivities as clearActivitiesStorage,
  formatRelativeTime,
  getActivityLabel,
  createActivity as createActivityStorage,
} from '@/lib/storage'

// ============================================================================
// 定数
// ============================================================================

/** 空の統計情報 */
const EMPTY_STATS: DashboardStatistics = {
  totalDocuments: 0,
  processedCount: 0,
  failedCount: 0,
  totalStorageUsed: 0,
}

// ============================================================================
// 型定義
// ============================================================================

/** フックの状態 */
export interface UseDashboardDataState {
  /** 統計情報 */
  stats: DashboardStatistics
  /** 最近のアクティビティ（RecentActivity形式） */
  recentActivities: RecentActivity[]
  /** 全アクティビティ */
  activities: Activity[]
  /** 読み込み中かどうか */
  isLoading: boolean
  /** エラーメッセージ */
  error: string | null
}

/** フックのアクション */
export interface UseDashboardDataActions {
  /** データを再読み込み */
  refresh: () => void
  /** アクティビティを追加 */
  addActivity: (
    type: ActivityType,
    fileName: string,
    status: 'completed' | 'failed' | 'processing',
    metadata?: {
      fileSize?: number
      pageCount?: number
      errorMessage?: string
    }
  ) => string
  /** 履歴をクリア */
  clearHistory: () => void
}

// ============================================================================
// 変換関数
// ============================================================================

/**
 * ActivityをRecentActivity形式に変換
 */
function toRecentActivity(activity: Activity): RecentActivity {
  return {
    id: activity.id,
    action: getActivityLabel(activity.type),
    fileName: activity.fileName,
    time: formatRelativeTime(activity.timestamp),
    status: activity.status,
  }
}

// ============================================================================
// フック実装
// ============================================================================

/**
 * ダッシュボードデータフック
 *
 * @returns [state, actions] タプル
 */
export function useDashboardData(): [UseDashboardDataState, UseDashboardDataActions] {
  const { session } = useSession()
  const userId = session?.user?.id

  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<DashboardStatistics>(EMPTY_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * データを読み込む
   */
  const loadData = useCallback(() => {
    if (!userId) {
      setActivities([])
      setStats(EMPTY_STATS)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const loadedActivities = getActivities(userId)
      const calculatedStats = calculateStatistics(userId)

      setActivities(loadedActivities)
      setStats(calculatedStats)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  /**
   * アクティビティを追加
   *
   * localStorageから直接読み込むことで、stale closureを回避
   */
  const addActivity = useCallback(
    (
      type: ActivityType,
      fileName: string,
      status: 'completed' | 'failed' | 'processing',
      metadata?: {
        fileSize?: number
        pageCount?: number
        errorMessage?: string
      }
    ): string => {
      if (!userId) return ''

      try {
        // storage.tsの関数を使用してアクティビティを作成・保存
        const activityId = createActivityStorage(
          userId,
          type,
          fileName,
          status,
          metadata
        )

        // 状態を更新（localStorageから再読み込み）
        loadData()

        return activityId
      } catch (err) {
        console.error('Failed to add activity:', err)
        return ''
      }
    },
    [userId, loadData]
  )

  /**
   * 履歴をクリア
   */
  const clearHistory = useCallback(() => {
    if (!userId) return

    try {
      clearActivitiesStorage(userId)
      setActivities([])
      setStats(EMPTY_STATS)
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }, [userId])

  // マウント時とユーザー変更時にデータを読み込む
  useEffect(() => {
    loadData()
  }, [loadData])

  // クロスタブ同期のためにstorageイベントをリッスン
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('doc-utility-v1-activities') && e.newValue !== null) {
        loadData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [loadData])

  // 最近のアクティビティ（最大10件）
  const recentActivities = useMemo(() => {
    return activities.slice(0, 10).map(toRecentActivity)
  }, [activities])

  const actions: UseDashboardDataActions = {
    refresh: loadData,
    addActivity,
    clearHistory,
  }

  const state: UseDashboardDataState = {
    stats,
    recentActivities,
    activities,
    isLoading,
    error,
  }

  return [state, actions]
}
