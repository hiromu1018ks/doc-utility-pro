/**
 * PDFページ管理フック
 * ページ削除・回転・並べ替えの状態管理を一元化
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  PdfPage,
  ProcessingProgress,
  PdfPageManageResult,
  PdfPageManageOptions,
  HistoryEntry,
  RotationDegrees,
} from '@/types'
import {
  loadPdfPages,
  exportPdfWithPageOperations,
  getNextRotation,
} from '@/lib/pdf-page-operations'
import { downloadBlob } from '@/lib/file-utils'
import { globalThumbnailCache, revokePagesThumbnails } from '@/lib/thumbnail-cache'
import { DEFAULT_PDF_PAGE_MANAGE_OPTIONS } from '@/types'

/** フックの状態 */
export interface UsePdfPagesState {
  /** PDFファイル */
  file: File | null
  /** ページ配列 */
  pages: PdfPage[]
  /** 選択中のページID */
  selectedIds: Set<string>
  /** 処理進捗 */
  progress: ProcessingProgress | null
  /** 処理中かどうか */
  isProcessing: boolean
  /** エラーメッセージ */
  error: string | null
  /** エクスポート結果 */
  result: PdfPageManageResult | null
  /** 元に戻せるか */
  canUndo: boolean
  /** やり直せるか */
  canRedo: boolean
}

/** フックのアクション */
export interface UsePdfPagesActions {
  /** PDFをロード */
  loadPdf: (file: File) => Promise<void>
  /** ファイルをクリア */
  clearFile: () => void
  /** ページを回転 */
  rotatePage: (pageId: string, clockwise?: boolean) => void
  /** 選択ページを一括回転 */
  rotateSelected: (clockwise?: boolean) => void
  /** ページを削除 */
  deletePage: (pageId: string) => void
  /** 選択ページを一括削除 */
  deleteSelected: () => void
  /** ページを並べ替え */
  reorderPages: (fromIndex: number, toIndex: number) => void
  /** ページを選択/解除 */
  toggleSelectPage: (pageId: string) => void
  /** 全ページを選択 */
  selectAll: () => void
  /** 選択をクリア */
  clearSelection: () => void
  /** 元に戻す */
  undo: () => void
  /** やり直す */
  redo: () => void
  /** PDFをエクスポート */
  exportPdf: (options?: PdfPageManageOptions) => Promise<void>
  /** 結果をダウンロード */
  download: () => void
  /** エラーをクリア */
  clearError: () => void
  /** 結果をクリア */
  clearResult: () => void
}

/** 履歴の最大数 */
const MAX_HISTORY = 20

/**
 * PDFページ管理フック
 */
