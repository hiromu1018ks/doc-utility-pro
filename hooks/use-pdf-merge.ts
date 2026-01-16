/**
 * PDFマージ処理フック
 * ファイル管理、バリデーション、結合処理の状態管理を一元化
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import type {
  FileUpload,
  PdfMergeOptions,
  ProcessingProgress,
  MergeResult,
} from '@/types'
import { mergePDFs } from '@/lib/pdf-merger'
import {
  validateFilesToAdd,
  validateMerge,
  type ValidationResult,
} from '@/lib/pdf-validation'
import { filesToFileUploads, downloadBlob } from '@/lib/file-utils'

/** フックの状態 */
export interface UsePdfMergeState {
  /** アップロード済みファイル */
  files: FileUpload[]
  /** 処理進捗 */
  progress: ProcessingProgress | null
  /** 処理中かどうか */
  isProcessing: boolean
  /** エラーメッセージ */
  error: string | null
  /** 結合結果 */
  mergeResult: MergeResult | null
}

/** フックのアクション */
export interface UsePdfMergeActions {
  /** ファイルを追加 */
  addFiles: (files: File[]) => void
  /** ファイルを削除 */
  removeFile: (id: string) => void
  /** ファイルを並べ替え */
  reorderFiles: (fromIndex: number, toIndex: number) => void
  /** 全ファイルをクリア */
  clearFiles: () => void
  /** PDFを結合 */
  merge: (options: PdfMergeOptions) => Promise<void>
  /** 結果をダウンロード */
  download: () => void
  /** エラーをクリア */
  clearError: () => void
  /** 結果をクリア */
  clearResult: () => void
}

/**
 * PDFマージ処理フック
 *
 * @returns 状態とアクションのタプル
 */
export function usePdfMerge(): [UsePdfMergeState, UsePdfMergeActions] {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null)

  // 処理のキャンセル用
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * ファイルを追加
   */
  const addFiles = useCallback((newFiles: File[]) => {
    setError(null)

    // バリデーション
    const validationResult = validateFilesToAdd(newFiles, files.length)
    if (!validationResult.success) {
      setError(validationResult.message)
      return
    }

    // FileUpload配列に変換して追加
    const newUploads = filesToFileUploads(newFiles)
    setFiles((prev) => [...prev, ...newUploads])
  }, [files.length])

  /**
   * ファイルを削除
   */
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  /**
   * ファイルを並べ替え
   */
  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const [removed] = newFiles.splice(fromIndex, 1)
      newFiles.splice(toIndex, 0, removed)
      return newFiles
    })
  }, [])

  /**
   * 全ファイルをクリア
   */
  const clearFiles = useCallback(() => {
    setFiles([])
    setMergeResult(null)
    setError(null)
  }, [])

  /**
   * PDFを結合
   */
  const merge = useCallback(async (options: PdfMergeOptions) => {
    // 既存の処理をキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // バリデーション
    const validationResult = validateMerge(files.length)
    if (!validationResult.success) {
      setError(validationResult.message)
      return
    }

    setIsProcessing(true)
    setError(null)
    setMergeResult(null)

    try {
      const signal = abortControllerRef.current.signal

      // PDF結合処理
      const result = await mergePDFs(
        files,
        options,
        (progressInfo) => {
          // キャンセルチェック
          if (signal.aborted) {
            throw new Error('Operation cancelled')
          }
          setProgress(progressInfo)
        }
      )

      setMergeResult(result)
      setProgress({
        stage: 'completed',
        percentage: 100,
        message: '結合が完了しました',
      })
    } catch (err) {
      if (err instanceof Error && err.message === 'Operation cancelled') {
        // キャンセル時は何もしない
        return
      }

      const errorMessage = err instanceof Error ? err.message : '結合処理に失敗しました'
      setError(errorMessage)
      setProgress(null)
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [files])

  /**
   * 結果をダウンロード
   */
  const download = useCallback(() => {
    if (!mergeResult) return

    downloadBlob(mergeResult.blob, mergeResult.filename)
  }, [mergeResult])

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 結果をクリア
   */
  const clearResult = useCallback(() => {
    setMergeResult(null)
    setProgress(null)
  }, [])

  const actions: UsePdfMergeActions = {
    addFiles,
    removeFile,
    reorderFiles,
    clearFiles,
    merge,
    download,
    clearError,
    clearResult,
  }

  const state: UsePdfMergeState = {
    files,
    progress,
    isProcessing,
    error,
    mergeResult,
  }

  return [state, actions]
}
