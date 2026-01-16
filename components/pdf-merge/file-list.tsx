'use client'

import { memo } from 'react'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { FileUpload } from '@/types'
import { FileCard } from './file-card'

interface FileListProps {
  files: FileUpload[]
  onRemove?: (id: string) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  disabled?: boolean
  className?: string
}

/**
 * ファイルリストコンポーネント
 * DnD対応
 */
export const FileList = memo(function FileList({
  files,
  onRemove,
  onReorder,
  disabled = false,
  className,
}: FileListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (disabled) return
    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id)
      const newIndex = files.findIndex((f) => f.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder?.(oldIndex, newIndex)
      }
    }
  }

  if (files.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          アップロード済みファイル ({files.length})
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-2">
          {files.map((file) => (
            <FileCard
              key={file.id}
              id={file.id}
              file={file}
              onRemove={onRemove}
              draggable={!disabled}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
})
