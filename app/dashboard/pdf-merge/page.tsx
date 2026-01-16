'use client'

import { useState, Suspense } from 'react'
import { usePdfMerge } from '@/hooks/use-pdf-merge'
import dynamic from 'next/dynamic'
import { DEFAULT_PDF_MERGE_OPTIONS, type PdfMergeOptions } from '@/types'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import X from 'lucide-react/dist/esm/icons/x'
import { Button } from '@/components/ui/button'

// Dynamic imports for better bundle splitting
// PDF-related components are client-side only (ssr: false) due to pdf-lib
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

const FileList = dynamic(
  () => import('@/components/pdf-merge/file-list').then(mod => ({ default: mod.FileList })),
  {
    loading: () => (
      <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
        <div className="h-24 bg-muted/50 rounded" />
      </div>
    ),
    ssr: false
  }
)

const OutputOptions = dynamic(
  () => import('@/components/pdf-merge/output-options').then(mod => ({ default: mod.OutputOptions })),
  {
    loading: () => (
      <div className="w-80 h-full bg-muted/30 animate-pulse" />
    ),
    ssr: false
  }
)

const MergeProgress = dynamic(
  () => import('@/components/pdf-merge/merge-progress').then(mod => ({ default: mod.MergeProgress })),
  {
    loading: () => <div className="h-12 bg-muted/50 rounded animate-pulse" />,
    ssr: false
  }
)

/**
 * PDFマージページ
 * ファイルアップロード、並べ替え、結合処理を統合
 */
export default function PDFMergePage() {
  const [state, actions] = usePdfMerge()
  const [options, setOptions] = useState<PdfMergeOptions>(DEFAULT_PDF_MERGE_OPTIONS)

  // 結合ステータスの判定
  const mergeStatus: 'idle' | 'processing' | 'completed' | 'error' = state.isProcessing
    ? 'processing'
    : state.mergeResult
      ? 'completed'
      : state.error
        ? 'error'
        : 'idle'

  // 結合実行ハンドラ
  const handleMerge = async () => {
    await actions.merge(options)
  }

  // ダウンロードハンドラ
  const handleDownload = () => {
    actions.download()
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Page Title */}
          <div>
            <h2 className="text-lg font-bold text-foreground">
              PDFファイルの結合 - ワークスペース
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              複数のPDFファイルを1つに結合できます（最大30ファイル、各50MBまで）
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
            <MergeProgress progress={state.progress} />
          </Suspense>

          {/* Upload Area */}
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
              onFilesSelected={actions.addFiles}
              disabled={state.isProcessing}
            />
          </Suspense>

          {/* File List */}
          <Suspense fallback={<div className="rounded-lg border border-border bg-card p-4 animate-pulse"><div className="h-24 bg-muted/50 rounded" /></div>}>
            <FileList
              files={state.files}
              onRemove={actions.removeFile}
              onReorder={actions.reorderFiles}
              disabled={state.isProcessing}
            />
          </Suspense>

          {/* Completion Message */}
          {state.mergeResult && (
            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                結合が完了しました！
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {state.mergeResult.filename} ({(state.mergeResult.size / 1024 / 1024).toFixed(2)} MB, {state.mergeResult.pages} ページ)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Output Options */}
      <div className="hidden w-80 border-l border-border xl:block">
        <Suspense fallback={<div className="w-80 h-full bg-muted/30 animate-pulse" />}>
          <OutputOptions
            options={options}
            onOptionsChange={setOptions}
            onMerge={handleMerge}
            onDownload={state.mergeResult ? handleDownload : undefined}
            disabled={state.isProcessing}
            mergeStatus={mergeStatus}
            fileCount={state.files.length}
          />
        </Suspense>
      </div>
    </div>
  )
}
