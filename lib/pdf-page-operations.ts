/**
 * PDFページ操作ライブラリ
 * pdf-libを使用したページ削除・回転・並べ替え処理
 */

import { PDFDocument, RotationTypes } from 'pdf-lib'
import type {
  PdfPage,
  PdfPageManageResult,
  PdfPageManageOptions,
  ProcessingProgress,
  RotationDegrees,
} from '@/types'

/**
 * 単一PDFファイルからページ数を取得（pdf-merger.tsから再エクスポート）
 */
export { getPdfPageCount } from './pdf-merger'

/**
 * PDFファイルを読み込んでページ情報を抽出
 *
 * @param file - PDFファイル
 * @param onProgress - 進捗コールバック
 * @returns ページ情報配列
 */
export async function loadPdfPages(
  file: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<PdfPage[]> {
  onProgress?.({
    stage: 'loading',
    percentage: 0,
    message: 'PDFファイルを読み込んでいます...',
  })

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
  const totalPages = pdf.getPageCount()

  onProgress?.({
    stage: 'processing',
    percentage: 50,
    message: `${totalPages}ページを検出しました...`,
  })

  // ページ情報を生成
  const pages: PdfPage[] = []
  for (let i = 0; i < totalPages; i++) {
    const page = pdf.getPage(i)
    const { width, height } = page.getSize()

    pages.push({
      id: `page-${i}-${Date.now()}`,
      originalIndex: i,
      pageNumber: i + 1,
      thumbnail: null, // サムネイルは別途生成
      rotation: 0,
      selected: false,
      dimensions: { width, height },
    })
  }

  onProgress?.({
    stage: 'completed',
    percentage: 100,
    message: 'PDFの読み込みが完了しました',
  })

  return pages
}

/**
 * ページ操作を適用してPDFをエクスポート
 *
 * @param originalFile - 元のPDFファイル
 * @param pages - ページ情報配列（操作後の状態）
 * @param options - エクスポートオプション
 * @param onProgress - 進捗コールバック
 * @returns エクスポート結果
 */
export async function exportPdfWithPageOperations(
  originalFile: File,
  pages: PdfPage[],
  options: PdfPageManageOptions,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<PdfPageManageResult> {
  if (pages.length === 0) {
    throw new Error('少なくとも1ページが必要です')
  }

  onProgress?.({
    stage: 'loading',
    percentage: 0,
    message: '元のPDFを読み込んでいます...',
  })

  // 元のPDFを読み込み
  const arrayBuffer = await originalFile.arrayBuffer()
  const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

  onProgress?.({
    stage: 'processing',
    percentage: 10,
    message: 'ページを再構成しています...',
  })

  // 新しいPDFを作成
  const newPdf = await PDFDocument.create()

  // ページを順番にコピー・適用
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]

    onProgress?.({
      stage: 'processing',
      percentage: 10 + Math.floor((i / pages.length) * 80),
      currentFile: i + 1,
      totalFiles: pages.length,
      message: `ページ ${page.pageNumber} を処理中...`,
    })

    // 元のPDFからページをコピー
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [page.originalIndex])

    // 回転を適用
    if (page.rotation !== 0) {
      const currentRotation = copiedPage.getRotation().angle
      copiedPage.setRotation({ type: RotationTypes.Degrees, angle: currentRotation + page.rotation })
    }

    // 新しいPDFに追加
    newPdf.addPage(copiedPage)
  }

  onProgress?.({
    stage: 'finalizing',
    percentage: 90,
    message: 'PDFを生成しています...',
  })

  // PDFを保存
  const pdfBytes = await newPdf.save()
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

  onProgress?.({
    stage: 'completed',
    percentage: 100,
    message: 'PDFのエクスポートが完了しました',
  })

  // ファイル名を生成
  const filename = generateExportFilename(originalFile.name, options)

  return {
    blob,
    filename,
    size: blob.size,
    pages: newPdf.getPageCount(),
  }
}

/**
 * エクスポートファイル名を生成
 */
function generateExportFilename(
  baseFilename: string,
  options: PdfPageManageOptions
): string {
  const baseName = baseFilename.replace(/\.pdf$/i, '')
  const timestamp = new Date().toISOString().slice(0, 10)

  if (options.keepFilename) {
    return `${baseName}_edited_${timestamp}.pdf`
  }

  return `pdf_pages_${timestamp}.pdf`
}

/**
 * 回転角度の正規化（0-90-180-270の循環）
 */
export function normalizeRotation(rotation: number): RotationDegrees {
  const normalized = ((rotation % 360) + 360) % 360
  if (normalized === 0) return 0
  if (normalized === 90) return 90
  if (normalized === 180) return 180
  if (normalized === 270) return 270
  return 0
}

/**
 * 次の回転角度を計算（90度ずつ増加）
 */
export function getNextRotation(current: RotationDegrees, clockwise: boolean = true): RotationDegrees {
  const delta = clockwise ? 90 : -90
  return normalizeRotation(current + delta)
}
