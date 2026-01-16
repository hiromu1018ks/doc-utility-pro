/**
 * ページ番号オプションパネル
 * 配置位置、フォントサイズ、余白、開始ページ等の設定UI
 */

'use client'

import { useCallback } from 'react'
import type {
  PdfNumberingOptions,
  NumberPosition,
  OddEvenPosition,
} from '@/types'
import { DEFAULT_PDF_NUMBERING_OPTIONS } from '@/types'
import FileText from 'lucide-react/dist/esm/icons/file-text'
import Download from 'lucide-react/dist/esm/icons/download'
import Loader2 from 'lucide-react/dist/esm/icons/loader-2'

interface NumberingOptionsProps {
  options: PdfNumberingOptions
  onOptionsChange: (options: PdfNumberingOptions) => void
  onExecute: () => void
  onDownload?: () => void
  disabled?: boolean
  isProcessing: boolean
  hasResult: boolean
  totalPages: number
}

/** 9つの配置位置 */
const POSITIONS: NumberPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'middle-center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]

/** 位置の日本語表示名 */
const POSITION_LABELS: Record<NumberPosition, string> = {
  'top-left': '左上',
  'top-center': '中上',
  'top-right': '右上',
  'middle-left': '左中',
  'middle-center': '中央',
  'middle-right': '右中',
  'bottom-left': '左下',
  'bottom-center': '中下',
  'bottom-right': '右下',
}

/**
 * 位置選択グリッドコンポーネント
 */
interface PositionGridProps {
  value: NumberPosition
  onChange: (position: NumberPosition) => void
  disabled?: boolean
  label: string
}

function PositionGrid({ value, onChange, disabled, label }: PositionGridProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => onChange(pos)}
            disabled={disabled}
            className={`
              aspect-square rounded-md border-2 transition-all
              ${
                value === pos
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              flex items-center justify-center text-xs
            `}
            aria-label={`${POSITION_LABELS[pos]}に配置`}
            aria-pressed={value === pos}
          >
            {POSITION_LABELS[pos]}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * 位置を取得するヘルパー関数
 */
function getOddPosition(position: NumberPosition | OddEvenPosition): NumberPosition {
  return typeof position === 'object' ? position.odd : position
}

function getEvenPosition(position: NumberPosition | OddEvenPosition): NumberPosition {
  return typeof position === 'object' ? position.even : position
}

/**
 * メインのオプションパネルコンポーネント
 */