export function usePdfPages(): [UsePdfPagesState, UsePdfPagesActions] {
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PdfPage[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PdfPageManageResult | null>(null)

  // 履歴管理
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // 処理のキャンセル用
  const abortControllerRef = useRef<AbortController | null>(null)

  // 履歴の状態を計算
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  /**
   * 履歴に追加（functional updateでstale closureを回避）
   *
   * NOTE: 依存関係を空にして再作成を防ぐことで、
   * このコールバックに依存する他の関数の安定性が向上します
   */
  const pushHistory = useCallback((newPages: PdfPage[], action: string) => {
    // ページのディープコピーを1回だけ作成（パフォーマンス向上）
    const pagesCopy = newPages.map(p => ({ ...p }))
    const timestamp = Date.now()

    // まず新しい履歴配列を作成（functional update）
    setHistory((prevHistory) => {
      // 現在の位置以降の履歴を削除
      const newHistory = prevHistory.slice(0, historyIndex + 1)

      // 最大履歴数を超える場合は古い履歴を削除（Blob URL解放付き）
      if (newHistory.length >= MAX_HISTORY) {
        const removed = newHistory.shift()
        if (removed) {
          revokePagesThumbnails(removed.pages)
        }
        // シフトしたのでインデックスは変わらない
        setHistoryIndex((i) => i)
      } else {
        setHistoryIndex((i) => i + 1)
      }

      // 新しい履歴を追加
      return [
        ...newHistory,
        {
          pages: pagesCopy,
          timestamp,
          action,
        },
      ]
    })
  }, [historyIndex])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // サムネイルURLを解放
      globalThumbnailCache.clear()
      // 履歴内のサムネイルも解放
      history.forEach(entry => {
        revokePagesThumbnails(entry.pages)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // マウント時のみ実行

  /**
   * PDFをロード
   */
  const loadPdf = useCallback(async (newFile: File) => {
    // 既存の処理をキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsProcessing(true)
    setError(null)
    setResult(null)
    setSelectedIds(new Set())
    setHistory([])
    setHistoryIndex(-1)

    try {
      const signal = abortControllerRef.current.signal

      const loadedPages = await loadPdfPages(newFile, (progressInfo) => {
        if (signal.aborted) {
          throw new Error('Operation cancelled')
        }
        setProgress(progressInfo)
      })

      if (signal.aborted) {
        return
      }

      setFile(newFile)
      setPages(loadedPages)
      setProgress(null)

      // 初期状態を履歴に追加（setHistoryの後なのでsetHistoryIndexは0になる）
      setHistory([
        {
          pages: loadedPages.map(p => ({ ...p })),
          timestamp: Date.now(),
          action: 'PDFを読み込み',
        },
      ])
      setHistoryIndex(0)
    } catch (err) {
      if (err instanceof Error && err.message === 'Operation cancelled') {
        return
      }
      const errorMessage = err instanceof Error ? err.message : 'PDFの読み込みに失敗しました'
      setError(errorMessage)
      setProgress(null)
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [])

  /**
   * ファイルをクリア
   */
  const clearFile = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    // サムネイル解放
    revokePagesThumbnails(pages)
    history.forEach(entry => {
      revokePagesThumbnails(entry.pages)
    })

    setFile(null)
    setPages([])
    setSelectedIds(new Set())
    setProgress(null)
    setError(null)
    setResult(null)
    setHistory([])
    setHistoryIndex(-1)
  }, [pages, history])

  /**
   * ページを回転
   */
  const rotatePage = useCallback((pageId: string, clockwise: boolean = true) => {
    setPages((prev) => {
      const newPages = prev.map((p) =>
        p.id === pageId
          ? { ...p, rotation: getNextRotation(p.rotation, clockwise) }
          : p
      )
      pushHistory(newPages, `ページを回転 (${clockwise ? '時計回り' : '反時計回り'})`)
      return newPages
    })
  }, [pushHistory])

  /**
   * 選択ページを一括回転
   */
  const rotateSelected = useCallback((clockwise: boolean = true) => {
    if (selectedIds.size === 0) return

    setPages((prev) => {
      const newPages = prev.map((p) =>
        selectedIds.has(p.id)
          ? { ...p, rotation: getNextRotation(p.rotation, clockwise) }
          : p
      )
      pushHistory(newPages, `${selectedIds.size}ページを一括回転`)
      return newPages
    })
  }, [selectedIds, pushHistory])

  /**
   * ページを削除（サムネイル解放付き）
   */
  const deletePage = useCallback((pageId: string) => {
    setPages((prev) => {
      const pageToDelete = prev.find((p) => p.id === pageId)
      // サムネイル解放
      if (pageToDelete?.thumbnail) {
        revokePagesThumbnails([pageToDelete])
      }

      const newPages = prev.filter((p) => p.id !== pageId)
      // 選択状態からも削除
      setSelectedIds((prevIds) => {
        const newIds = new Set(prevIds)
        newIds.delete(pageId)
        return newIds
      })
      pushHistory(newPages, 'ページを削除')
      return newPages
    })
  }, [pushHistory])

  /**
   * 選択ページを一括削除（サムネイル解放付き）
   */
  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return

    setPages((prev) => {
      // 削除されるページのサムネイルを解放
      const pagesToDelete = prev.filter((p) => selectedIds.has(p.id))
      revokePagesThumbnails(pagesToDelete)

      const newPages = prev.filter((p) => !selectedIds.has(p.id))
      setSelectedIds(new Set())
      pushHistory(newPages, `${selectedIds.size}ページを一括削除`)
      return newPages
    })
  }, [selectedIds, pushHistory])

  /**
   * ページを並べ替え（バリデーション付き）
   */
  const reorderPages = useCallback((fromIndex: number, toIndex: number) => {
    setPages((prev) => {
      // バリデーション
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
        return prev
      }
      if (fromIndex === toIndex) return prev

      const newPages = [...prev]
      const [removed] = newPages.splice(fromIndex, 1)
      newPages.splice(toIndex, 0, removed)
      pushHistory(newPages, 'ページを並べ替え')
      return newPages
    })
  }, [pushHistory])

  /**
   * ページを選択/解除
   */
  const toggleSelectPage = useCallback((pageId: string) => {
    setSelectedIds((prev) => {
      const newIds = new Set(prev)
      if (newIds.has(pageId)) {
        newIds.delete(pageId)
      } else {
        newIds.add(pageId)
      }
      return newIds
    })
  }, [])

  /**
   * 全ページを選択
   */
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(pages.map((p) => p.id)))
  }, [pages])

  /**
   * 選択をクリア
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  /**
   * 元に戻す
   */
  const undo = useCallback(() => {
    if (!canUndo) return

    const newIndex = historyIndex - 1
    const entry = history[newIndex]
    if (entry) {
      setPages(entry.pages.map(p => ({ ...p })))
      setHistoryIndex(newIndex)
    }
  }, [canUndo, history, historyIndex])

  /**
   * やり直す
   */
  const redo = useCallback(() => {
    if (!canRedo) return

    const newIndex = historyIndex + 1
    const entry = history[newIndex]
    if (entry) {
      setPages(entry.pages.map(p => ({ ...p })))
      setHistoryIndex(newIndex)
    }
  }, [canRedo, history, historyIndex])

  /**
   * PDFをエクスポート
   */
  const exportPdf = useCallback(async (options: PdfPageManageOptions = DEFAULT_PDF_PAGE_MANAGE_OPTIONS) => {
    if (!file || pages.length === 0) {
      setError('PDFファイルが読み込まれていません')
      return
    }

    // 既存の処理をキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const signal = abortControllerRef.current.signal

      const exportResult = await exportPdfWithPageOperations(
        file,
        pages,
        options,
        (progressInfo) => {
          if (signal.aborted) {
            throw new Error('Operation cancelled')
          }
          setProgress(progressInfo)
        }
      )

      setResult(exportResult)
      setProgress({
        stage: 'completed',
        percentage: 100,
        message: 'PDFのエクスポートが完了しました',
      })
    } catch (err) {
      if (err instanceof Error && err.message === 'Operation cancelled') {
        return
      }
      const errorMessage = err instanceof Error ? err.message : 'PDFのエクスポートに失敗しました'
      setError(errorMessage)
      setProgress(null)
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [file, pages])

  /**
   * 結果をダウンロード
   */
  const download = useCallback(() => {
    if (!result) return
    downloadBlob(result.blob, result.filename)
  }, [result])

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
    setResult(null)
    setProgress(null)
  }, [])

  const actions: UsePdfPagesActions = {
    loadPdf,
    clearFile,
    rotatePage,
    rotateSelected,
    deletePage,
    deleteSelected,
    reorderPages,
    toggleSelectPage,
    selectAll,
    clearSelection,
    undo,
    redo,
    exportPdf,
    download,
    clearError,
    clearResult,
  }

  const state: UsePdfPagesState = {
    file,
    pages,
    selectedIds,
    progress,
    isProcessing,
    error,
    result,
    canUndo,
    canRedo,
  }

  return [state, actions]
}
