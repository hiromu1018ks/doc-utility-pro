'use client'

import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import RotateCw from 'lucide-react/dist/esm/icons/rotate-cw'
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical'
import Check from 'lucide-react/dist/esm/icons/check'
import FileText from 'lucide-react/dist/esm/icons/file-text'
import { cn } from '@/lib/utils'
import type { PdfPage } from '@/types'

interface PageCardProps {
  page: PdfPage
  index: number
  selected: boolean
  draggable?: boolean
  onRotate?: (pageId: string) => void
  onToggleSelect?: (pageId: string) => void
}

// ホストされたアイコン（パフォーマンス向上）
const PDF_ICON = <FileText className="h-8 w-8 text-red-500" />

/**
 * ページカードコンポーネント
 * サムネイル表示、回転ボタン、選択チェックボックス付き
 */
export const PageCard = memo(function PageCard({
  page,
  index,
  selected,
  draggable = true,
  onRotate,
  onToggleSelect,
}: PageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    disabled: !draggable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card shadow-sm overflow-hidden transition-all',
        selected && 'ring-2 ring-primary ring-offset-2',
        isDragging && 'opacity-50 scale-105'
      )}
    >
      {/* ドラッグハンドル */}
      {draggable && (
        <button
          className="absolute top-2 left-2 z-10 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing bg-background/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="ドラッグして並べ替え"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* 選択チェックボックス */}
      {onToggleSelect && (
        <button
          className={cn(
            'absolute top-2 right-2 z-10 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors',
            selected
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-muted-foreground bg-background/80 hover:border-primary',
            'opacity-0 group-hover:opacity-100'
          )}
          onClick={() => onToggleSelect(page.id)}
          aria-label={selected ? '選択解除' : '選択'}
        >
          {selected && <Check className="h-4 w-4" />}
        </button>
      )}

      {/* サムネイル/プレビューエリア */}
      <div className="aspect-[3/4] bg-muted relative flex items-center justify-center">
        {/* サムネイルがある場合は表示 */}
        {page.thumbnail ? (
          <img
            src={page.thumbnail}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-full object-contain"
            style={{
              transform: `rotate(${page.rotation}deg)`,
              transition: 'transform 0.2s ease',
            }}
          />
        ) : (
          // サムネイルがない場合はプレースホルダー
          <div className="flex flex-col items-center gap-2">
            {PDF_ICON}
            <span className="text-xs text-muted-foreground">
              {page.pageNumber}ページ
            </span>
          </div>
        )}

        {/* ページ番号バッジ */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/90 px-2 py-1 rounded text-xs font-medium shadow-sm">
          {index + 1}
        </div>

        {/* 回転角度インジケーター */}
        {page.rotation !== 0 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
            {page.rotation}°
          </div>
        )}
      </div>

      {/* 回転ボタン */}
      {onRotate && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="h-8 w-8 rounded-md bg-background/90 shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
            onClick={() => onRotate(page.id)}
            disabled={!draggable}
            aria-label="90度回転"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ページ情報 */}
      <div className="p-2 text-xs text-muted-foreground text-center border-t">
        <span className="font-medium text-foreground">ページ {page.pageNumber}</span>
        {page.dimensions && (
          <span className="ml-2">
            {Math.round(page.dimensions.width)}×{Math.round(page.dimensions.height)}
          </span>
        )}
      </div>
    </div>
  )
})
