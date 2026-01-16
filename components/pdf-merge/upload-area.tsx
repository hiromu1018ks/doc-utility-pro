'use client'

import { useCallback, useState, useRef } from 'react'
import Upload from 'lucide-react/dist/esm/icons/upload'
import { cn } from '@/lib/utils'

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  className?: string
}

/**
 * アップロードエリアコンポーネント
 * ドラッグ&ドロップとクリックでファイル選択
 */
export function UploadArea({
  onFilesSelected,
  disabled = false,
  className,
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [disabled, onFilesSelected]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounterRef.current++
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleClick = useCallback(() => {
    if (disabled) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf'
    input.multiple = true
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        onFilesSelected(Array.from(target.files))
      }
    }
    input.click()
  }, [disabled, onFilesSelected])

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all',
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : 'border-border bg-muted/50 hover:border-primary/50 hover:bg-muted',
        disabled && 'cursor-not-allowed opacity-50',
        !disabled && 'cursor-pointer',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="PDFファイルをアップロード"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-card">
        <Upload className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">
        ここにファイルをドラッグ&ドロップ、またはクリックして選択
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        PDFファイル（最大50MB、30ファイルまで）
      </p>
    </div>
  )
}
