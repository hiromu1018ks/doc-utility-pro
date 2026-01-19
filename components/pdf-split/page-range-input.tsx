/**
 * ページ範囲入力コンポーネント
 * "1-3, 5, 8-10" 形式の範囲指定とリアルタイムバリデーション
 */

'use client'

import { useState, useMemo, memo } from 'react'
import { parsePageRanges } from '@/lib/pdf-splitter'
import type { RangeValidationResult } from '@/types'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import Check from 'lucide-react/dist/esm/icons/check'
import { cn } from '@/lib/utils'

interface PageRangeInputProps {
  value: string
  onChange: (value: string) => void
  totalPages: number
  disabled?: boolean
}

export const PageRangeInput = memo(function PageRangeInput({
  value,
  onChange,
  totalPages,
  disabled = false,
}: PageRangeInputProps) {
  const [touched, setTouched] = useState(false)

  // バリデーション結果を計算
  const validationResult: RangeValidationResult = useMemo(() => {
    if (!value || value.trim() === '') {
      return { isValid: false, ranges: [], errors: [], totalPages: 0 }
    }
    return parsePageRanges(value, totalPages)
  }, [value, totalPages])

  const hasErrors = validationResult.errors.length > 0
  const isValid = validationResult.isValid && value.trim() !== ''

  // エラー表示用
  const showError = touched && hasErrors

  /**
   * クイック選択: 奇数ページ
   */
  const selectOddPages = () => {
    const odds: string[] = []
    for (let i = 1; i <= totalPages; i += 2) {
      odds.push(i.toString())
    }
    onChange(odds.join(','))
  }

  /**
   * クイック選択: 偶数ページ
   */
  const selectEvenPages = () => {
    const evens: string[] = []
    for (let i = 2; i <= totalPages; i += 2) {
      evens.push(i.toString())
    }
    onChange(evens.join(','))
  }

  /**
   * クイック選択: 全ページ
   */
  const selectAllPages = () => {
    onChange(`1-${totalPages}`)
  }

  // 範囲サマリーを計算
  const rangeSummary = useMemo(() => {
    if (!isValid || validationResult.ranges.length === 0) {
      return null
    }
    const count = validationResult.totalPages
    return `合計 ${count} ページを選択`
  }, [isValid, validationResult])

  return (
    <div className="space-y-3">
      {/* 入力フィールド */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          ページ範囲を入力
        </label>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setTouched(false)}
            onBlur={() => setTouched(true)}
            disabled={disabled}
            placeholder="例: 1-3, 5, 8-10"
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm',
              'transition-colors',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              disabled && 'cursor-not-allowed opacity-50',
              showError
                ? 'border-destructive focus:ring-destructive'
                : isValid
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-input'
            )}
          />
          {/* ステータスアイコン */}
          {value && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {showError ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : isValid ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : null}
            </div>
          )}
        </div>

        {/* ヘルパーテキスト */}
        <p className="text-xs text-muted-foreground">
          ページ番号または範囲をカンマ区切りで入力（例: 1-3, 5, 8-10）
        </p>
      </div>

      {/* クイック選択ボタン */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={selectAllPages}
          disabled={disabled}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          全ページ
        </button>
        <button
          type="button"
          onClick={selectOddPages}
          disabled={disabled}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          奇数ページ
        </button>
        <button
          type="button"
          onClick={selectEvenPages}
          disabled={disabled}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          偶数ページ
        </button>
      </div>

      {/* エラー表示 */}
      {showError && (
        <div className="rounded-md bg-destructive/10 p-3">
          <ul className="space-y-1">
            {validationResult.errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 範囲サマリー */}
      {isValid && rangeSummary && !showError && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Check className="h-4 w-4" />
          <span>{rangeSummary}</span>
        </div>
      )}
    </div>
  )
})
