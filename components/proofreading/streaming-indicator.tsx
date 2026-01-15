"use client"

import { memo } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreamingIndicatorProps {
  isActive: boolean
  progress?: number
  message?: string
  className?: string
}

/**
 * ストリーミング処理中のインジケーターを表示するコンポーネント
 * プログレスバーとアニメーション付きで処理状況をフィードバック
 */
export const StreamingIndicator = memo(function StreamingIndicator({
  isActive,
  progress = 0,
  message = "AIが校正中です...",
  className,
}: StreamingIndicatorProps) {
  if (!isActive) return null

  const progressPercentage = Math.min(progress, 100)

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg bg-muted/50 p-4 border border-border",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* アニメーションスピナー */}
      <div className="relative" aria-hidden="true">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="absolute inset-0 h-5 w-5 animate-ping rounded-full bg-primary/20" />
      </div>

      {/* ステータス表示 */}
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">
          {message}
        </p>
        {progress > 0 && (
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="校正進捗"
            >
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums" aria-live="off">
              {progress.toLocaleString()}文字
            </span>
          </div>
        )}
      </div>
    </div>
  )
})
