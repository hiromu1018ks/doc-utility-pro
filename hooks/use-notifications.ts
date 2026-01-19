/**
 * 通知フック
 *
 * トースト通知の表示・管理を行う
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Notification, NotificationType } from '@/types'

// ============================================================================
// 型定義
// ============================================================================

/** フックの状態 */
export interface UseNotificationsState {
  /** 通知一覧 */
  notifications: Notification[]
}

/** フックのアクション */
export interface UseNotificationsActions {
  /** 通知を表示 */
  show: (
    type: NotificationType,
    title: string,
    message?: string,
    duration?: number
  ) => string
  /** 通知を消去 */
  dismiss: (id: string) => void
  /** 全通知を消去 */
  clear: () => void
}

// ============================================================================
// 定数
// ============================================================================

/** デフォルトの表示時間（ミリ秒） */
const DEFAULT_DURATION = 5000

/** 最大同時表示数 */
const MAX_NOTIFICATIONS = 5

// ============================================================================
// フック実装
// ============================================================================

/**
 * 通知フック
 *
 * @returns [state, actions] タプル
 */
export function useNotifications(): [UseNotificationsState, UseNotificationsActions] {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // タイマー参照を保持（クリーンアップ用）
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // dismiss関数への安定した参照を保持（show内での使用のため）
  // useRefを使用することで、showの依存配列にdismissを含めずに済み、
  // useEffect内でdismissが更新された際にshowが再生成されないようにする
  const dismissRef = useRef<(id: string) => void | null>(null)

  /**
   * 通知を消去
   *
   * @param id - 消去する通知ID
   */
  const dismiss = useCallback((id: string) => {
    // タイマーをクリア
    const timer = timersRef.current.get(id)
    if (timer) {
      try {
        clearTimeout(timer)
      } catch (err) {
        console.error('[NOTIFICATIONS] Failed to clear timer:', { id, error: err })
      }
      timersRef.current.delete(id)
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // dismissRefを更新（useEffect内で行うことで、dismissの依存関係を安定させる）
  useEffect(() => {
    dismissRef.current = dismiss
    return () => {
      dismissRef.current = null
    }
  }, [dismiss])

  /**
   * 通知を表示
   *
   * @param type - 通知種別
   * @param title - タイトル
   * @param message - メッセージ（オプション）
   * @param duration - 表示時間（ミリ秒、undefinedで手動消去）
   * @returns 通知ID
   */
  const show = useCallback(
    (
      type: NotificationType,
      title: string,
      message?: string,
      duration: number = DEFAULT_DURATION
    ): string => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      const notification: Notification = {
        id,
        type,
        title,
        message,
        timestamp: Date.now(),
        duration,
      }

      setNotifications((prev) => {
        const updated = [notification, ...prev]
        // 最大数を超えていれば古いものを削除
        return updated.slice(0, MAX_NOTIFICATIONS)
      })

      // 自動消去タイマーを設定
      if (duration !== undefined) {
        const timer = setTimeout(() => {
          dismissRef.current?.(id)
        }, duration)

        timersRef.current.set(id, timer)
      }

      return id
    },
    []
  )

  /**
   * 全通知を消去
   */
  const clear = useCallback(() => {
    // 全タイマーをクリア
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()

    setNotifications([])
  }, [])

  // アンマウント時に全タイマーをクリア
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const actions: UseNotificationsActions = {
    show,
    dismiss,
    clear,
  }

  const state: UseNotificationsState = {
    notifications,
  }

  return [state, actions]
}

// ============================================================================
// ヘルパー関数
// ============================================================================

/**
 * 成功通知を表示するヘルパー
 */
export function showSuccess(
  showFn: UseNotificationsActions['show'],
  title: string,
  message?: string
): string {
  return showFn('success', title, message)
}

/**
 * エラー通知を表示するヘルパー
 */
export function showError(
  showFn: UseNotificationsActions['show'],
  title: string,
  message?: string
): string {
  return showFn('error', title, message)
}

/**
 * 警告通知を表示するヘルパー
 */
export function showWarning(
  showFn: UseNotificationsActions['show'],
  title: string,
  message?: string
): string {
  return showFn('warning', title, message)
}

/**
 * 情報通知を表示するヘルパー
 */
export function showInfo(
  showFn: UseNotificationsActions['show'],
  title: string,
  message?: string
): string {
  return showFn('info', title, message)
}
