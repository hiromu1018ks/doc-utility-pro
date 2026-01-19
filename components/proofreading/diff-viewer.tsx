"use client"

import { memo, useMemo } from "react"
import { TextChange } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface DiffViewerProps {
  originalText: string
  correctedText: string
  changes: TextChange[]
  className?: string
}

/**
 * テキストのDiffをサイドバイサイフで表示するコンポーネント
 */
export const DiffViewer = memo(function DiffViewer({
  originalText,
  correctedText,
  changes = [],
  className,
}: DiffViewerProps) {
  /**
   * 変更箇所をハイライトしてテキストを表示
   * indexOfの重複テキスト問題に対処するため、最後の検索位置を追跡
   */
  const renderWithHighlights = (
    text: string,
    changes: TextChange[],
    isOriginal: boolean
  ) => {
    if (!text || changes.length === 0) {
      return text || null
    }

    const segments: React.ReactNode[] = []
    let lastIndex = 0
    let lastSearchIndex = 0 // 重複テキストに対処するための検索開始位置

    // 変更箇所を位置順にソート（重複対策済み）
    const sortedChanges = [...changes]
      .map((change) => {
        const targetText = isOriginal ? change.originalText : change.correctedText
        // 最後の検索位置から開始して重複問題に対処
        const position = text.indexOf(targetText, lastSearchIndex)
        if (position >= 0) {
          lastSearchIndex = position + targetText.length
        }
        return {
          ...change,
          position,
        }
      })
      .filter((change) => change.position >= 0)
      .sort((a, b) => a.position - b.position)

    sortedChanges.forEach((change) => {
      const targetText = isOriginal ? change.originalText : change.correctedText
      const endPosition = change.position + targetText.length

      // 変更箇所の前のテキストを追加（change.idを使用して一意なキーを生成）
      if (change.position > lastIndex) {
        segments.push(
          <span key={`text-${change.id}-before`}>
            {text.slice(lastIndex, change.position)}
          </span>
        )
      }

      // 変更箇所をハイライトして追加
      const highlightClass = isOriginal
        ? "bg-diff-remove-bg text-diff-remove-text line-through"
        : "bg-diff-add-bg text-diff-add-text"

      segments.push(
        <mark key={`change-${change.id}`} className={highlightClass}>
          {targetText}
        </mark>
      )

      lastIndex = endPosition
    })

    // 残りのテキストを追加
    if (lastIndex < text.length) {
      segments.push(<span key="remaining">{text.slice(lastIndex)}</span>)
    }

    return segments.length > 0 ? segments : text
  }

  // useMemoでレンダリング結果をキャッシュ（パフォーマンス最適化）
  const originalSegments = useMemo(
    () => renderWithHighlights(originalText, changes, true),
    [originalText, changes]
  )

  const correctedSegments = useMemo(
    () => renderWithHighlights(correctedText, changes, false),
    [correctedText, changes]
  )

  return (
    <div className={cn("space-y-4", className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">校正結果</h3>
          {changes.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {changes.length}件の変更
            </Badge>
          )}
        </div>
      </div>

      {/* Diffパネル */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 原文 */}
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              原文
            </span>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <div className="whitespace-pre-wrap break-words text-sm text-foreground">
              {originalText ? (
                originalSegments
              ) : (
                <span className="text-muted-foreground italic">テキストがありません</span>
              )}
            </div>
          </div>
        </div>

        {/* 校正後 */}
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              校正後
            </span>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <div className="whitespace-pre-wrap break-words text-sm text-foreground">
              {correctedText ? (
                correctedSegments
              ) : (
                <span className="text-muted-foreground italic">校正結果がここに表示されます</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 凡例 */}
      {changes.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-diff-remove-bg border border-diff-remove-text/30" />
            <span>削除</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-diff-add-bg border border-diff-add-text/30" />
            <span>追加</span>
          </div>
        </div>
      )}
    </div>
  )
})
