/**
 * PDFページ番号挿入処理フック
 * ファイル管理、バリデーション、ページ番号挿入処理の状態管理を一元化
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  FileUpload,
  PdfNumberingOptions,
  ProcessingProgress,
  NumberingResult,
} from '@/types'
import { addPageNumbers, getPdfPageCount } from '@/lib/pdf-page-numbers'
import { validateFile, type ValidationResult } from '@/lib/pdf-validation'
import { filesToFileUploads, downloadBlob } from '@/lib/file-utils'

// バリデーション定数
const MIN_FONT_SIZE = 6
const MAX_FONT_SIZE = 72
const MIN_START_NUMBER = 1
const MAX_START_NUMBER = 9999

/** フックの状態 */
export interface UsePdfPageNumbersState {
  /** アップロード済みファイル */
  file: FileUpload | null
  /** 処理進捗 */
  progress: ProcessingProgress | null
  /** 処理中かどうか */
  isProcessing: boolean
  /** エラーメッセージ */
  error: string | null
  /** 結果 */
  numberingResult: NumberingResult | null
  /** 総ページ数 */
  totalPages: number
}

/** フックのアクション */
export interface UsePdfPageNumbersActions {
  /** ファイルを設定 */
  setFile: (file: File | null) => Promise<void>
  /** ファイルを削除 */
  removeFile: () => void
  /** ページ番号を追加 */
  addNumbers: (options: PdfNumberingOptions) => Promise<void>
  /** 結果をダウンロード */
  download: () => void
  /** エラーをクリア */
  clearError: () => void
  /** 結果をクリア */
  clearResult: () => void
}

/**
 * PDFページ番号挿入処理フック
 *
 * @returns 状態とアクションのタプル
 */
export function usePdfPageNumbers(): [
  UsePdfPageNumbersState,
  UsePdfPageNumbersActions
] {
  const [file, setFile] = useState<FileUpload | null>(null)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [numberingResult, setNumberingResult] = useState<NumberingResult | null>(null)
  const [totalPages, setTotalPages] = useState(0)

  // 処理のキャンセル用
  const abortControllerRef = useRef<AbortController | null>(null)

  // 実ファイルの参照を保持
  const actualFileRef = useRef<File | null>(null)

  // クリーンアップ: コンポーネントアンマウント時に処理をキャンセル
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * ファイルを設定
   */
  const setFileInternal = useCallback(async (newFile: File | null) => {
    if (!newFile) {
      setFile(null)
      setTotalPages(0)
      actualFileRef.current = null
      return
    }

    setError(null)

    // バリデーション
    const validationResult: ValidationResult = validateFile(newFile)
    if (!validationResult.success) {
      setError(validationResult.message)
      return
    }

    // ページ数を取得
    try {
      const pageCount = await getPdfPageCount(newFile)
      setTotalPages(pageCount)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDFファイルの読み込みに失敗しました'
      setError(message)
      return
    }

    // FileUploadに変換して設定
    const uploads = filesToFileUploads([newFile])
    setFile(uploads[0])
    actualFileRef.current = newFile
    setNumberingResult(null)
  }, [])

  /**
   * ファイルを削除
   */
  const removeFile = useCallback(() => {
    setFile(null)
    setTotalPages(0)
    actualFileRef.current = null
    setNumberingResult(null)
    setError(null)
  }, [])

  /**
   * ページ番号を追加
   */
  const addNumbers = useCallback(async (options: PdfNumberingOptions) => {
    if (!actualFileRef.current) {
      setError('ファイルが選択されていません')
      return
    }

    // 既存の処理をキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // バリデーション
    if (options.startFromPage < 1) {
      setError('開始ページは1以上である必要があります')
      return
    }
    if (options.startFromPage > totalPages) {
      setError(`開始ページは総ページ数(${totalPages})以下である必要があります`)
      return
    }
    if (options.fontSize < MIN_FONT_SIZE || options.fontSize > MAX_FONT_SIZE) {
      setError(`フォントサイズは${MIN_FONT_SIZE}〜${MAX_FONT_SIZE}の範囲で指定してください`)
      return
    }
    if (options.startNumber < MIN_START_NUMBER || options.startNumber > MAX_START_NUMBER) {
      setError(`開始番号は${MIN_START_NUMBER}〜${MAX_START_NUMBER}の範囲で指定してください`)
      return
    }

    setIsProcessing(true)
    setError(null)
    setNumberingResult(null)

    try {
      const signal = abortControllerRef.current.signal

      // ページ番号挿入処理
      const result = await addPageNumbers(
        actualFileRef.current,
        options,
        (progressInfo) => {
          setProgress(progressInfo)
        },
        signal
      )

      setNumberingResult(result)
      setProgress({
        stage: 'completed',
        percentage: 100,
        message: 'ページ番号の追加が完了しました',
      })
    } catch (err) {
      if (err instanceof Error && err.message === 'Operation cancelled') {
        // キャンセル時は何もしない
        return
      }

      const errorMessage =
        err instanceof Error ? err.message : 'ページ番号の追加に失敗しました'
      setError(errorMessage)
      setProgress(null)
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [totalPages])

  /**
   * 結果をダウンロード
   */
  const download = useCallback(() => {
    if (!numberingResult) return

    downloadBlob(numberingResult.blob, numberingResult.filename)
  }, [numberingResult])

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
    setNumberingResult(null)
    setProgress(null)
  }, [])

  const actions: UsePdfPageNumbersActions = {
    setFile: setFileInternal,
    removeFile,
    addNumbers,
    download,
    clearError,
    clearResult,
  }

  const state: UsePdfPageNumbersState = {
    file,
    progress,
    isProcessing,
    error,
    numberingResult,
    totalPages,
  }

  return [state, actions]
}
