'use client'

import { memo, type ReactNode } from 'react'
import Download from 'lucide-react/dist/esm/icons/download'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { PdfPageManageOptions } from '@/types'

interface ExportPanelProps {
  pageCount: number
  selectedCount: number
  isProcessing: boolean
  exportOptions: PdfPageManageOptions
  result: { filename: string; size: number; pages: number } | null
  onExport: (options: PdfPageManageOptions) => void
  onDownload: () => void
  onClearResult: () => void
  onToggleKeepFilename: () => void
}

/**
 * Export options panel for PDF page management
 *
 * Memoized to prevent re-renders when only page content changes.
 * This panel is isolated in the right sidebar and should only update
 * when its own props change (page count, selection, export state).
 */
export const ExportPanel = memo(function ExportPanel({
  pageCount,
  selectedCount,
  isProcessing,
  exportOptions,
  result,
  onExport,
  onDownload,
  onClearResult,
  onToggleKeepFilename,
}: ExportPanelProps) {
  return (
    <div className="hidden w-80 border-l border-border xl:block">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">エクスポート</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            PDFをエクスポートしてダウンロード
          </p>
        </div>

        <Separator />

        {/* ページ情報 */}
        <PageInfoSection pageCount={pageCount} selectedCount={selectedCount} />

        <Separator />

        {/* オプション */}
        <OptionsSection
          keepFilename={exportOptions.keepFilename}
          isProcessing={isProcessing}
          onToggleKeepFilename={onToggleKeepFilename}
        />

        <Separator />

        {/* アクション */}
        <ActionsSection
          result={result}
          isProcessing={isProcessing}
          pageCount={pageCount}
          exportOptions={exportOptions}
          onExport={onExport}
          onDownload={onDownload}
          onClearResult={onClearResult}
        />
      </div>
    </div>
  )
})

/**
 * Page information display section
 */
const PageInfoSection = memo(function PageInfoSection({
  pageCount,
  selectedCount,
}: {
  pageCount: number
  selectedCount: number
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">総ページ数</span>
        <span className="font-medium text-foreground">{pageCount}ページ</span>
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">選択中</span>
          <span className="font-medium text-primary">{selectedCount}ページ</span>
        </div>
      )}
    </div>
  )
})

/**
 * Export options configuration section
 */
const OptionsSection = memo(function OptionsSection({
  keepFilename,
  isProcessing,
  onToggleKeepFilename,
}: {
  keepFilename: boolean
  isProcessing: boolean
  onToggleKeepFilename: () => void
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-foreground">オプション</h4>

      <div className="flex items-center justify-between">
        <Label
          htmlFor="keep-filename"
          className="text-sm cursor-pointer"
        >
          元のファイル名を維持
        </Label>
        <Switch
          id="keep-filename"
          checked={keepFilename}
          onClick={onToggleKeepFilename}
          disabled={isProcessing}
        />
      </div>
    </div>
  )
})

/**
 * Action buttons section
 */
const ActionsSection = memo(function ActionsSection({
  result,
  isProcessing,
  pageCount,
  exportOptions,
  onExport,
  onDownload,
  onClearResult,
}: {
  result: { filename: string; size: number; pages: number } | null
  isProcessing: boolean
  pageCount: number
  exportOptions: PdfPageManageOptions
  onExport: (options: PdfPageManageOptions) => void
  onDownload: () => void
  onClearResult: () => void
}) {
  return (
    <div className="space-y-2">
      {result ? (
        // ダウンロードボタン（エクスポート完了後）
        <Button
          onClick={onDownload}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          ダウンロード
        </Button>
      ) : (
        // エクスポートボタン
        <Button
          onClick={() => onExport(exportOptions)}
          disabled={isProcessing || pageCount === 0}
          className="w-full"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          PDFをエクスポート
        </Button>
      )}

      {result && (
        <Button
          variant="outline"
          onClick={onClearResult}
          disabled={isProcessing}
          className="w-full"
        >
          クリア
        </Button>
      )}
    </div>
  )
})
