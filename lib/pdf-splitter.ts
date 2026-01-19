/**
 * PDF分割ライブラリ
 * pdf-libを使用したPDF分割処理
 */

import { PDFDocument } from 'pdf-lib'
import type {
  FileUpload,
  PdfSplitOptions,
  ProcessingProgress,
  SplitResult,
  SplitBatchResult,
  PageRange,
  RangeValidationResult,
  RangeError,
} from '@/types'

/**
 * 指定されたページインデックスからPDFを作成
 *
 * @param sourcePdf - 元のPDFドキュメント
 * @param pageIndices - コピーするページインデックス（0ベース）
 * @returns PDF Blob
 */
async function createPdfFromPages(
  sourcePdf: PDFDocument,
  pageIndices: number[]
): Promise<Blob> {
  const newPdf = await PDFDocument.create()
  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices)
  copiedPages.forEach(page => newPdf.addPage(page))
  const pdfBytes = await newPdf.save()
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

/**
 * ページ範囲文字列をパースしてバリデーション
 *
 * @param input - "1-3, 5, 8-10" 形式の文字列
 * @param totalPages - PDFの総ページ数
 * @returns バリデーション結果
 *
 * @example
 * parsePageRanges("1-3, 5, 8-10", 20)
 * // => { isValid: true, ranges: [{start:1,end:3}, {start:5,end:5}, {start:8,end:10}], errors: [], totalPages: 6 }
 */
export function parsePageRanges(
  input: string,
  totalPages: number
): RangeValidationResult {
  const ranges: PageRange[] = []
  const errors: RangeError[] = []

  if (!input || input.trim() === '') {
    return { isValid: false, ranges: [], errors: [], totalPages: 0 }
  }

  // カンマで分割して各セグメントを処理
  const segments = input.split(',').map(s => s.trim()).filter(s => s !== '')

  for (const segment of segments) {
    // 範囲（1-3）または単一ページ（5）をマッチ
    const match = segment.match(/^(\d+)(?:[-~](\d+))?$/)

    if (!match) {
      errors.push({
        input: segment,
        message: `無効な形式です: "${segment}"（例: 1-3, 5）`,
      })
      continue
    }

    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : start

    // バリデーション
    if (start < 1) {
      errors.push({
        input: segment,
        message: `ページ番号は1以上である必要があります: "${segment}"`,
      })
      continue
    }

    if (end < start) {
      errors.push({
        input: segment,
        message: `終了ページは開始ページ以上である必要があります: "${segment}"`,
      })
      continue
    }

    if (start > totalPages) {
      errors.push({
        input: segment,
        message: `ページ${start}はPDFのページ数（${totalPages}ページ）を超えています`,
      })
      continue
    }

    if (end > totalPages) {
      errors.push({
        input: segment,
        message: `ページ${end}はPDFのページ数（${totalPages}ページ）を超えています`,
      })
      continue
    }

    ranges.push({ start, end })
  }

  // 重複チェックとソート
  const mergedRanges = mergeOverlappingRanges(ranges)

  const totalPageCount = mergedRanges.reduce(
    (sum, range) => sum + (range.end - range.start + 1),
    0
  )

  return {
    isValid: errors.length === 0,
    ranges: mergedRanges,
    errors,
    totalPages: totalPageCount,
  }
}

/**
 * 重複する範囲をマージ
 */
function mergeOverlappingRanges(ranges: PageRange[]): PageRange[] {
  if (ranges.length === 0) return []

  // 開始ページでソート
  const sorted = [...ranges].sort((a, b) => a.start - b.start)

  const merged: PageRange[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]

    // 重複または連続している場合はマージ
    if (current.start <= last.end + 1) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push(current)
    }
  }

  return merged
}

/**
 * PDFを分割
 *
 * @param file - 分割するファイル
 * @param options - 分割オプション
 * @param onProgress - 進捗コールバック
 * @param signal - キャンセル用シグナル
 * @returns 分割結果（複数のPDF）
 */
