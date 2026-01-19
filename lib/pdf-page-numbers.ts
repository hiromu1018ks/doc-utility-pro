/**
 * PDFページ番号挿入ライブラリ
 * pdf-libを使用してPDFにページ番号を追加
 */

import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib'
import type {
  PdfNumberingOptions,
  NumberingResult,
  NumberPosition,
  ProcessingProgress,
} from '@/types'

// 進捗計算用の定数
const PROGRESS_LOADING = 10
const PROGRESS_PROCESSING_START = 10
const PROGRESS_PROCESSING_RANGE = 80
const PROGRESS_FINALIZING = 90

/**
 * カラーコードをRGB値に変換
 * @param hexColor - #RRGGBB形式のカラーコード
 * @returns rgb()関数で使用する{r, g, b}オブジェクト
 */
function hexToRgb(hexColor: string): { r: number; g: number; b: number } {
  // バリデーション
  if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
    throw new Error('無効なカラーコードです')
  }

  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  return { r, g, b }
}

/**
 * ページ番号の描画座標を計算
 * PDF座標系は左下が原点 (0, 0)
 * @param page - pdf-libのPDFPageオブジェクト
 * @param position - 配置位置（9箇所）
 * @param fontSize - フォントサイズ
 * @param marginX - 水平マージン
 * @param marginY - 垂直マージン
 * @param textWidth - テキストの幅
 * @returns { x, y } 座標
 */
function calculateTextCoordinates(
  page: PDFPage,
  position: NumberPosition,
  fontSize: number,
  marginX: number,
  marginY: number,
  textWidth: number
): { x: number; y: number } {
  const { width, height } = page.getSize()

  // 垂直位置（Y座標）
  let y: number
  if (position.startsWith('top')) {
    y = height - marginY - fontSize
  } else if (position.startsWith('middle')) {
    y = height / 2 - fontSize / 2
  } else {
    // bottom
    y = marginY + fontSize
  }

  // 水平位置（X座標）
  let x: number
  if (position.endsWith('left')) {
    x = marginX
  } else if (position.endsWith('center')) {
    x = width / 2 - textWidth / 2
  } else {
    // right
    x = width - marginX - textWidth
  }

  return { x, y }
}

/**
 * 現在のページの位置設定を解決
 * 奇数・偶数で別の位置を使用する場合の判定
 * @param options - ページ番号オプション
 * @param pageNumber - 1ベースのページ番号
 * @returns このページで使用する位置
 */
function resolvePosition(
  options: PdfNumberingOptions,
  pageNumber: number
): NumberPosition {
  if (typeof options.position === 'object') {
    // OddEvenPositionの場合
    return pageNumber % 2 === 1 ? options.position.odd : options.position.even
  }
  // 単一のNumberPositionの場合
  return options.position
}

/**
 * 出力ファイル名を生成
 * @param originalFilename - 元のファイル名
 * @returns 出力ファイル名
 */
function generateOutputFilename(originalFilename: string): string {
  const lastDotIndex = originalFilename.lastIndexOf('.')
  if (lastDotIndex > 0) {
    const name = originalFilename.substring(0, lastDotIndex)
    const ext = originalFilename.substring(lastDotIndex)
    return `${name}_numbered${ext}`
  }
  return `${originalFilename}_numbered.pdf`
}

/**
 * PDFにページ番号を挿入
 *
 * @param file - 入力PDFファイル
 * @param options - ページ番号オプション
 * @param onProgress - 進捗コールバック
 * @param signal - AbortSignal for cancellation
 * @returns ページ番号付きPDF
 */
export async function addPageNumbers(
  file: File,
  options: PdfNumberingOptions,
  onProgress?: (progress: ProcessingProgress) => void,
  signal?: AbortSignal
): Promise<NumberingResult> {
  onProgress?.({
    stage: 'loading',
    percentage: 0,
    message: 'PDFファイルを読み込んでいます...',
  })

  // キャンセルチェック
  if (signal?.aborted) {
    throw new Error('Operation cancelled')
  }

  // PDFを読み込み
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
  })

  const pages = pdfDoc.getPages()
  const totalPages = pages.length

  // 空PDFチェック
  if (totalPages === 0) {
    throw new Error('PDFファイルにページが含まれていません')
  }

  // フォントを埋め込み
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const color = hexToRgb(options.fontColor)

  onProgress?.({
    stage: 'processing',
    percentage: PROGRESS_LOADING,
    message: 'ページ番号を追加中...',
  })

  // 各ページに番号を追加
  for (let i = 0; i < totalPages; i++) {
    // キャンセルチェック
    if (signal?.aborted) {
      throw new Error('Operation cancelled')
    }

    const pageNumber = i + 1 // 1ベースのページ番号

    // 開始ページより前の場合はスキップ
    if (pageNumber < options.startFromPage) {
      continue
    }

    // 実際に表示する番号を計算
    const actualNumber = options.startNumber + (pageNumber - options.startFromPage)
    const text = String(actualNumber)

    const page = pages[i]
    const position = resolvePosition(options, pageNumber)
    const textWidth = font.widthOfTextAtSize(text, options.fontSize)

    // 座標を計算
    const { x, y } = calculateTextCoordinates(
      page,
      position,
      options.fontSize,
      options.marginX,
      options.marginY,
      textWidth
    )

    // テキストを描画
    page.drawText(text, {
      x,
      y,
      font,
      size: options.fontSize,
      color: rgb(color.r, color.g, color.b),
    })

    // 進捗を更新
    const percentage =
      PROGRESS_PROCESSING_START +
      Math.floor((i + 1) / totalPages * PROGRESS_PROCESSING_RANGE)
    onProgress?.({
      stage: 'processing',
      percentage,
      message: `処理中: ${pageNumber} / ${totalPages} ページ`,
    })
  }

  onProgress?.({
    stage: 'finalizing',
    percentage: PROGRESS_FINALIZING,
    message: '最終処理中...',
  })

  // PDFを保存
  const pdfBytes = await pdfDoc.save()

  // キャンセルチェック
  if (signal?.aborted) {
    throw new Error('Operation cancelled')
  }

  onProgress?.({
    stage: 'completed',
    percentage: 100,
    message: '完了',
  })

  // 結果を生成
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: 'application/pdf',
  })
  const filename = generateOutputFilename(file.name)

  return {
    blob,
    filename,
    size: blob.size,
    pages: totalPages,
  }
}

/**
 * PDFファイルからページ数を取得
 * @param file - PDFファイル
 * @returns ページ数
 * @throws PDFファイルの読み込みに失敗した場合
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
    })
    const pageCount = pdfDoc.getPageCount()
    if (pageCount === 0) {
      throw new Error('PDFファイルにページが含まれていません')
    }
    return pageCount
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'PDFファイルの読み込みに失敗しました'
    throw new Error(message)
  }
}
