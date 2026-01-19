/**
 * PDF分割処理フック
 * ファイル管理、バリデーション、分割処理の状態管理を一元化
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  FileUpload,
  PdfSplitOptions,
  ProcessingProgress,
  SplitBatchResult,
} from '@/types'
import { splitPDF, getPdfPageCount } from '@/lib/pdf-splitter'
import { validateFile } from '@/lib/pdf-validation'
import { filesToFileUploads, downloadBlob } from '@/lib/file-utils'
import { createZipBlob } from '@/lib/zip-utils'

/** フックの状態 */
export interface UsePdfSplitState {
  /** アップロード済みファイル（単一） */
  file: FileUpload | null
  /** 処理進捗 */
  progress: ProcessingProgress | null
  /** 処理中かどうか */
  isProcessing: boolean
  /** エラーメッセージ */
  error: string | null
  /** 分割結果 */
  splitResult: SplitBatchResult | null
  /** PDFの総ページ数 */
  totalPages: number
}

/** フックのアクション */
export interface UsePdfSplitActions {
  /** ファイルを設定 */
  setFile: (file: File) => Promise<void>
  /** ファイルを削除 */
  removeFile: () => void
  /** PDFを分割 */
  split: (options: PdfSplitOptions) => Promise<void>
  /** 個別の分割結果をダウンロード */
  downloadSplit: (index: number) => void
  /** すべての分割結果をZIPでダウンロード */
  downloadAll: () => void
  /** エラーをクリア */
  clearError: () => void
  /** 結果をクリア */
  clearResult: () => void
}

// キャンセルエラーメッセージ
const CANCELLED_ERROR = '処理がキャンセルされました'

/**
 * PDF分割処理フック
 *
 * @returns 状態とアクションのタプル
 */
export function usePdfSplit(): [UsePdfSplitState, UsePdfSplitActions] {
  const [file, setFileState] = useState<FileUpload | null>(null)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [splitResult, setSplitResult] = useState<SplitBatchResult | null>(null)
  const [totalPages, setTotalPages] = useState(0)

  // 処理のキャンセル用
  const abortControllerRef = useRef<AbortController | null>(null)

  // メモリリーク対策: コンポーネントアンマウント時にBlob URLを解放
  useEffect(() => {
    return () => {
      // 既存の処理をキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Blob URLを解放
   */
  const revokeBlobs = useCallback((result: SplitBatchResult | null) => {
    if (!result) return
    // 個別のBlobはdownloadBlob内で解放されるため、ZIPのみ解放
    if (result.zipBlob) {
      URL.revokeObjectURL(URL.createObjectURL(result.zipBlob))
    }
  }, [])

  /**
   * 結果をクリア（Blob解放付き）
   */
  const clearResult = useCallback(() => {
    if (splitResult) {
      revokeBlobs(splitResult)
    }
    setSplitResult(null)
    setProgress(null)
  }, [splitResult, revokeBlobs])

  /**
   * ファイルを設定
   */
  const setFile = useCallback(async (newFile: File) => {
    // 古いBlobを解放
    clearResult()

    setError(null)

    // バリデーション
    const validationResult = validateFile(newFile)
    if (!validationResult.success) {
      setError(validationResult.message)
      return
    }

    // FileUploadに変換
    const fileUpload = filesToFileUploads([newFile])[0]

    // ページ数を取得
    try {
      const pageCount = await getPdfPageCount(newFile)
      setTotalPages(pageCount)
      fileUpload.pages = pageCount
    } catch {
      setError('PDFファイルの読み込みに失敗しました')
      return
    }

    setFileState(fileUpload)
  }, [clearResult])

  /**
   * ファイルを削除
   */
  const removeFile = useCallback(() => {
    clearResult()
    setFileState(null)
    setTotalPages(0)
    setError(null)
  }, [clearResult])

  /**
   * PDFを分割
   */
  const split = useCallback(async (options: PdfSplitOptions) => {
    if (!file) {
      setError('分割するファイルがありません')
      return
    }

    // 既存の処理をキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsProcessing(true)
    setError(null)
    clearResult()

    try {
      const signal = abortControllerRef.current.signal

      // PDF分割処理
      const result = await splitPDF(
        file,
        options,
        (progressInfo) => {
          // キャンセルチェック
          if (signal.aborted) {
            throw new Error(CANCELLED_ERROR)
          }
          setProgress(progressInfo)
        },
        signal
      )

      // ZIPを生成
      const zipBlob = await createZipBlob(
        result.splits.map(s => ({ blob: s.blob, filename: s.filename }))
      )
      result.zipBlob = zipBlob

      setSplitResult(result)
      setProgress({
        stage: 'completed',
        percentage: 100,
        message: `${result.totalSplits}個のPDFに分割しました`,
      })
    } catch (err) {
      if (err instanceof Error && err.message === CANCELLED_ERROR) {
        return
      }

      const errorMessage = err instanceof Error ? err.message : '分割処理に失敗しました'
      setError(errorMessage)
      setProgress(null)
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [file, clearResult])

  /**
   * 個別の分割結果をダウンロード
   */
  const downloadSplit = useCallback((index: number) => {
    if (!splitResult || index < 0 || index >= splitResult.splits.length) {
      return
    }

    const result = splitResult.splits[index]
    downloadBlob(result.blob, result.filename)
  }, [splitResult])

  /**
   * すべての分割結果をZIPでダウンロード
   */
  const downloadAll = useCallback(() => {
    if (!splitResult || !splitResult.zipBlob) {
      return
    }

    const baseName = file?.name.replace(/\.pdf$/i, '') || 'split'
    const zipFilename = `${baseName}_all.zip`
    downloadBlob(splitResult.zipBlob, zipFilename)
  }, [splitResult, file])

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const actions: UsePdfSplitActions = {
    setFile,
    removeFile,
    split,
    downloadSplit,
    downloadAll,
    clearError,
    clearResult,
  }

  const state: UsePdfSplitState = {
    file,
    progress,
    isProcessing,
    error,
    splitResult,
    totalPages,
  }

  return [state, actions]
}
