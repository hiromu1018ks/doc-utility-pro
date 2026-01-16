'use client'

import { useState } from 'react'
import { usePdfMerge } from '@/hooks/use-pdf-merge'
import { UploadArea } from '@/components/pdf-merge/upload-area'
import { FileList } from '@/components/pdf-merge/file-list'
import { OutputOptions } from '@/components/pdf-merge/output-options'
import { MergeProgress } from '@/components/pdf-merge/merge-progress'
import { DEFAULT_PDF_MERGE_OPTIONS, type PdfMergeOptions } from '@/types'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import X from 'lucide-react/dist/esm/icons/x'
import { Button } from '@/components/ui/button'

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
          <MergeProgress progress={state.progress} />

          {/* Upload Area */}
          <UploadArea
            onFilesSelected={actions.addFiles}
            disabled={state.isProcessing}
          />

          {/* File List */}
          <FileList
            files={state.files}
            onRemove={actions.removeFile}
            onReorder={actions.reorderFiles}
            disabled={state.isProcessing}
          />

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
        <OutputOptions
          options={options}
          onOptionsChange={setOptions}
          onMerge={handleMerge}
          onDownload={state.mergeResult ? handleDownload : undefined}
          disabled={state.isProcessing}
          mergeStatus={mergeStatus}
          fileCount={state.files.length}
        />
      </div>
    </div>
  )
}
