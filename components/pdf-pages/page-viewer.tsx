'use client'

import { memo, useCallback, useState, useRef } from 'react'
import Upload from 'lucide-react/dist/esm/icons/upload'
import FileText from 'lucide-react/dist/esm/icons/file-text'
import X from 'lucide-react/dist/esm/icons/x'
import { cn } from '@/lib/utils'
import type { ProcessingProgress } from '@/types'
import { MergeProgress } from '@/components/pdf-merge/merge-progress'

// ホストされたアイコン
const UPLOAD_ICON = <Upload className="h-8 w-8" />
const FILE_ICON = <FileText className="h-8 w-8" />

interface PageViewerProps {
  onLoad: (file: File) => Promise<void>
  onClear?: () => void
  isProcessing?: boolean
  progress?: ProcessingProgress | null
  fileName?: string | null
  pageCount?: number
  disabled?: boolean
  className?: string
}

/**
 * PDFアップローダーコンポーネント
 * ドラッグ&ドロップとクリックでファイル選択
 */
export const PageViewer = memo(function PageViewer({
  onLoad,
  onClear,
  isProcessing = false,
  progress,
  fileName = null,
  pageCount = 0,
  disabled = false,
  className,
}: PageViewerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      const pdfFiles = files.filter((f) => f.type === 'application/pdf')

      if (pdfFiles.length > 0) {
        onLoad(pdfFiles[0])
      }
    },
    [disabled, onLoad]
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
    fileInputRef.current?.click()
  }, [disabled])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        onLoad(files[0])
      }
    },
    [onLoad]
  )

  const handleClear = useCallback(() => {
    onClear?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onClear])

  // ファイルが読み込まれている場合はファイル情報を表示
  if (fileName && pageCount > 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
              {FILE_ICON}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">{pageCount}ページ</p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={handleClear}
              className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="クリア"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 進捗表示 */}
        {progress && <MergeProgress progress={progress} />}
      </div>
    )
  }

  // アップロードエリア
  return (
    <div className={className}>
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border bg-muted/50 hover:border-primary/50 hover:bg-muted',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'cursor-pointer'
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
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />

        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-card">
          {isDragging ? FILE_ICON : UPLOAD_ICON}
        </div>
        <p className="text-sm font-medium text-foreground">
          ここにPDFファイルをドラッグ&ドロップ
        </p>
        <p className="mt-1 text-xs text-muted-foreground">またはクリックして選択</p>

        {progress && <MergeProgress progress={progress} />}
      </div>
    </div>
  )
})
