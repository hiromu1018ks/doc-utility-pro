'use client'

import { useState, Suspense, useEffect } from 'react'
import { usePdfCompression } from '@/hooks/use-pdf-compression'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useNotifications } from '@/hooks/use-notifications'
import dynamic from 'next/dynamic'
import { DEFAULT_PDF_COMPRESSION_OPTIONS, type PdfCompressionOptions } from '@/types'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import X from 'lucide-react/dist/esm/icons/x'
import Archive from 'lucide-react/dist/esm/icons/archive'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Dynamic imports for better bundle splitting
const UploadArea = dynamic(
  () => import('@/components/pdf-merge/upload-area').then(mod => ({ default: mod.UploadArea })),
  {
    loading: () => (
      <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 animate-pulse">
        <div className="flex flex-col items-center justify-center">
          <div className="h-12 w-12 bg-muted/50 rounded-full mb-4" />
          <div className="h-4 bg-muted/50 rounded w-48 mb-2" />
          <div className="h-3 bg-muted/50 rounded w-32" />
        </div>
      </div>
    ),
    ssr: false
  }
)

const CompressionProgress = dynamic(
  () => import('@/components/pdf-merge/merge-progress').then(mod => ({ default: mod.MergeProgress })),
  {
    loading: () => <div className="h-12 bg-muted/50 rounded animate-pulse" />,
    ssr: false
  }
)

const CompressionOptions = dynamic(
  () => import('@/components/pdf-compress/compression-options').then(mod => ({ default: mod.CompressionOptions })),
  {
    loading: () => <div className="w-80 h-full bg-muted/30 animate-pulse" />,
    ssr: false
  }
)

/**
 * PDF圧縮ページ
 * ファイルアップロード、圧縮処理、結果ダウンロードを統合
 */
export default function PDFCompressPage() {
  const [state, actions] = usePdfCompression()
  const [options, setOptions] = useState<PdfCompressionOptions>(DEFAULT_PDF_COMPRESSION_OPTIONS)
  const [, { addActivity }] = useDashboardData()
  const [, { show }] = useNotifications()

  // Track successful compression completion
  useEffect(() => {
    if (state.compressionResult) {
      const reductionPercent = state.compressionResult.reductionRate
      addActivity('compress', state.compressionResult.filename, 'completed', {
        fileSize: state.compressionResult.compressedSize,
        pageCount: state.compressionResult.pages,
      })

      if (reductionPercent > 0) {
        show('success', 'PDFの圧縮が完了しました', `${reductionPercent}%のファイルサイズ削減`)
      } else {
        show('info', '圧縮処理が完了しました', 'これ以上圧縮できませんでした')
      }
    }
  }, [state.compressionResult, addActivity, show])

  // Track compression errors
  useEffect(() => {
    if (state.error) {
      addActivity('compress', state.file?.name || 'PDFファイル', 'failed', {
        errorMessage: state.error,
      })
      show('error', '圧縮に失敗しました', state.error)
    }
  }, [state.error, state.file, addActivity, show])

  // 圧縮実行ハンドラ
  const handleCompress = async () => {
    await actions.compress(options)
  }

  // ダウンロードハンドラ
  const handleDownload = () => {
    actions.download()
  }

  // ファイル選択ハンドラ
  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      actions.setFile(files[0])
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Page Title */}
          <div>
            <div className="flex items-center gap-2">
              <Archive className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                PDFファイルの圧縮
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              PDFファイルを圧縮してファイルサイズを削減できます（最大50MB）
            </p>
          </div>

          {/* Error Display */}
          {state.error && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm flex-1">{state.error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={actions.clearError}
                className="h-8 w-8 p-0 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Progress Display */}
          <Suspense fallback={<div className="h-12 bg-muted/50 rounded animate-pulse" />}>
            <CompressionProgress progress={state.progress} />
          </Suspense>

          {/* Upload Area or File Info */}
          {state.file ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Archive className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{state.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {state.file.size} {state.file.pages && `• ${state.file.pages} ページ`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actions.clearFile}
                  disabled={state.isProcessing}
                >
                  クリア
                </Button>
              </div>
            </div>
          ) : (
            <Suspense fallback={
              <div className="rounded-lg border-2 border-dashed border-border bg-card p-12 animate-pulse">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-12 w-12 bg-muted/50 rounded-full mb-4" />
                  <div className="h-4 bg-muted/50 rounded w-48 mb-2" />
                  <div className="h-3 bg-muted/50 rounded w-32" />
                </div>
              </div>
            }>
              <UploadArea
                onFilesSelected={handleFilesSelected}
                disabled={state.isProcessing}
              />
            </Suspense>
          )}

          {/* Completion Message */}
          {state.compressionResult && (
            <div className={cn(
              "rounded-lg border p-4",
              state.compressionResult.reductionRate > 0
                ? "border-green-500/50 bg-green-500/10"
                : "border-blue-500/50 bg-blue-500/10"
            )}>
              <p className={cn(
                "text-sm font-medium",
                state.compressionResult.reductionRate > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-blue-600 dark:text-blue-400"
              )}>
                {state.compressionResult.reductionRate > 0
                  ? '圧縮が完了しました！'
                  : '圧縮処理が完了しました'
                }
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {state.compressionResult.filename} (
                {(state.compressionResult.compressedSize / 1024 / 1024).toFixed(2)} MB, {state.compressionResult.pages} ページ)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Compression Options */}
      <div className="hidden w-80 border-l border-border xl:block">
        <Suspense fallback={<div className="w-80 h-full bg-muted/30 animate-pulse" />}>
          <CompressionOptions
            options={options}
            onOptionsChange={setOptions}
            onCompress={handleCompress}
            onDownload={state.compressionResult ? handleDownload : undefined}
            disabled={state.isProcessing || !state.file}
            isProcessing={state.isProcessing}
            compressionResult={state.compressionResult}
          />
        </Suspense>
      </div>
    </div>
  )
}
