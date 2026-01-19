'use client'

import { useState, useMemo } from 'react'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import X from 'lucide-react/dist/esm/icons/x'
import { Button } from '@/components/ui/button'
import { usePdfPages } from '@/hooks/use-pdf-pages'
import { PageGrid } from '@/components/pdf-pages/page-grid'
import { PageViewer } from '@/components/pdf-pages/page-viewer'
import { Toolbar } from '@/components/pdf-pages/toolbar'
import { ExportPanel } from '@/components/pdf-pages/export-panel'
import { DEFAULT_PDF_PAGE_MANAGE_OPTIONS } from '@/types'
import dynamic from 'next/dynamic'

// 動的インポート（コード分割）
const MergeProgress = dynamic(
  () => import('@/components/pdf-merge/merge-progress').then(m => ({ default: m.MergeProgress })),
  { ssr: false }
)

/**
 * PDFページ管理ページ
 * ページの削除、回転、並べ替えを行う
 */
export default function PdfPagesPage() {
  const [state, actions] = usePdfPages()
  const [keepFilename, setKeepFilename] = useState(DEFAULT_PDF_PAGE_MANAGE_OPTIONS.keepFilename)

  // ファイル名を抽出
  const fileName = useMemo(() => state.file?.name || null, [state.file])
  const pageCount = state.pages.length

  // エクスポートオプション
  const exportOptions = useMemo(
    () => ({ ...DEFAULT_PDF_PAGE_MANAGE_OPTIONS, keepFilename }),
    [keepFilename]
  )

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* メインコンテンツ */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* ページタイトル */}
          <div>
            <h2 className="text-lg font-bold text-foreground">PDFページ管理</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PDFのページを並べ替え、回転、削除できます
            </p>
          </div>

          {/* エラー表示 */}
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

          {/* PDFアップローダー/ファイル情報 */}
          <PageViewer
            onLoad={actions.loadPdf}
            onClear={actions.clearFile}
            isProcessing={state.isProcessing}
            progress={state.progress}
            fileName={fileName}
            pageCount={pageCount}
            disabled={state.isProcessing}
          />

          {/* ページグリッド（PDF読み込み後） */}
          {state.pages.length > 0 && (
            <>
              {/* ツールバー */}
              <Toolbar
                selectedCount={state.selectedIds.size}
                totalCount={state.pages.length}
                canUndo={state.canUndo}
                canRedo={state.canRedo}
                disabled={state.isProcessing}
                onRotateSelected={(clockwise) => actions.rotateSelected(clockwise)}
                onDeleteSelected={actions.deleteSelected}
                onUndo={actions.undo}
                onRedo={actions.redo}
                onSelectAll={actions.selectAll}
                onClearSelection={actions.clearSelection}
              />

              {/* ページグリッド */}
              <PageGrid
                pages={state.pages}
                selectedIds={state.selectedIds}
                disabled={state.isProcessing}
                onReorder={actions.reorderPages}
                onDelete={actions.deletePage}
                onRotate={actions.rotatePage}
                onToggleSelect={actions.toggleSelectPage}
              />

              {/* 完了メッセージ */}
              {state.result && (
                <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    PDFのエクスポートが完了しました！
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {state.result.filename} (
                    {(state.result.size / 1024 / 1024).toFixed(2)} MB,{' '}
                    {state.result.pages}ページ)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 右パネル - エクスポートオプション */}
      <ExportPanel
        pageCount={state.pages.length}
        selectedCount={state.selectedIds.size}
        isProcessing={state.isProcessing}
        exportOptions={exportOptions}
        result={state.result}
        onExport={actions.exportPdf}
        onDownload={actions.download}
        onClearResult={actions.clearResult}
        onToggleKeepFilename={() => setKeepFilename(!keepFilename)}
      />
    </div>
  )
}
