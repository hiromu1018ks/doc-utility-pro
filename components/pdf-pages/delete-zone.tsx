'use client'

import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'
import { cn } from '@/lib/utils'

interface DeleteZoneProps {
  disabled?: boolean
  className?: string
}

/**
 * 削除ゾーンコンポーネント
 * ドラッグしたページをここにドロップすると削除される
 */
export const DeleteZone = memo(function DeleteZone({
  disabled = false,
  className,
}: DeleteZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'delete-zone',
    disabled,
  })

  return (
    <div className={cn('mt-6', className)}>
      <div
        ref={setNodeRef}
        className={cn(
          'flex items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-all',
          isOver
            ? 'border-destructive bg-destructive/10 scale-[1.02]'
            : 'border-border bg-muted/30',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'cursor-pointer'
        )}
      >
        <Trash2
          className={cn(
            'h-6 w-6 transition-colors',
            isOver ? 'text-destructive' : 'text-muted-foreground'
          )}
        />
        <span
          className={cn(
            'text-sm font-medium',
            isOver ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {isOver
            ? 'ドロップして削除'
            : '削除するページをここにドロップ'}
        </span>
      </div>
    </div>
  )
})
