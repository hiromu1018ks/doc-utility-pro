'use client'

import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import FileText from 'lucide-react/dist/esm/icons/file-text'
import File from 'lucide-react/dist/esm/icons/file'
import X from 'lucide-react/dist/esm/icons/x'
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal'
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical'
import { cn } from '@/lib/utils'
import type { FileUpload } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface FileCardProps {
  file: FileUpload
  onRemove?: (id: string) => void
  className?: string
  /** DnD用ID */
  id: string
  /** ドラッグ可能かどうか */
  draggable?: boolean
}

/**
 * ファイルカードコンポーネント
 * DnD対応
 */
export const FileCard = memo(function FileCard({
  file,
  onRemove,
  className,
  id,
  draggable = true,
}: FileCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !draggable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getFileIcon = () => {
    switch (file.type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'docx':
        return <File className="h-5 w-5 text-blue-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm',
        isDragging && 'ring-2 ring-primary ring-offset-2',
        className
      )}
    >
      {/* Drag Handle */}
      {draggable && (
        <button
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="ドラッグして並べ替え"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      {/* File Icon */}
      {getFileIcon()}

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">{file.size}</p>
      </div>

      {/* Pages Badge */}
      {file.pages && (
        <Badge variant="secondary" className="shrink-0">
          {file.pages}ページ
        </Badge>
      )}

      {/* Status Badge */}
      {file.status === 'loading' && (
        <Badge variant="secondary" className="shrink-0">
          読み込み中
        </Badge>
      )}
      {file.status === 'error' && (
        <Badge variant="destructive" className="shrink-0" title={file.error}>
          エラー
        </Badge>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled
          aria-label="その他のオプション"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove?.(file.id)}
          aria-label={`${file.name}を削除`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})
