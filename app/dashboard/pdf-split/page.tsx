'use client'

import { useState, Suspense } from 'react'
import { usePdfSplit } from '@/hooks/use-pdf-split'
import { DEFAULT_PDF_SPLIT_OPTIONS, type PdfSplitOptions } from '@/types'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import X from 'lucide-react/dist/esm/icons/x'
import FileText from 'lucide-react/dist/esm/icons/file-text'
import Download from 'lucide-react/dist/esm/icons/download'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import { SplitOptions } from '@/components/pdf-split/split-options'

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

const MergeProgress = dynamic(
  () => import('@/components/pdf-merge/merge-progress').then(mod => ({ default: mod.MergeProgress })),
  {
    loading: () => <div className="h-12 bg-muted/50 rounded animate-pulse" />,
    ssr: false
  }
)

/**
 * PDF分割ページ
 */
export default function PDFSplitPage() {
  const [state, actions] = usePdfSplit()
  const [options, setOptions] = useState<PdfSplitOptions>(DEFAULT_PDF_SPLIT_OPTIONS)

  // 分割ステータスの判定
  const splitStatus: 'idle' | 'processing' | 'completed' | 'error' = state.isProcessing
    ? 'processing'
    : state.splitResult
      ? 'completed'
      : state.error
        ? 'error'
        : 'idle'

  // 分割実行ハンドラ
  const handleSplit = async () => {
    await actions.split(options)
  }

  // ファイル選択ハンドラ（単一ファイルのみ）
  const handleFileSelected = (files: File[]) => {
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
            <h2 className="text-lg font-bold text-foreground">
              PDFファイルの分割
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PDFファイルを指定したページで分割できます
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
          {!state.file && (
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
                onFilesSelected={handleFileSelected}
                disabled={state.isProcessing}
              />
            </Suspense>
          )}

          {/* File Display */}
          {state.file && (
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {state.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {state.file.size} • {state.totalPages} ページ
                    </p>
                  </div>
                </div>
                {!state.isProcessing && !state.splitResult && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={actions.removeFile}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Split Results */}
          {state.splitResult && (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  分割が完了しました！
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {state.splitResult.totalSplits} 個のPDFを生成しました
                </p>
              </div>

              {/* Individual Downloads */}
              <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                  <h3 className="text-sm font-medium text-foreground">
                    分割ファイル一覧
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {state.splitResult.splits.map((split, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {split.filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {split.pageRange} • {split.pages} ページ • {(split.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => actions.downloadSplit(index)}
                        className="h-8"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        ダウンロード
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clear Button */}
              <Button
                variant="outline"
                onClick={actions.clearResult}
                className="w-full"
              >
                新しいファイルを分割する
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Split Options */}
      <div className="hidden w-80 border-l border-border xl:block">
        <Suspense fallback={<div className="w-80 h-full bg-muted/30 animate-pulse" />}>
          <SplitOptions
            options={options}
            onOptionsChange={setOptions}
            onSplit={handleSplit}
            onDownloadAll={actions.downloadAll}
            disabled={state.isProcessing || !state.file}
            isProcessing={state.isProcessing}
            splitResult={state.splitResult}
            totalPages={state.totalPages}
            splitStatus={splitStatus}
          />
        </Suspense>
      </div>
    </div>
  )
}
