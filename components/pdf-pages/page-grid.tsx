'use client'

import { memo } from 'react'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { PdfPage } from '@/types'
import { PageCard } from './page-card'
import { DeleteZone } from './delete-zone'

interface PageGridProps {
  pages: PdfPage[]
  selectedIds: Set<string>
  disabled?: boolean
  onReorder?: (fromIndex: number, toIndex: number) => void
  onDelete?: (pageId: string) => void
  onRotate?: (pageId: string) => void
  onToggleSelect?: (pageId: string) => void
  className?: string
}

/**
 * ページグリッドコンポーネント
 * ドラッグ&ドロップでの並べ替えと削除ゾーンを統合
 */
export const PageGrid = memo(function PageGrid({
  pages,
  selectedIds,
  disabled = false,
  onReorder,
  onDelete,
  onRotate,
  onToggleSelect,
  className,
}: PageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動でドラッグ開始
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (disabled) return

    // 削除ゾーンにドロップされた場合
    if (over?.id === 'delete-zone') {
      onDelete?.(active.id as string)
      return
    }

    // 並べ替え
    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id)
      const newIndex = pages.findIndex((p) => p.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder?.(oldIndex, newIndex)
      }
    }
  }

  if (pages.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-12 text-muted-foreground">
          <p>ページがありません</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className={className}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className="[content-visibility:auto] [contain-intrinsic-size:0_20rem]"
            >
              <PageCard
                page={page}
                index={index}
                selected={selectedIds.has(page.id)}
                draggable={!disabled}
                onRotate={onRotate}
                onToggleSelect={onToggleSelect}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 削除ゾーン */}
      {onDelete && <DeleteZone disabled={disabled} />}
    </DndContext>
  )
})
