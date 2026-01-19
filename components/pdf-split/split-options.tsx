/**
 * 分割オプションパネルコンポーネント
 * 3つの分割方法を選択できるサイドバーUI
 */

'use client'

import { useMemo } from 'react'
import { PageRangeInput } from './page-range-input'
import { RangePreview } from './range-preview'
import { parsePageRanges } from '@/lib/pdf-splitter'
import type { PdfSplitOptions, SplitMethod, SplitBatchResult } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import Scissors from 'lucide-react/dist/esm/icons/scissors'
import GitBranch from 'lucide-react/dist/esm/icons/git-branch'
import Hash from 'lucide-react/dist/esm/icons/hash'
import Loader2 from 'lucide-react/dist/esm/icons/loader-2'
import Download from 'lucide-react/dist/esm/icons/download'
import FileText from 'lucide-react/dist/esm/icons/file-text'

interface SplitOptionsProps {
  options: PdfSplitOptions
  onOptionsChange: (options: PdfSplitOptions) => void
  onSplit: () => void
  onDownloadAll?: () => void
  disabled?: boolean
  isProcessing?: boolean
  splitResult?: SplitBatchResult | null
  totalPages: number
  splitStatus?: 'idle' | 'processing' | 'completed' | 'error'
}

const METHODS: Array<{
  id: SplitMethod
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    id: 'ranges',
    label: '範囲を指定',
    description: 'ページ範囲を指定して分割',
    icon: Scissors,
  },
  {
    id: 'equalParts',
    label: 'N等分に分割',
    description: '指定した数に均等分割',
    icon: GitBranch,
  },
  {
    id: 'equalPages',
    label: 'ページ数で分割',
    description: '指定ページごとに分割',
    icon: Hash,
  },
]

export function SplitOptions({
  options,
  onOptionsChange,
  onSplit,
  onDownloadAll,
  disabled = false,
  isProcessing = false,
  splitResult,
  totalPages,
  splitStatus = 'idle',
}: SplitOptionsProps) {
  // optionsから値を取得（propsを直接使用して同期問題を回避）
  // 以前の実装ではuseStateとuseEffectでoptionsの値をローカル状態にコピーしていたが、
  // Props Drillingパターンとして親コンポーネントが状態を管理するため、
  // 直接propsを使用することで不整合を回避する
  const partsCount = options.partsCount ?? Math.min(2, totalPages)
  const pagesPerSplit = options.pagesPerSplit ?? 1

  // 範囲指定が有効かチェック
  const isRangeValid = useMemo(() => {
    if (options.method !== 'ranges' || !options.ranges) return false
    const result = parsePageRanges(options.ranges, totalPages)
    return result.isValid && result.ranges.length > 0
  }, [options.method, options.ranges, totalPages])

  // N等分が有効かチェック
  const isPartsCountValid = useMemo(() => {
    if (options.method !== 'equalParts') return false
    return partsCount >= 2 && partsCount <= totalPages
  }, [options.method, partsCount, totalPages])

  // ページ数指定が有効かチェック
  const isPagesPerSplitValid = useMemo(() => {
    if (options.method !== 'equalPages') return false
    return pagesPerSplit >= 1 && pagesPerSplit <= totalPages
  }, [options.method, pagesPerSplit, totalPages])

  // 分割ボタンが有効か
  const canSplit = useMemo(() => {
    if (disabled || isProcessing) return false
    switch (options.method) {
      case 'ranges':
        return isRangeValid
      case 'equalParts':
        return isPartsCountValid
      case 'equalPages':
        return isPagesPerSplitValid
    }
  }, [disabled, isProcessing, options.method, isRangeValid, isPartsCountValid, isPagesPerSplitValid])

  // 分割方法を変更
  const handleMethodChange = (method: SplitMethod) => {
    onOptionsChange({ ...options, method })
  }

  // 範囲入力を変更
  const handleRangesChange = (ranges: string) => {
    onOptionsChange({ ...options, ranges })
  }

  // 分割数を変更（上限チェック付き）
  const handlePartsCountChange = (value: number) => {
    const clampedValue = Math.min(totalPages, Math.max(2, value))
    onOptionsChange({ ...options, partsCount: clampedValue })
  }

  // ページ数を変更（上限チェック付き）
  const handlePagesPerSplitChange = (value: number) => {
    const clampedValue = Math.min(totalPages, Math.max(1, value))
    onOptionsChange({ ...options, pagesPerSplit: clampedValue })
  }

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="border-b border-border p-4">
        <h3 className="font-semibold text-foreground">分割オプション</h3>
        <p className="text-xs text-muted-foreground mt-1">
          分割方法を選択してください
        </p>
      </div>

      {/* オプション内容 */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* 分割方法選択 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">分割方法</Label>
          <div className="space-y-2">
            {METHODS.map(method => {
              const Icon = method.icon
              const isSelected = options.method === method.id
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => handleMethodChange(method.id)}
                  disabled={disabled}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    'hover:bg-accent/50',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {method.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {method.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 方法ごとのオプション */}
        {options.method === 'ranges' && (
          <div className="space-y-4">
            <PageRangeInput
              value={options.ranges}
              onChange={handleRangesChange}
              totalPages={totalPages}
              disabled={disabled}
            />
            {options.ranges && isRangeValid && (
              <RangePreview
                rangesInput={options.ranges}
                totalPages={totalPages}
                disabled={disabled}
              />
            )}
          </div>
        )}

        {options.method === 'equalParts' && (
          <div className="space-y-3">
            <Label htmlFor="partsCount" className="text-sm font-medium">
              分割数
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="partsCount"
                type="number"
                min={2}
                max={totalPages}
                value={partsCount}
                onChange={e => handlePartsCountChange(Math.max(2, parseInt(e.target.value) || 2))}
                disabled={disabled}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                / {totalPages}
              </span>
            </div>
            {partsCount > 0 && (
              <p className="text-xs text-muted-foreground">
                約 {Math.ceil(totalPages / partsCount)} ページずつに分割されます
              </p>
            )}
          </div>
        )}

        {options.method === 'equalPages' && (
          <div className="space-y-3">
            <Label htmlFor="pagesPerSplit" className="text-sm font-medium">
              ページ数
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="pagesPerSplit"
                type="number"
                min={1}
                max={totalPages}
                value={pagesPerSplit}
                onChange={e => handlePagesPerSplitChange(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={disabled}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                ページごと
              </span>
            </div>
            {pagesPerSplit > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.ceil(totalPages / pagesPerSplit)} 個のPDFに分割されます
              </p>
            )}
          </div>
        )}

        {/* 分割結果のサマリー */}
        {splitResult && (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <FileText className="h-4 w-4" />
              分割完了
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {splitResult.totalSplits} 個のPDFを生成しました
            </p>
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="border-t border-border p-4 space-y-2">
        {splitStatus === 'completed' && onDownloadAll ? (
          <Button
            onClick={onDownloadAll}
            className="w-full"
            size="default"
          >
            <Download className="h-4 w-4 mr-2" />
            ZIPでダウンロード
          </Button>
        ) : (
          <Button
            onClick={onSplit}
            disabled={!canSplit}
            className="w-full"
            size="default"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                処理中...
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4 mr-2" />
                分割する
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
