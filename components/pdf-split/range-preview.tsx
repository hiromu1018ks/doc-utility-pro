/**
 * 範囲プレビューコンポーネント
 * パースされたページ範囲を視覚的に表示
 */

'use client'

import { useMemo } from 'react'
import { parsePageRanges } from '@/lib/pdf-splitter'
import { cn } from '@/lib/utils'
import FileText from 'lucide-react/dist/esm/icons/file-text'

interface RangePreviewProps {
  rangesInput: string
  totalPages: number
  disabled?: boolean
}

export function RangePreview({
  rangesInput,
  totalPages,
  disabled = false,
}: RangePreviewProps) {
  // バリデーション結果から範囲情報を取得
  // React Hooksのルールにより、条件分岐やearly returnの前に
  // すべてのフック呼び出しを配置する必要がある
  const validationResult = useMemo(() => {
    if (!rangesInput || rangesInput.trim() === '') {
      return { isValid: false, ranges: [], errors: [], totalPages: 0 }
    }
    return parsePageRanges(rangesInput, totalPages)
  }, [rangesInput, totalPages])

  const { isValid, ranges } = validationResult

  // 選択ページを計算
  // React Hooksのルールにより、条件分岐前にフックを配置する必要がある
  const selectedPages = useMemo(() => {
    const pages: number[] = []
    for (const range of ranges) {
      for (let i = range.start; i <= range.end; i++) {
        pages.push(i)
      }
    }
    return pages
  }, [ranges])

  // 無効な場合は何も表示しない（すべてのフック呼び出しの後）
  if (!isValid || ranges.length === 0) {
    return null
  }

  // ページグリッドを作成（100ページ以下の場合のみ）
  const shouldShowGrid = totalPages <= 100

  return (
    <div className={cn('space-y-3', disabled && 'opacity-50')}>
      {/* 範囲バッジ */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">
          分割される範囲 ({ranges.length}個)
        </p>
        <div className="flex flex-wrap gap-2">
          {ranges.map((range, index) => {
            const label = range.start === range.end
              ? `${range.start}`
              : `${range.start}-${range.end}`
            const pageCount = range.end - range.start + 1

            return (
              <div
                key={index}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5"
              >
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {label}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({pageCount}ページ)
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* サマリー */}
      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-sm text-foreground">
          合計 <span className="font-bold">{selectedPages.length}</span> ページを
          <span className="font-bold"> {ranges.length}</span> 個のPDFに分割します
        </p>
      </div>

      {/* ページグリッドプレビュー（100ページ以下のみ） */}
      {shouldShowGrid && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            ページ選択プレビュー
          </p>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
              const isSelected = selectedPages.includes(pageNum)
              return (
                <div
                  key={pageNum}
                  className={cn(
                    'aspect-square flex items-center justify-center rounded text-xs',
                    'transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-muted text-muted-foreground'
                  )}
                  title={`ページ ${pageNum}`}
                >
                  {pageNum}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 詳細情報 */}
      <div className="space-y-1">
        {ranges.map((range, index) => {
          const label = range.start === range.end
            ? `ページ${range.start}`
            : `ページ${range.start}-${range.end}`
          return (
            <p key={index} className="text-xs text-muted-foreground">
              • {label} → <span className="text-foreground">part{index + 1}.pdf</span>
            </p>
          )
        })}
      </div>
    </div>
  )
}
