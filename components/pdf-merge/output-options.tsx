'use client'

import { memo } from 'react'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PdfMergeOptions, MergeStatus } from '@/types'
import { DEFAULT_PDF_MERGE_OPTIONS } from '@/types'
import Loader2 from 'lucide-react/dist/esm/icons/loader-2'
import Download from 'lucide-react/dist/esm/icons/download'

interface OutputOptionsProps {
  options: PdfMergeOptions
  onOptionsChange: (options: PdfMergeOptions) => void
  onMerge: () => void
  onDownload?: () => void
  disabled?: boolean
  mergeStatus?: MergeStatus
  fileCount?: number
  className?: string
}

/**
 * 出力オプションコンポーネント
 * 親コンポーネントから状態を受信
 */
export const OutputOptions = memo(function OutputOptions({
  options,
  onOptionsChange,
  onMerge,
  onDownload,
  disabled = false,
  mergeStatus = 'idle',
  fileCount = 0,
  className,
}: OutputOptionsProps) {
  const updateOption = <K extends keyof PdfMergeOptions>(
    key: K,
    value: PdfMergeOptions[K]
  ) => {
    onOptionsChange({ ...options, [key]: value })
  }

  const isProcessing = mergeStatus === 'processing'
  const isCompleted = mergeStatus === 'completed'

  const canMerge = !disabled && !isProcessing && fileCount >= 2

  return (
    <div className={cn('flex h-full flex-col bg-muted/30', className)}>
      <div className="p-4">
        <h2 className="text-sm font-semibold text-foreground">出力オプション</h2>
      </div>

      <Separator />

      <div className="flex-1 space-y-6 p-4 overflow-auto">
        {/* 結合順序 */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase">
            結合順序
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="order"
                checked={options.order === 'original'}
                onChange={() => updateOption('order', 'original')}
                disabled={disabled || isProcessing}
                className="h-4 w-4 border-input text-primary focus:ring-primary"
              />
              <span className="text-foreground">元の順序</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="order"
                checked={options.order === 'filename'}
                onChange={() => updateOption('order', 'filename')}
                disabled={disabled || isProcessing}
                className="h-4 w-4 border-input text-primary focus:ring-primary"
              />
              <span className="text-foreground">ファイル名順</span>
            </label>
          </div>
        </div>

        <Separator />

        {/* ファイル名オプション */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="keep-filename" className="text-sm text-foreground">
              ファイル名を維持する
            </Label>
            <p className="text-xs text-muted-foreground">
              元のファイル名を保持します
            </p>
          </div>
          <Switch
            id="keep-filename"
            checked={options.keepFilename}
            onClick={() => updateOption('keepFilename', !options.keepFilename)}
            disabled={disabled || isProcessing}
          />
        </div>

        {/* しおりオプション */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="bookmarks" className="text-sm text-foreground">
              しおり (目次) を作成
            </Label>
            <p className="text-xs text-muted-foreground">
              ファイル名を目次として追加します
            </p>
          </div>
          <Switch
            id="bookmarks"
            checked={options.createBookmarks}
            onClick={() =>
              updateOption('createBookmarks', !options.createBookmarks)
            }
            disabled={disabled || isProcessing}
          />
        </div>

        <Separator />

        {/* 画像品質 */}
        <div className="space-y-2">
          <Label htmlFor="quality" className="text-sm text-foreground">
            画像品質
          </Label>
          <select
            id="quality"
            value={options.imageQuality}
            onChange={(e) =>
              updateOption('imageQuality', e.target.value as PdfMergeOptions['imageQuality'])
            }
            disabled={disabled || isProcessing}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>

        <Separator />

        {/* ファイルサイズ最適化 */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="optimize" className="text-sm text-foreground">
              ファイルサイズを最適化
            </Label>
            <p className="text-xs text-muted-foreground">
              出力ファイルを圧縮します
            </p>
          </div>
          <Switch
            id="optimize"
            checked={options.optimize}
            onClick={() => updateOption('optimize', !options.optimize)}
            disabled={disabled || isProcessing}
          />
        </div>
      </div>

      <Separator />

      {/* Action Button */}
      <div className="p-4 space-y-2">
        {isCompleted && onDownload ? (
          <Button
            className="w-full"
            size="lg"
            onClick={onDownload}
            variant="default"
          >
            <Download className="h-4 w-4 mr-2" />
            ダウンロード
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={onMerge}
            disabled={!canMerge}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                処理中...
              </>
            ) : (
              <>処理を実行してダウンロード</>
            )}
          </Button>
        )}
        {fileCount > 0 && fileCount < 2 && (
          <p className="text-xs text-muted-foreground text-center">
            結合には2つ以上のファイルが必要です
          </p>
        )}
      </div>
    </div>
  )
})
