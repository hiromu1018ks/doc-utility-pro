/**
 * PDF圧縮処理フック
 * ファイル管理、バリデーション、圧縮処理の状態管理を一元化
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  FileUpload,
  PdfCompressionOptions,
  ProcessingProgress,
  CompressionResult,
} from '@/types'
import { compressPDF, getPdfPageCount } from '@/lib/pdf-compressor'
import { validateFile, type ValidationResult } from '@/lib/pdf-validation'
import { fileToFileUpload, downloadBlob } from '@/lib/file-utils'

/** フックの状態 */
export interface UsePdfCompressionState {
  /** アップロード済みファイル */
  file: FileUpload | null
  /** 処理進捗 */
  progress: ProcessingProgress | null
  /** 処理中かどうか */
  isProcessing: boolean
  /** エラーメッセージ */
  error: string | null
  /** 圧縮結果 */
  compressionResult: CompressionResult | null
}

/** フックのアクション */
export interface UsePdfCompressionActions {
  /** ファイルを設定 */
  setFile: (file: File) => void
  /** ファイルをクリア */
  clearFile: () => void
  /** PDFを圧縮 */
  compress: (options: PdfCompressionOptions) => Promise<void>
  /** 結果をダウンロード */
  download: () => void
  /** エラーをクリア */
  clearError: () => void
  /** 結果をクリア */
  clearResult: () => void
}

/**
 * PDF圧縮処理フック
 *
 * @returns 状態とアクションのタプル
 */
export function usePdfCompression(): [UsePdfCompressionState, UsePdfCompressionActions] {
  const [file, setFileState] = useState<FileUpload | null>(null)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null)

  // 処理のキャンセル用
  const abortControllerRef = useRef<AbortController | null>(null)

  // Blob URLのクリーンアップ
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * エラーメッセージを生成
   */
  const getErrorMessage = useCallback((err: unknown): string => {
    if (err instanceof Error) {
      const message = err.message.toLowerCase()

      if (message.includes('encrypted') || message.includes('password')) {
        return 'PDFがパスワードで保護されています。解除してから再度アップロードしてください。'
      }
      if (message.includes('invalid pdf') || message.includes('pdf structure')) {
        return 'PDFファイルが破損しているか、無効な形式です。別のファイルをお試しください。'
      }
      if (message.includes('memory') || message.includes('heap')) {
        return 'ファイルサイズが大きすぎます。より小さいファイルを試してください。'
      }
      if (message.includes('network') || message.includes('fetch')) {
        return 'ネットワークエラーが発生しました。接続を確認してもう一度お試しください。'
      }
      if (message.includes('canvas') || message.includes('render')) {
        return 'PDFのレンダリング中にエラーが発生しました。別のファイルを試してください。'
      }

      // 画像圧縮関連のエラー
      if (message.includes('画像の圧縮に失敗')) {
        return err.message
      }

      return err.message
    }
    return '圧縮処理に失敗しました。もう一度お試しください。'
  }, [])

  /**
   * ファイルを設定
   */
  const setFile = useCallback(async (newFile: File) => {
    setError(null)

    // バリデーション
    const validationResult: ValidationResult = validateFile(newFile)
    if (!validationResult.success) {
      setError(validationResult.message)
      return
    }

    // ページ数を取得
    try {
      const pages = await getPdfPageCount(newFile)
      const upload = fileToFileUpload(newFile, 0)
      upload.pages = pages
      setFileState(upload)

      // 結果をクリア
      setCompressionResult(null)
      setProgress(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [getErrorMessage])

  /**
   * ファイルをクリア
   */
  const clearFile = useCallback(() => {
    setFileState(null)
    setCompressionResult(null)
    setError(null)
    setProgress(null)
  }, [])

  /**
   * PDFを圧縮
   */
  const compress = useCallback(async (options: PdfCompressionOptions) => {
    if (!file || !file.file) {
      setError('圧縮するファイルがありません')
      return
    }

    // 既存の処理をキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsProcessing(true)
    setError(null)
    setCompressionResult(null)

    try {
      const signal = abortControllerRef.current.signal

      // PDF圧縮処理
      const result = await compressPDF(
        file.file,
        options,
        (progressInfo) => {
          // キャンセルチェック
          if (signal.aborted) {
            throw new Error('Operation cancelled')
          }
          setProgress(progressInfo)
        },
        signal
      )

      setCompressionResult(result)
    } catch (err) {
      if (err instanceof Error && err.message === 'Operation cancelled') {
        // キャンセル時は何もしない
        return
      }

      setError(getErrorMessage(err))
      setProgress(null)
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [file, getErrorMessage])

  /**
   * 結果をダウンロード
   */
  const download = useCallback(() => {
    if (!compressionResult) return

    try {
      downloadBlob(compressionResult.blob, compressionResult.filename)
    } catch (err) {
      setError('ファイルのダウンロードに失敗しました')
    }
  }, [compressionResult])

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
    setCompressionResult(null)
    setProgress(null)
  }, [])

  const actions: UsePdfCompressionActions = {
    setFile,
    clearFile,
    compress,
    download,
    clearError,
    clearResult,
  }

  const state: UsePdfCompressionState = {
    file,
    progress,
    isProcessing,
    error,
    compressionResult,
  }

  return [state, actions]
}
