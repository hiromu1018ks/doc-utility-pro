'use client'

import { memo } from 'react'
import RotateCw from 'lucide-react/dist/esm/icons/rotate-cw'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'
import Undo2 from 'lucide-react/dist/esm/icons/undo-2'
import Redo2 from 'lucide-react/dist/esm/icons/redo-2'
import CheckSquare from 'lucide-react/dist/esm/icons/check-square'
import Square from 'lucide-react/dist/esm/icons/square'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  selectedCount: number
  totalCount: number
  canUndo?: boolean
  canRedo?: boolean
  disabled?: boolean
  onRotateSelected?: (clockwise: boolean) => void
  onDeleteSelected?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSelectAll?: () => void
  onClearSelection?: () => void
  className?: string
}

// ホストされたアイコン
const ROTATE_CW_ICON = <RotateCw className="h-4 w-4" />
const ROTATE_CCW_ICON = <RotateCw className="h-4 w-4 rotate-[-90deg]" />
const TRASH_ICON = <Trash2 className="h-4 w-4" />
const UNDO_ICON = <Undo2 className="h-4 w-4" />
const REDO_ICON = <Redo2 className="h-4 w-4" />
const CHECK_ICON = <CheckSquare className="h-4 w-4" />
const SQUARE_ICON = <Square className="h-4 w-4" />

/**
 * ツールバーコンポーネント
 * 選択、回転、削除、Undo/Redoの操作を提供
 */
export const Toolbar = memo(function Toolbar({
  selectedCount,
  totalCount,
  canUndo = false,
  canRedo = false,
  disabled = false,
  onRotateSelected,
  onDeleteSelected,
  onUndo,
  onRedo,
  onSelectAll,
  onClearSelection,
  className,
}: ToolbarProps) {
  const hasSelection = selectedCount > 0
  const hasPages = totalCount > 0

  return (
    <div className={className}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* 左側: 選択情報と操作 */}
        <div className="flex items-center gap-4">
          {/* 選択カウント */}
          <div className="text-sm">
            {hasSelection ? (
              <span className="font-medium text-foreground">
                {selectedCount}ページを選択中
              </span>
            ) : (
              <span className="text-muted-foreground">
                {totalCount}ページ
              </span>
            )}
          </div>

          {/* 一括操作ボタン（選択時のみ表示） */}
          {hasSelection && (
            <div className="flex items-center gap-2">
              {/* 回転ボタングループ */}
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRotateSelected?.(false)}
                  disabled={disabled}
                  className="h-8 px-2 rounded-none border-r"
                  aria-label="反時計回りに90度回転"
                >
                  {ROTATE_CCW_ICON}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRotateSelected?.(true)}
                  disabled={disabled}
                  className="h-8 px-2 rounded-none"
                  aria-label="時計回りに90度回転"
                >
                  {ROTATE_CW_ICON}
                </Button>
              </div>

              {/* 削除ボタン */}
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteSelected}
                disabled={disabled}
                className="h-8"
              >
                {TRASH_ICON}
                <span className="ml-1">削除</span>
              </Button>
            </div>
          )}
        </div>

        {/* 右側: Undo/Redoと全選択 */}
        <div className="flex items-center gap-2">
          {/* 全選択/解除 */}
          {hasPages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={hasSelection ? onClearSelection : onSelectAll}
              disabled={disabled}
              className="h-8"
            >
              {hasSelection ? CHECK_ICON : SQUARE_ICON}
              <span className="ml-1">
                {hasSelection ? '選択解除' : '全選択'}
              </span>
            </Button>
          )}

          {/* Undo/Redo */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={disabled || !canUndo}
              className="h-8 px-2 rounded-none border-r"
              aria-label="元に戻す"
            >
              {UNDO_ICON}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={disabled || !canRedo}
              className="h-8 px-2 rounded-none"
              aria-label="やり直す"
            >
              {REDO_ICON}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
})
