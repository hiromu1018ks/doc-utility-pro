/**
 * サムネイルキャッシュライブラリ
 * LRUキャッシュでPDFページサムネイルを管理
 */

import { PDFDocument } from 'pdf-lib'

/** サムネイル生成オプション */
export interface ThumbnailOptions {
  scale: number           // スケール係数（0.2 = 20%）
  format: 'png' | 'jpeg'  // 画像形式
  quality: number         // JPEG品質（0-1）
}

/** デフォルトのサムネイルオプション */
const DEFAULT_THUMBNAIL_OPTIONS: ThumbnailOptions = {
  scale: 0.2,
  format: 'png',
  quality: 0.8,
}

/**
 * LRUキャッシュエントリ
 */
interface CacheEntry {
  dataUrl: string
  timestamp: number
  accessCount: number
}

/**
 * サムネイルキャッシュクラス
 */
export class ThumbnailCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize: number
  private ttl: number // Time to live (ms)

  constructor(maxSize: number = 50, ttl: number = 30 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  /**
   * キャッシュから取得
   */
  get(key: string): string | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // 有効期限チェック
    if (Date.now() - entry.timestamp > this.ttl) {
      this.revokeUrl(entry.dataUrl)
      this.cache.delete(key)
      return null
    }

    // アクセスカウントを増加
    entry.accessCount++
    return entry.dataUrl
  }

  /**
   * キャッシュに設定
   */
  set(key: string, dataUrl: string): void {
    // キャッシュサイズが上限を超える場合、古いエントリを削除
    if (this.cache.size >= this.maxSize) {
      this.evict()
    }

    this.cache.set(key, {
      dataUrl,
      timestamp: Date.now(),
      accessCount: 0,
    })
  }

  /**
   * キャッシュをクリア（Blob URLを解放）
   */
  clear(): void {
    // すべてのBlob URLを解放してからクリア
    for (const [, entry] of this.cache.entries()) {
      this.revokeUrl(entry.dataUrl)
    }
    this.cache.clear()
  }

  /**
   * LRUポリシーでエントリを削除（Blob URLを解放）
   */
  private evict(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity
    let lowestAccess = Infinity

    for (const [key, entry] of this.cache.entries()) {
      // アクセス数が少なく、最も古いエントリを削除
      if (entry.accessCount < lowestAccess || entry.timestamp < oldestTime) {
        oldestKey = key
        oldestTime = entry.timestamp
        lowestAccess = entry.accessCount
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)
      if (entry) {
        this.revokeUrl(entry.dataUrl)
      }
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Blob URLを解放
   */
  private revokeUrl(dataUrl: string): void {
    if (dataUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(dataUrl)
      } catch {
        // 既に解放されている場合は無視
      }
    }
  }

  /**
   * キャッシュサイズを取得
   */
  get size(): number {
    return this.cache.size
  }
}

/**
 * グローバルサムネイルキャッシュインスタンス
 */
export const globalThumbnailCache = new ThumbnailCache(50)

/**
 * PDFページのサムネイルを生成
 * 注意: pdf-lib単独では画像レンダリングができないため、
 * この関数はプレースホルダーとして実装
 *
 * 実際のサムネイル生成には以下のアプローチが必要:
 * 1. pdf.js (Mozilla) を使用してCanvasにレンダリング
 * 2. またはサーバーサイドでレンダリング
 *
 * @param pdfBytes - PDFバイト列
 * @param pageIndex - ページインデックス（0ベース）
 * @param options - サムネイルオプション
 * @returns Data URL
 */
export async function generatePageThumbnail(
  pdfBytes: Uint8Array,
  pageIndex: number,
  options: Partial<ThumbnailOptions> = {}
): Promise<string> {
  const opts = { ...DEFAULT_THUMBNAIL_OPTIONS, ...options }

  // キャッシュキーを生成
  const cacheKey = `${pdfBytes.byteLength}-${pageIndex}-${opts.scale}`

  // キャッシュチェック
  const cached = globalThumbnailCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // PDFを読み込んでページを抽出
  const pdf = await PDFDocument.load(pdfBytes)
  const totalPages = pdf.getPageCount()

  if (pageIndex < 0 || pageIndex >= totalPages) {
    throw new Error(`ページインデックスが範囲外です: ${pageIndex}`)
  }

  // 単一ページのPDFを作成
  const singlePagePdf = await PDFDocument.create()
  const [copiedPage] = await singlePagePdf.copyPages(pdf, [pageIndex])
  singlePagePdf.addPage(copiedPage)

  const pagePdfBytes = await singlePagePdf.save()

  // Data URLを生成
  const blob = new Blob([pagePdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const dataUrl = URL.createObjectURL(blob)

  // キャッシュに保存（実際の画像Data URLではないので、一時的な実装）
  globalThumbnailCache.set(cacheKey, dataUrl)

  return dataUrl
}

/**
 * Canvasを使用してサムネイルを生成（pdf.jsが必要な実装）
 *
 * これはpdf.jsを導入した場合の実装例です
 */
export async function generatePageThumbnailWithCanvas(
  pdfBytes: Uint8Array,
  pageIndex: number,
  _options: Partial<ThumbnailOptions> = {}
): Promise<string> {
  // TODO: pdf.jsを導入した場合の実装
  throw new Error('Canvas-based thumbnail generation requires pdf.js library')
}

/**
 * サムネイルData URLをクリーンアップ
 */
export function revokeThumbnailUrl(dataUrl: string): void {
  if (dataUrl?.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(dataUrl)
    } catch {
      // 既に解放されている場合は無視
    }
  }
}

/**
 * 複数のサムネイルURLをクリーンアップ
 */
export function revokeThumbnailUrls(dataUrls: string[]): void {
  dataUrls.forEach(revokeThumbnailUrl)
}

/**
 * ページ配列のサムネイルURLを一括クリーンアップ
 */
export function revokePagesThumbnails(pages: { thumbnail: string | null }[]): void {
  for (const page of pages) {
    revokeThumbnailUrl(page.thumbnail ?? '')
  }
}