export async function splitPDF(
  file: FileUpload,
  options: PdfSplitOptions,
  onProgress?: (progress: ProcessingProgress) => void,
  signal?: AbortSignal
): Promise<SplitBatchResult> {
  if (!file.file) {
    throw new Error('ファイルが見つかりません')
  }

  onProgress?.({
    stage: 'loading',
    percentage: 0,
    message: 'PDFファイルを読み込んでいます...',
  })

  // PDFを読み込み
  const arrayBuffer = await file.file.arrayBuffer()
  const sourcePdf = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
  })
  const totalPages = sourcePdf.getPageCount()

  onProgress?.({
    stage: 'processing',
    percentage: 10,
    message: '分割範囲を計算しています...',
  })

  let splits: SplitResult[] = []

  // 分割方法に応じて処理
  switch (options.method) {
    case 'ranges':
      splits = await splitByRanges(sourcePdf, options.ranges, totalPages, file.name, onProgress, signal)
      break
    case 'equalParts':
      splits = await splitByEqualParts(
        sourcePdf,
        options.partsCount || 2,
        totalPages,
        file.name,
        onProgress,
        signal
      )
      break
    case 'equalPages':
      splits = await splitByEqualPages(
        sourcePdf,
        options.pagesPerSplit || 1,
        totalPages,
        file.name,
        onProgress,
        signal
      )
      break
  }

  onProgress?.({
    stage: 'finalizing',
    percentage: 90,
    message: 'PDFを生成しています...',
  })

  const totalSplits = splits.length

  onProgress?.({
    stage: 'completed',
    percentage: 100,
    message: `${totalSplits}個のPDFに分割しました`,
  })

  return {
    splits,
    totalPages,
    totalSplits,
  }
}

/**
 * ページ範囲で分割
 */
async function splitByRanges(
  sourcePdf: PDFDocument,
  rangesInput: string,
  totalPages: number,
  baseFilename: string,
  onProgress?: (progress: ProcessingProgress) => void,
  signal?: AbortSignal
): Promise<SplitResult[]> {
  const parseResult = parsePageRanges(rangesInput, totalPages)

  if (!parseResult.isValid || parseResult.ranges.length === 0) {
    if (parseResult.errors.length > 0) {
      throw new Error(parseResult.errors[0].message)
    }
    throw new Error('有効なページ範囲を指定してください')
  }

  const results: SplitResult[] = []
  const ranges = parseResult.ranges

  for (let i = 0; i < ranges.length; i++) {
    // キャンセルチェック
    if (signal?.aborted) {
      throw new Error('処理がキャンセルされました')
    }

    const range = ranges[i]

    onProgress?.({
      stage: 'processing',
      percentage: 10 + Math.floor((i / ranges.length) * 70),
      message: `分割中: ${range.start}-${range.end}ページ...`,
    })

    const pageIndices = Array.from(
      { length: range.end - range.start + 1 },
      (_, j) => range.start - 1 + j
    )

    const blob = await createPdfFromPages(sourcePdf, pageIndices)

    const pageRangeLabel = range.start === range.end
      ? `${range.start}`
      : `${range.start}-${range.end}`

    results.push({
      blob,
      filename: generateSplitFilename(baseFilename, pageRangeLabel, i + 1),
      size: blob.size,
      pages: pageIndices.length,
      pageRange: pageRangeLabel,
      pageNumbers: pageIndices.map(p => p + 1),
    })
  }

  return results
}

/**
 * N等分に分割
 */
