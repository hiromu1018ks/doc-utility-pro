"use client"

import { Loader2, Upload, Music, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProcessingStep } from "@/types"

const STAGE_CONFIG: Record<ProcessingStep, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  UPLOADING: { icon: Upload, label: "アップロード中" },
  VALIDATING: { icon: Upload, label: "ファイル検証中" },
  TRANSCRIBING: { icon: Music, label: "文字起こし中" },
  GENERATING: { icon: FileText, label: "議事録生成中" },
  FINALIZING: { icon: FileText, label: "最終処理中" },
}

interface TranscriptionProgressProps {
  stage: ProcessingStep | "error"
  percentage: number
  fileName?: string
  errorMessage?: string
  className?: string
}

export function TranscriptionProgress({ stage, percentage, fileName, errorMessage, className }: TranscriptionProgressProps) {
  const isError = stage === "error"
  const config = STAGE_CONFIG[isError ? "UPLOADING" : stage]
  const Icon = isError ? AlertCircle : config.icon

  const displayPercentage = isError ? 0 : percentage

  return (
    <div className={cn("space-y-6", className)}>
      {/* ステータス表示 */}
      <div className="flex items-center gap-4">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
          isError
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary"
        )}>
          {isError ? (
            <Icon className="h-6 w-6" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin" />
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {isError ? "エラーが発生しました" : config.label}
          </p>
          {fileName && !isError && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {fileName}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className={cn(
            "text-lg font-bold tabular-nums",
            isError ? "text-destructive" : "text-primary"
          )}>
            {displayPercentage}%
          </p>
        </div>
      </div>

      {/* プログレスバー */}
      <div className="space-y-2">
        <div className="relative h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "absolute left-0 top-0 h-full transition-all duration-500 ease-out",
              isError ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${displayPercentage}%` }}
          />
        </div>

        {/* ステップインジケーター */}
        {!isError && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={cn(
              "flex items-center gap-1",
              displayPercentage >= 0 && "text-foreground"
            )}>
              {displayPercentage >= 0 ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
              アップロード
            </span>
            <span className={cn(
              "flex items-center gap-1",
              displayPercentage >= 50 && "text-foreground"
            )}>
              {displayPercentage >= 50 ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
              文字起こし
            </span>
            <span className={cn(
              "flex items-center gap-1",
              displayPercentage >= 90 && "text-foreground"
            )}>
              {displayPercentage >= 90 ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
              議事録生成
            </span>
          </div>
        )}
      </div>

      {/* 説明テキスト */}
      <div className="rounded-lg bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          {isError
            ? "処理中にエラーが発生しました。もう一度お試しください。"
            : "AIが音声を分析しています。ファイルサイズにより数分かかる場合があります。このページを閉じないでください。"
          }
        </p>
      </div>
    </div>
  )
}
