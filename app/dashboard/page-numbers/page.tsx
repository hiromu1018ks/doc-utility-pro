/**
 * PDFページ番号挿入ページ
 * PDFにページ番号を追加する機能
 */

'use client'

import { useState, Suspense, useEffect } from 'react'
import { usePdfPageNumbers } from '@/hooks/use-pdf-page-numbers'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useNotifications } from '@/hooks/use-notifications'
import { DEFAULT_PDF_NUMBERING_OPTIONS, type PdfNumberingOptions } from '@/types'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import FileText from 'lucide-react/dist/esm/icons/file-text'
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle'
import dynamic from 'next/dynamic'

// 動的インポート（SSR無効化：pdf-libはクライアントのみ）
const UploadArea = dynamic(
  () =>
    import('@/components/pdf-merge/upload-area').then(
      (mod) => ({ default: mod.UploadArea })
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 animate-pulse">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
      </div>
    ),
  }
)

const MergeProgress = dynamic(
  () =>
    import('@/components/pdf-merge/merge-progress').then(
      (mod) => ({ default: mod.MergeProgress })
    ),
  { ssr: false }
)

const NumberingOptions = dynamic(
  () =>
    import('@/components/page-numbers/numbering-options').then(
      (mod) => ({ default: mod.NumberingOptions })
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-80 animate-pulse bg-muted/30" />
    ),
  }
)

export default function PageNumbersPage() {
  const [state, actions] = usePdfPageNumbers()
  const [options, setOptions] = useState<PdfNumberingOptions>(
    DEFAULT_PDF_NUMBERING_OPTIONS
  )
  const [, { addActivity }] = useDashboardData()
  const [, { show }] = useNotifications()

  // Track page numbering completion and errors (unified effect to prevent double renders)
  useEffect(() => {
    const fileName = state.file?.name || 'PDFファイル'
    // Success case
    if (state.numberingResult) {
      addActivity('numbering', state.numberingResult.filename, 'completed', {
        pageCount: state.numberingResult.pages,
      })
      show('success', 'ページ番号の追加が完了しました', `${state.numberingResult.pages}ページのPDFを作成しました`)
      return
    }
    // Error case
    if (state.error) {
      addActivity('numbering', fileName, 'failed', {
        errorMessage: state.error,
      })
      show('error', 'ページ番号の追加に失敗しました', state.error)
      return
    }
  }, [state.numberingResult, state.error, state.file, addActivity, show])

  /**
   * ファイル選択ハンドラ
   */
  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      actions.setFile(files[0])
    }
  }

  /**
   * ページ番号追加実行
   */
  const handleAddNumbers = async () => {
    await actions.addNumbers(options)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* メインコンテンツ（左側） */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* ヘッダー */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground">
              PDFページ番号の挿入
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              PDFファイルにページ番号を追加します。配置位置やフォントサイズをカスタマイズできます。
            </p>
          </div>

          {/* エラー表示 */}
          {state.error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
              <p className="flex-1 text-sm text-destructive">{state.error}</p>
              <button
                type="button"
                onClick={actions.clearError}
                className="flex-shrink-0 rounded p-1 text-destructive hover:bg-destructive/20"
                aria-label="エラーを閉じる"
              >
                ✕
              </button>
            </div>
          )}

          {/* 進捗表示 */}
          {state.progress && state.progress.stage !== 'completed' && (
            <div className="mb-6">
              <Suspense fallback={<div className="h-2" />}>
                <MergeProgress progress={state.progress} />
              </Suspense>
            </div>
          )}

          {/* 成功メッセージ */}
          {state.numberingResult && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-500">
                  ページ番号の追加が完了しました
                </p>
                <p className="text-xs text-muted-foreground">
                  {state.numberingResult.filename} ({state.numberingResult.pages}ページ)
                </p>
              </div>
            </div>
          )}

          {/* ファイルアップロードエリア or ファイル表示 */}
          {!state.file ? (
            <Suspense fallback={<div className="h-64 animate-pulse bg-muted/30 rounded-lg" />}>
              <UploadArea
                onFilesSelected={handleFileSelected}
                disabled={state.isProcessing}
              />
            </Suspense>
          ) : (
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{state.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {state.file.size} • {state.totalPages}ページ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={actions.removeFile}
                  disabled={state.isProcessing}
                  className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="ファイルを削除"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* サンプル画像/プレビュー（将来の拡張用） */}
          {state.file && !state.numberingResult && !state.isProcessing && (
            <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                右側のパネルで設定を調整し、「ページ番号を追加」ボタンを押してください
              </p>
            </div>
          )}
        </div>
      </div>

      {/* オプションパネル（右側） */}
      <div className="hidden w-80 xl:block">
        <Suspense fallback={<div className="h-full w-80 animate-pulse bg-muted/30" />}>
          <NumberingOptions
            options={options}
            onOptionsChange={setOptions}
            onExecute={handleAddNumbers}
            onDownload={actions.download}
            disabled={state.isProcessing || !state.file}
            isProcessing={state.isProcessing}
            hasResult={!!state.numberingResult}
            totalPages={state.totalPages}
          />
        </Suspense>
      </div>
    </div>
  )
}
