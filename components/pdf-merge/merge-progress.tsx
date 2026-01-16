'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { ProcessingProgress } from '@/types'
import Loader2 from 'lucide-react/dist/esm/icons/loader-2'
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'

interface MergeProgressProps {
  progress: ProcessingProgress | null
  className?: string
}

/**
 * PDF結合進捗表示コンポーネント
 * StreamingIndicatorパターンを再利用
 */
export const MergeProgress = memo(function MergeProgress({
  progress,
  className,
}: MergeProgressProps) {
  if (!progress) return null

  const getStatusIcon = () => {
    switch (progress.stage) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return (
          <div className="relative" aria-hidden="true">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="absolute inset-0 h-5 w-5 animate-ping rounded-full bg-primary/20" />
          </div>
        )
    }
  }

  const getStageLabel = () => {
    const labels: Record<ProcessingProgress['stage'], string> = {
      validating: '検証中',
      loading: '読み込み中',
      processing: '処理中',
      finalizing: '最終処理中',
      completed: '完了',
      error: 'エラー',
    }
    return labels[progress.stage]
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg bg-muted/50 p-4 border border-border',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy={progress.stage !== 'completed' && progress.stage !== 'error'}
    >
      {/* ステータスアイコン */}
      {getStatusIcon()}

      {/* ステータス表示 */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {getStageLabel()}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {progress.percentage}%
          </p>
        </div>

        {/* プログレスバー */}
        <div
          className="h-2 w-full bg-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progress.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {/* メッセージ */}
        {progress.message && (
          <p className="text-xs text-muted-foreground">{progress.message}</p>
        )}

        {/* ファイル進捗 */}
        {progress.currentFile !== undefined && progress.totalFiles !== undefined && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {progress.currentFile} / {progress.totalFiles} ファイル
          </p>
        )}
      </div>
    </div>
  )
})