export function NumberingOptions({
  options,
  onOptionsChange,
  onExecute,
  onDownload,
  disabled,
  isProcessing,
  hasResult,
  totalPages,
}: NumberingOptionsProps) {
  // 奇数・偶数ページで別の位置を使用するか
  const useOddEven = typeof options.position === 'object'

  // 現在の奇数・偶数位置を取得
  const oddPosition = getOddPosition(options.position)
  const evenPosition = getEvenPosition(options.position)

  /**
   * オプションを更新（部分更新用）
   */
  const updateOption = useCallback(
    <K extends keyof PdfNumberingOptions>(key: K, value: PdfNumberingOptions[K]) => {
      onOptionsChange({ ...options, [key]: value })
    },
    [options, onOptionsChange]
  )

  /**
   * 位置を更新（単一位置モード用）
   */
  const updateSinglePosition = useCallback((position: NumberPosition) => {
    onOptionsChange({ ...options, position })
  }, [options, onOptionsChange])

  /**
   * 奇数ページの位置を更新
   */
  const updateOddPosition = useCallback((position: NumberPosition) => {
    const currentPos = options.position as OddEvenPosition
    onOptionsChange({
      ...options,
      position: { ...currentPos, odd: position },
    })
  }, [options, onOptionsChange])

  /**
   * 偶数ページの位置を更新
   */
  const updateEvenPosition = useCallback((position: NumberPosition) => {
    const currentPos = options.position as OddEvenPosition
    onOptionsChange({
      ...options,
      position: { ...currentPos, even: position },
    })
  }, [options, onOptionsChange])

  /**
   * 奇数・偶数別設定をトグル
   */
  const toggleOddEven = useCallback(() => {
    if (useOddEven) {
      // 単一位置に戻す（奇数ページの位置を使用）
      onOptionsChange({ ...options, position: oddPosition })
    } else {
      // 奇数・偶数別にする
      const currentPos = options.position as NumberPosition
      onOptionsChange({
        ...options,
        position: { odd: currentPos, even: 'bottom-left' },
      })
    }
  }, [useOddEven, options, oddPosition, onOptionsChange])

  // ボタンの共通クラス
  const buttonClass =
    'flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      <div className="flex-1 overflow-auto p-6">
        <h3 className="mb-6 text-lg font-bold text-foreground">ページ番号設定</h3>

        <div className="space-y-6">
          {/* 配置位置セクション */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">配置位置</h4>
              <button
                type="button"
                onClick={toggleOddEven}
                disabled={disabled}
                className={`
                  text-xs px-3 py-1 rounded-full transition-colors
                  ${
                    useOddEven
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }
                  ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
              >
                {useOddEven ? '奇数/偶数別' : '共通'}
              </button>
            </div>

            {useOddEven ? (
              <>
                <PositionGrid
                  label="奇数ページ"
                  value={oddPosition}
                  onChange={updateOddPosition}
                  disabled={disabled}
                />
                <PositionGrid
                  label="偶数ページ"
                  value={evenPosition}
                  onChange={updateEvenPosition}
                  disabled={disabled}
                />
              </>
            ) : (
              <PositionGrid
                label="位置"
                value={oddPosition}
                onChange={updateSinglePosition}
                disabled={disabled}
              />
            )}
          </section>

          {/* 開始ページ・開始番号 */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">番号設定</h4>

            <div className="space-y-2">
              <label htmlFor="start-from-page" className="text-sm text-muted-foreground">
                開始ページ（{totalPages}ページ中）
              </label>
              <input
                id="start-from-page"
                type="number"
                min={1}
                max={totalPages || 1}
                value={options.startFromPage}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(totalPages || 1, parseInt(e.target.value) || 1))
                  updateOption('startFromPage', val)
                }}
                disabled={disabled}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="start-number" className="text-sm text-muted-foreground">
                開始番号
              </label>
              <input
                id="start-number"
                type="number"
                min={1}
                max={9999}
                value={options.startNumber}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(9999, parseInt(e.target.value) || 1))
                  updateOption('startNumber', val)
                }}
                disabled={disabled}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </section>

          {/* フォント設定 */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">フォント設定</h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="font-size" className="text-sm text-muted-foreground">
                  フォントサイズ: {options.fontSize}pt
                </label>
              </div>
              <input
                id="font-size"
                type="range"
                min={6}
                max={72}
                value={options.fontSize}
                onChange={(e) => updateOption('fontSize', parseInt(e.target.value))}
                disabled={disabled}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>6pt</span>
                <span>72pt</span>
              </div>
            </div>
          </section>

          {/* 余白設定 */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">余白設定</h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="margin-x" className="text-sm text-muted-foreground">
                  水平余白: {options.marginX}
                </label>
              </div>
              <input
                id="margin-x"
                type="range"
                min={0}
                max={200}
                value={options.marginX}
                onChange={(e) => updateOption('marginX', parseInt(e.target.value))}
                disabled={disabled}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="margin-y" className="text-sm text-muted-foreground">
                  垂直余白: {options.marginY}
                </label>
              </div>
              <input
                id="margin-y"
                type="range"
                min={0}
                max={200}
                value={options.marginY}
                onChange={(e) => updateOption('marginY', parseInt(e.target.value))}
                disabled={disabled}
                className="w-full accent-primary"
              />
            </div>
          </section>

          {/* 色設定 */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">文字色</h4>
            <div className="flex items-center gap-3">
              <input
                id="font-color"
                type="color"
                value={options.fontColor}
                onChange={(e) => updateOption('fontColor', e.target.value)}
                disabled={disabled}
                className="h-10 w-14 rounded cursor-pointer border-0 bg-transparent"
              />
              <label htmlFor="font-color" className="text-sm text-muted-foreground">
                {options.fontColor}
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="border-t border-border bg-muted/30 p-6">
        {hasResult ? (
          // 完了後：ダウンロードボタン
          <button
            type="button"
            onClick={onDownload}
            disabled={isProcessing}
            className={buttonClass}
          >
            <Download className="h-5 w-5" />
            ダウンロード
          </button>
        ) : (
          // 実行前：ページ番号追加ボタン
          <button
            type="button"
            onClick={onExecute}
            disabled={disabled || isProcessing}
            className={buttonClass}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                処理中...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                ページ番号を追加
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