async function splitByEqualParts(
  sourcePdf: PDFDocument,
  partsCount: number,
  totalPages: number,
  baseFilename: string,
  onProgress?: (progress: ProcessingProgress) => void,
  signal?: AbortSignal
): Promise<SplitResult[]> {
  if (partsCount < 2) {
    throw new Error('分割数は2以上である必要があります')
  }
  if (partsCount > totalPages) {
    throw new Error(`分割数はページ数（${totalPages}）以下である必要があります`)
  }

  const pagesPerPart = Math.ceil(totalPages / partsCount)
  const results: SplitResult[] = []

  for (let i = 0; i < partsCount; i++) {
    // キャンセルチェック
    if (signal?.aborted) {
      throw new Error('処理がキャンセルされました')
    }

    const startPage = i * pagesPerPart
    const endPage = Math.min(startPage + pagesPerPart, totalPages)

    if (startPage >= totalPages) break

    onProgress?.({
      stage: 'processing',
      percentage: 10 + Math.floor((i / partsCount) * 70),
      message: `分割中: パート${i + 1}...`,
    })

    const pageIndices = Array.from(
      { length: endPage - startPage },
      (_, j) => startPage + j
    )

    const blob = await createPdfFromPages(sourcePdf, pageIndices)

    const startPageNum = startPage + 1
    const endPageNum = endPage
    const pageRangeLabel = `${startPageNum}-${endPageNum}`

    results.push({
      blob,
      filename: generateSplitFilename(baseFilename, `part${i + 1}`, i + 1),
      size: blob.size,
      pages: pageIndices.length,
      pageRange: pageRangeLabel,
      pageNumbers: pageIndices.map(p => p + 1),
    })
  }

  return results
}

/**
 * Xページごとに分割
 */
async function splitByEqualPages(
  sourcePdf: PDFDocument,
  pagesPerSplit: number,
  totalPages: number,
  baseFilename: string,
  onProgress?: (progress: ProcessingProgress) => void,
  signal?: AbortSignal
): Promise<SplitResult[]> {
  if (pagesPerSplit < 1) {
    throw new Error('ページ数は1以上である必要があります')
  }
  if (pagesPerSplit > totalPages) {
    throw new Error(`ページ数はPDFのページ数（${totalPages}）以下である必要があります`)
  }

  const results: SplitResult[] = []
  const totalParts = Math.ceil(totalPages / pagesPerSplit)
  let partIndex = 0

  for (let startPage = 0; startPage < totalPages; startPage += pagesPerSplit) {
    // キャンセルチェック
    if (signal?.aborted) {
      throw new Error('処理がキャンセルされました')
    }

    const endPage = Math.min(startPage + pagesPerSplit, totalPages)

    onProgress?.({
      stage: 'processing',
      percentage: 10 + Math.floor((partIndex / totalParts) * 70),
      message: `分割中: ${startPage + 1}-${endPage}ページ...`,
    })

    const pageIndices = Array.from(
      { length: endPage - startPage },
      (_, j) => startPage + j
    )

    const blob = await createPdfFromPages(sourcePdf, pageIndices)

    const startPageNum = startPage + 1
    const endPageNum = endPage
    const pageRangeLabel = `${startPageNum}-${endPageNum}`

    results.push({
      blob,
      filename: generateSplitFilename(baseFilename, pageRangeLabel, partIndex + 1),
      size: blob.size,
      pages: pageIndices.length,
      pageRange: pageRangeLabel,
      pageNumbers: pageIndices.map(p => p + 1),
    })

    partIndex++
  }

  return results
}

/**
 * 分割後のファイル名を生成
 *
 * @param baseFilename - 元のファイル名
 * @param rangeLabel - 範囲ラベル（例: "1-3", "part1"）
 * @param index - 分割インデックス
 * @returns 生成されたファイル名
 */
export function generateSplitFilename(
  baseFilename: string,
  rangeLabel: string,
  _index: number
): string {
  // 拡張子を除去
  const baseName = baseFilename.replace(/\.pdf$/i, '')
  return `${baseName}_${rangeLabel}.pdf`
}

/**
 * 単一PDFファイルからページ数を取得（再エクスポート）
 */
export { getPdfPageCount } from './pdf-merger'
