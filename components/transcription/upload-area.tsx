"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, Mic, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { AUDIO_TRANSCRIPTION_CONSTANTS } from "@/lib/constants"
import type { AudioValidationResult } from "@/types"

interface UploadAreaProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
  className?: string
}

export function UploadArea({ onFileSelected, disabled = false, className }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const dragCounterRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // ファイルバリデーション
  const validateFile = useCallback((file: File): AudioValidationResult => {
    // サイズチェック
    if (file.size > AUDIO_TRANSCRIPTION_CONSTANTS.MAX_FILE_SIZE) {
      return {
        success: false,
        error: "FILE_TOO_LARGE",
        message: `ファイルサイズが大きすぎます（最大${AUDIO_TRANSCRIPTION_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB）`,
      }
    }

    if (file.size < AUDIO_TRANSCRIPTION_CONSTANTS.MIN_FILE_SIZE) {
      return {
        success: false,
        error: "FILE_TOO_SMALL",
        message: "ファイルサイズが小さすぎます",
      }
    }

    // タイプチェック
    if (!AUDIO_TRANSCRIPTION_CONSTANTS.ALLOWED_TYPES.includes(file.type as any)) {
      return {
        success: false,
        error: "INVALID_TYPE",
        message: `対応していないファイル形式です（MP3/WAV/AAC/FLAC/M4A）`,
      }
    }

    return { success: true }
  }, [])

  // ファイル選択処理
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      const file = files[0]
      setValidationError(null)

      const validation = validateFile(file)
      if (!validation.success) {
        setValidationError(validation.message)
        setSelectedFile(null)
        return
      }

      setSelectedFile(file)
      onFileSelected(file)
    },
    [validateFile, onFileSelected]
  )

  // ドラッグイベント
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounterRef.current = 0

      if (disabled) return

      handleFiles(e.dataTransfer.files)
    },
    [disabled, handleFiles]
  )

  // クリックでファイル選択
  const handleClick = useCallback(() => {
    if (disabled) return
    inputRef.current?.click()
  }, [disabled])

  // input変更
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
    },
    [handleFiles]
  )

  // ファイル削除
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setValidationError(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }, [])

  return (
    <div className={cn("space-y-4", className)}>
      <div
        role="button"
        aria-label="音声ファイルをアップロード"
        tabIndex={disabled ? undefined : 0}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-all",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-pointer"
        )}
      >
        {/* 隠しファイル入力 */}
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.aac,.flac,.m4a"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {/* 選択済みファイル表示 */}
        {selectedFile ? (
          <div className="flex w-full max-w-md items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                aria-label="ファイルを削除"
                className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full transition-colors",
              isDragging ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
            )}>
              <Upload className="h-8 w-8" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-foreground">
                音声ファイルをドラッグ＆ドロップ
              </p>
              <p className="text-xs text-muted-foreground">
                またはクリックして選択
              </p>
              <p className="text-xs text-muted-foreground">
                MP3 / WAV / AAC / FLAC / M4A
                （最大{AUDIO_TRANSCRIPTION_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB）
              </p>
            </div>
          </>
        )}
      </div>

      {/* バリデーションエラー */}
      {validationError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="text-sm flex-1">{validationError}</p>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            aria-label="エラーを閉じる"
            className="rounded p-1 hover:bg-destructive/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
