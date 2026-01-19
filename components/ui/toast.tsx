/**
 * トースト通知コンポーネント
 */

'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'
import X from 'lucide-react/dist/esm/icons/x'
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle'
import Info from 'lucide-react/dist/esm/icons/info'

// ============================================================================
// トーストバリアント
// ============================================================================

const toastVariants = cva(
  'flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all',
  {
    variants: {
      variant: {
        success: 'border-green-500/50 bg-green-950/50 text-green-50',
        error: 'border-red-500/50 bg-red-950/50 text-red-50',
        warning: 'border-yellow-500/50 bg-yellow-950/50 text-yellow-50',
        info: 'border-blue-500/50 bg-blue-950/50 text-blue-50',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
)

// ============================================================================
// 型定義
// ============================================================================

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  notification: Notification
  onDismiss?: (id: string) => void
}

export interface ToastContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

// ============================================================================
// アイコンマッピング
// ============================================================================

const iconMap: Record<Notification['type'], React.ComponentType<{ className?: string }>> = {
  success: CircleCheck,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

// ============================================================================
// トーストアイテム
// ============================================================================

export const Toast = React.memo(function Toast({
  notification,
  onDismiss,
  className,
  ...props
}: ToastProps) {
  const Icon = iconMap[notification.type]

  // アニメーション用の状態
  const [isExiting, setIsExiting] = React.useState(false)

  // 自動消去と手動消去の統合ハンドラ
  React.useEffect(() => {
    // durationがundefinedの場合は自動消去なし（手動のみ）
    if (notification.duration === undefined) return

    let animationTimer: NodeJS.Timeout | undefined

    const timer = setTimeout(() => {
      setIsExiting(true)
      // アニメーション完了後に消去
      animationTimer = setTimeout(() => {
        onDismiss?.(notification.id)
      }, 200)
    }, notification.duration)

    return () => {
      clearTimeout(timer)
      if (animationTimer) clearTimeout(animationTimer)
    }
  }, [notification.id, notification.duration, onDismiss])

  // 手動消去ハンドラ
  const handleDismiss = React.useCallback(() => {
    if (isExiting) return // すでに消去中なら何もしない
    setIsExiting(true)
    // アニメーション完了後に消去
    setTimeout(() => {
      onDismiss?.(notification.id)
    }, 200)
  }, [isExiting, notification.id, onDismiss])

  return (
    <div
      className={cn(
        toastVariants({ variant: notification.type }),
        'min-w-[300px] max-w-md',
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0',
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      {/* アイコン */}
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />

      {/* コンテンツ */}
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{notification.title}</p>
        {notification.message && (
          <p className="text-sm opacity-90">{notification.message}</p>
        )}
      </div>

      {/* 閉じるボタン */}
      <button
        onClick={handleDismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="閉じる"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
})

// ============================================================================
// トーストコンテナ
// ============================================================================

export const ToastContainer = React.memo(function ToastContainer({
  children,
  className,
  ...props
}: ToastContainerProps) {
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex flex-col gap-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

ToastContainer.displayName = 'ToastContainer'
Toast.displayName = 'Toast'
