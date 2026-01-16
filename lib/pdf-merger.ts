/**
 * PDFマージャー
 * pdf-libを使用したPDF結合処理
 */

import { PDFDocument } from 'pdf-lib'
import type { FileUpload, PdfMergeOptions, ProcessingProgress, MergeResult } from '@/types'
import { generateMergedFilename } from '@/lib/file-utils'

/**
 * 複数のPDFファイルを結合
 *
 * @param files - 結合するファイル配列
 * @param options - 結合オプション
 * @param onProgress - 進捗コールバック
 * @returns 結合結果（Blobとファイル名）
 */
export async function mergePDFs(
  files: FileUpload[],
  options: PdfMergeOptions,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<MergeResult> {
  // 並べ替えオプションを適用
  const sortedFiles = sortFiles(files, options.order)

  onProgress?.({
    stage: 'loading',
    percentage: 0,
    message: 'PDFファイルを読み込んでいます...',
  })

  // 新しいPDFドキュメントを作成
  const mergedPdf = await PDFDocument.create()

  // 各PDFからページをコピーして結合
  for (let i = 0; i < sortedFiles.length; i++) {
    const file = sortedFiles[i]

    if (!file.file) {
      throw new Error(`ファイル ${file.name} が見つかりません`)
    }

    onProgress?.({
      stage: 'processing',
      percentage: Math.floor((i / sortedFiles.length) * 80),
      currentFile: i + 1,
      totalFiles: sortedFiles.length,
      message: `結合中: ${file.name}`,
    })

    try {
      // ファイルをArrayBufferとして読み込み
      const arrayBuffer = await file.file.arrayBuffer()

      // PDFを読み込み（暗号化されたPDFはエラー）
      const pdf = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      })

      // ページをコピー
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())

      // ページを追加
      copiedPages.forEach((page) => mergedPdf.addPage(page))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      throw new Error(`ファイル ${file.name} の読み込みに失敗しました: ${errorMessage}`)
    }
  }

  onProgress?.({
    stage: 'finalizing',
    percentage: 90,
    message: '最終処理中...',
  })

  // PDFを保存
  const pdfBytes = await mergedPdf.save()

  onProgress?.({
    stage: 'completed',
    percentage: 100,
    message: '完了',
  })

  // 結果を生成
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const filename = generateFilename(sortedFiles, options)

  return {
    blob,
    filename,
    size: blob.size,
    pages: mergedPdf.getPageCount(),
  }
}

/**
 * ファイルをソート
 */
function sortFiles(files: FileUpload[], order: PdfMergeOptions['order']): FileUpload[] {
  if (order === 'filename') {
    return [...files].sort((a, b) =>
      a.name.localeCompare(b.name, 'ja-JP', { numeric: true })
    )
  }
  return files // 元の順序
}

/**
 * 出力ファイル名を生成
 * file-utils.tsのgenerateMergedFilenameを使用
 */
function generateFilename(files: FileUpload[], options: PdfMergeOptions): string {
  return generateMergedFilename({
    keepFilename: options.keepFilename,
    baseFilename: files[0]?.name,
  })
}

/**
 * 単一PDFファイルからページ数を取得
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
    return pdf.getPageCount()
  } catch {
    return 0
  }
}
