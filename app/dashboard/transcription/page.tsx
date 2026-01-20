"use client"

import { Suspense, useState, useCallback, useEffect } from "react"
import { Mic, AlertCircle } from "lucide-react"
import { useTranscription } from "@/hooks/use-transcription"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useNotifications } from "@/hooks/use-notifications"
import { DEFAULT_AUDIO_UPLOAD_OPTIONS } from "@/types"
import { MEETING_MINUTES_TEMPLATES } from "@/lib/constants"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// 動的インポートでコード分割
const UploadArea = dynamic(
  () => import("@/components/transcription/upload-area").then(m => ({ default: m.UploadArea })),
  { ssr: false }
)

const TemplateSelector = dynamic(
  () => import("@/components/transcription/template-selector").then(m => ({ default: m.TemplateSelector })),
  { ssr: false }
)

const TranscriptionProgress = dynamic(
  () => import("@/components/transcription/transcription-progress").then(m => ({ default: m.TranscriptionProgress })),
  { ssr: false }
)

const TranscriptionResult = dynamic(
  () => import("@/components/transcription/transcription-result").then(m => ({ default: m.TranscriptionResult })),
  { ssr: false }
)

// スケルトンローディング
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
}

export default function TranscriptionPage() {
  const [state, actions] = useTranscription()
  const [templateId, setTemplateId] = useState<string>(DEFAULT_AUDIO_UPLOAD_OPTIONS.templateId || "standard")
  const [, { addActivity }] = useDashboardData()
  const [, { show }] = useNotifications()

  // ファイル選択時
  const handleFileSelected = useCallback((file: File) => {
    actions.setFile(file)
  }, [actions])

  // 文字起こし開始
  const handleStart = useCallback(async () => {
    if (!state.file) return

    await actions.startTranscription(state.file, { templateId })
  }, [state.file, templateId, actions])

  // 完了時の通知（useEffectで副作用を適切に処理）
  useEffect(() => {
    if (state.status === "completed" && state.result) {
      addActivity("transcription", state.result.fileName, "completed", {
        fileSize: state.file?.size,
      })
      show("success", "音声認識が完了しました", "議事録を作成しました")
    }
  }, [state.status, state.result, state.file, addActivity, show])

  // リセット
  const handleReset = useCallback(() => {
    actions.reset()
  }, [actions])

  // 結果が来たら完了通知
  if (state.status === "completed" && !state.result) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">結果を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* メインコンテンツ */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* ページヘッダー */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">音声認識・議事録</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  AIが自動で音声を文字起こしし、会議の議事録を生成します
                </p>
              </div>
            </div>
          </div>

          {/* エラー表示 */}
          {state.error && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm flex-1">{state.error}</p>
              <button
                type="button"
                onClick={actions.clearError}
                className="rounded p-1 hover:bg-destructive/20"
              >
                ×
              </button>
            </div>
          )}

          {/* アイドル状態：アップロード＆テンプレート選択 */}
          {state.status === "idle" && (
            <>
              <Suspense fallback={<Skeleton className="h-64" />}>
                <UploadArea
                  onFileSelected={handleFileSelected}
                />
              </Suspense>

              <Suspense fallback={<Skeleton className="h-48" />}>
                <TemplateSelector
                  selectedTemplateId={templateId}
                  onTemplateChange={setTemplateId}
                />
              </Suspense>

              {/* 開始ボタン */}
              {state.file && (
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleStart}
                    className="gap-2"
                  >
                    <Mic className="h-5 w-5" />
                    文字起こしを開始
                  </Button>
                </div>
              )}
            </>
          )}

          {/* 処理中：進捗表示 */}
          {state.status === "processing" && (
            <Suspense fallback={<Skeleton className="h-64" />}>
              <TranscriptionProgress
                stage={state.currentStep}
                percentage={state.progressPercent}
                fileName={state.file?.name}
              />
            </Suspense>
          )}

          {/* 完了：結果表示 */}
          {state.status === "completed" && state.result && (
            <Suspense fallback={<Skeleton className="h-64" />}>
              <TranscriptionResult
                result={state.result}
                onReset={handleReset}
              />
            </Suspense>
          )}

          {/* 処理情報 */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              <strong>対応フォーマット:</strong> MP3 / WAV / AAC / FLAC / M4A（最大500MB）
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>処理時間:</strong> ファイルサイズにより数分かかる場合があります
            </p>
          </div>
        </div>
      </div>

      {/* 右パネル（オプション） - デスクトップのみ */}
      <div className="hidden w-80 border-l border-border bg-muted/20 p-6 xl:block">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-foreground">使い方</h3>
            <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  1
                </span>
                <span>音声ファイルをアップロード</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  2
                </span>
                <span>議事録テンプレートを選択</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  3
                </span>
                <span>「文字起こしを開始」をクリック</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  4
                </span>
                <span>結果を編集・ダウンロード</span>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground">テンプレート</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              {(MEETING_MINUTES_TEMPLATES[templateId as keyof typeof MEETING_MINUTES_TEMPLATES] || MEETING_MINUTES_TEMPLATES.standard).name}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
