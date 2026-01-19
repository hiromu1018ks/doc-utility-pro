/**
 * PDF圧縮ライブラリ
 * メタデータ削除、注釈削除、グレースケール変換、画像圧縮を含むPDF最適化機能
 */

import { PDFDocument, PDFName, PDFDict, PDFArray, PDFStream, PDFContentStream } from 'pdf-lib'
import type { PdfCompressionOptions, CompressionResult, ProcessingProgress } from '@/types'
import { COMPRESSION_PRESET_CONFIGS, COMPRESSION_LOADING_MESSAGES } from '@/types'

/** カスタムエラークラス */
class PdfCompressionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message)
    this.name = 'PdfCompressionError'
  }
}

/** JPEG埋め込みエラー */
class JpegEmbedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JpegEmbedError'
  }
}

/** キャンセルチェック用ヘルパー */
function checkCancelled(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('Operation cancelled')
}

/** pdfjs-distのワーカー初期化状態 */
let pdfJsWorkerInitialized = false

/**
 * pdfjs-distを動的に初期化
 */
async function initPdfJs() {
  if (pdfJsWorkerInitialized) {
    return await import('pdfjs-dist')
  }

  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  pdfJsWorkerInitialized = true

  return pdfjsLib
}

/**
 * PDFのメタデータを削除
 */
async function removeMetadata(pdfDoc: PDFDocument): Promise<void> {
  pdfDoc.setTitle('')
  pdfDoc.setAuthor('')
  pdfDoc.setSubject('')
  pdfDoc.setKeywords([])
  pdfDoc.setProducer('doc-utility-pro')
  pdfDoc.setCreator('')
}

/**
 * PDFの注釈を削除
 */
async function removeAnnotations(pdfDoc: PDFDocument): Promise<void> {
  const pages = pdfDoc.getPages()

  for (const page of pages) {
    const node = page.node
    const annots = node.get(PDFName.of('Annots'))

    if (annots) {
      node.delete(PDFName.of('Annots'))
    }
  }
}

/**
 * PDFの最適化オプションを適用
 */
async function applyPdfOptimizations(
  pdfDoc: PDFDocument,
  options: Pick<PdfCompressionOptions, 'removeMetadata' | 'removeAnnotations'>
): Promise<void> {
  if (options.removeMetadata) {
    await removeMetadata(pdfDoc)
  }
  if (options.removeAnnotations) {
    await removeAnnotations(pdfDoc)
  }
}

/**
 * BlobをFileに変換
 */
function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type })
}

/**
 * 画像を圧縮
 */
async function compressImage(
  imageBlob: Blob,
  quality: number,
  maxWidth: number,
  maxHeight: number
): Promise<Blob> {
  const imageCompression = await import('browser-image-compression')

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: Math.max(maxWidth, maxHeight),
    useWebWorker: true,
    initialQuality: quality,
  }

  try {
    const file = blobToFile(imageBlob, 'image.jpg')
    const compressed = await imageCompression.default(file, options)

    // 圧縮率をログ出力（デバッグ用）
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      const reduction = ((imageBlob.size - compressed.size) / imageBlob.size * 100).toFixed(1)
      console.log(`Image compressed: ${imageBlob.size} -> ${compressed.size} bytes (${reduction}% reduction)`)
    }

    return compressed
  } catch (error) {
    // 圧縮に失敗した場合はエラーをスロー
    const message = error instanceof Error ? error.message : '不明なエラー'
    throw new PdfCompressionError(`画像の圧縮に失敗しました: ${message}`, error instanceof Error ? error : undefined)
  }
}

/**
 * pdfjs-distを使用してPDFから画像を抽出・圧縮し、新しいPDFを生成
 */
async function compressPdfImages(
  arrayBuffer: ArrayBuffer,
  quality: number,
  maxWidth: number,
  maxHeight: number,
  onProgress?: (current: number, total: number) => void,
  signal?: AbortSignal
): Promise<Uint8Array> {
  const pdfjsLib = await initPdfJs()
  checkCancelled(signal)

  // PDFドキュメントを読み込み
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdfJsDoc = await loadingTask.promise

  const pageCount = pdfJsDoc.numPages

  // 新しいPDFを作成
  const newPdfDoc = await PDFDocument.create()

  // 画像抽出と圧縮のカウンター
  let processedImages = 0
  let totalImages = 0

  // まず全ページの画像数をカウント
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdfJsDoc.getPage(i)
    const ops = await page.getOperatorList()

    for (let j = 0; j < ops.fnArray.length; j++) {
      if (ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject ||
          ops.fnArray[j] === pdfjsLib.OPS.paintInlineImageXObject) {
        totalImages++
      }
    }
  }

  // 各ページを処理
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    checkCancelled(signal)

    onProgress?.(pageNum, pageCount)

    const page = await pdfJsDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.0 })

    // ページをキャンバスにレンダリング
    const canvas = document.createElement('canvas')
    const canvasWidth = Math.ceil(viewport.width)
    const canvasHeight = Math.ceil(viewport.height)
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      throw new PdfCompressionError('Canvas contextの取得に失敗しました')
    }

    // 白背景で塗りつぶし
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvasWidth, canvasHeight)

    try {
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise
    } catch (renderError) {
      throw new PdfCompressionError(
        `ページ${pageNum}のレンダリングに失敗しました`,
        renderError instanceof Error ? renderError : undefined
      )
    }

    checkCancelled(signal)

    // CanvasをBlobに変換して圧縮
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new PdfCompressionError('Canvas to Blob conversion failed'))
        }
      }, 'image/jpeg', quality)
    })

    checkCancelled(signal)

    // 画像を圧縮
    const compressedBlob = await compressImage(blob, quality, maxWidth, maxHeight)
    processedImages++

    // 圧縮した画像を新しいPDFに埋め込み
    const imageBytes = await compressedBlob.arrayBuffer()
    let image
    try {
      image = await newPdfDoc.embedJpg(imageBytes)
    } catch (jpegError) {
      // JPEG埋め込みエラーの場合のみPNGフォールバックを実行
      const isJpegError = jpegError instanceof Error && (
        jpegError.message.includes('Invalid JPEG') ||
        jpegError.message.includes('Corrupt JPEG') ||
        jpegError.message.includes('JPEG') ||
        jpegError.message.includes('Invalid image')
      )

      if (isJpegError) {
        // JPEG埋め込みに失敗した場合はPNGを試す
        const pngCanvas = document.createElement('canvas')
        pngCanvas.width = canvasWidth
        pngCanvas.height = canvasHeight
        const pngContext = pngCanvas.getContext('2d')
        if (pngContext) {
          pngContext.drawImage(canvas, 0, 0)
        }
        const pngBlob = await new Promise<Blob>((resolve) => {
          pngCanvas.toBlob((blob) => resolve(blob!), 'image/png')
        })
        const pngBytes = await pngBlob!.arrayBuffer()
        image = await newPdfDoc.embedPng(pngBytes)
      } else {
        // JPEG以外のエラーはそのままスロー
        throw new PdfCompressionError(
          '画像の埋め込みに失敗しました',
          jpegError instanceof Error ? jpegError : undefined
        )
      }
    }

    // ページサイズを計算して追加
    const pdfPage = newPdfDoc.addPage([canvasWidth, canvasHeight])
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
    })

    // Canvasを解放
    canvas.width = 0
    canvas.height = 0
  }

  return await newPdfDoc.save()
}

/**
 * PDFを圧縮
 *
 * @param file - 圧縮するPDFファイル
 * @param options - 圧縮オプション
 * @param onProgress - 進捗コールバック
 * @param signal - キャンセルシグナル
 * @returns 圧縮結果
 */
export async function compressPDF(
  file: File,
  options: PdfCompressionOptions,
  onProgress?: (progress: ProcessingProgress) => void,
  signal?: AbortSignal
): Promise<CompressionResult> {
  const originalSize = file.size

  onProgress?.({
    stage: 'loading',
    percentage: 0,
    message: COMPRESSION_LOADING_MESSAGES.INIT,
  })

  checkCancelled(signal)

  // PDFを読み込み
  const arrayBuffer = await file.arrayBuffer()
  let pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

  const pageCount = pdfDoc.getPageCount()

  onProgress?.({
    stage: 'processing',
    percentage: 10,
    message: COMPRESSION_LOADING_MESSAGES.ANALYZING,
  })

  checkCancelled(signal)

  // メタデータ削除と注釈削除を適用
  await applyPdfOptimizations(pdfDoc, {
    removeMetadata: options.removeMetadata,
    removeAnnotations: options.removeAnnotations,
  })

  checkCancelled(signal)

  // 画像圧縮処理
  const preset = COMPRESSION_PRESET_CONFIGS[options.preset]
  let finalPdfBytes: Uint8Array

  if (options.preset !== 'high') {
    onProgress?.({
      stage: 'processing',
      percentage: 20,
      message: COMPRESSION_LOADING_MESSAGES.COMPRESSING,
    })

    try {
      // pdfjs-distで画像を抽出して圧縮
      const compressedPdfBytes = await compressPdfImages(
        arrayBuffer,
        preset.quality,
        preset.maxWidth,
        preset.maxHeight,
        (current, total) => {
          onProgress?.({
            stage: 'processing',
            percentage: 20 + Math.floor((current / total) * 60),
            message: `${COMPRESSION_LOADING_MESSAGES.COMPRESSING} (${current}/${total}ページ)...`,
          })
        },
        signal
      )

      checkCancelled(signal)

      // 圧縮済みPDFを再読み込みしてメタデータ等の処理を適用
      const compressedPdf = await PDFDocument.load(compressedPdfBytes)

      // メタデータと注釈の削除を再適用
      await applyPdfOptimizations(compressedPdf, {
        removeMetadata: options.removeMetadata,
        removeAnnotations: options.removeAnnotations,
      })

      finalPdfBytes = await compressedPdf.save()
    } catch (error) {
      // 画像圧縮に失敗した場合はエラーをスロー
      if (error instanceof Error && error.message === 'Operation cancelled') {
        throw error
      }

      const message = error instanceof Error ? error.message : '不明なエラー'
      throw new PdfCompressionError(`画像の圧縮に失敗しました: ${message}`, error instanceof Error ? error : undefined)
    }
  } else {
    // 高品質プリセットの場合はメタデータ・注釈削除のみ
    finalPdfBytes = await pdfDoc.save()
  }

  onProgress?.({
    stage: 'finalizing',
    percentage: 90,
    message: COMPRESSION_LOADING_MESSAGES.SAVING,
  })

  checkCancelled(signal)

  // PDFをBlobに変換
  const blob = new Blob([finalPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const compressedSize = blob.size

  onProgress?.({
    stage: 'completed',
    percentage: 100,
    message: COMPRESSION_LOADING_MESSAGES.COMPLETED,
  })

  return {
    blob,
    filename: file.name.replace('.pdf', '_compressed.pdf'),
    originalSize,
    compressedSize,
    reductionRate: ((originalSize - compressedSize) / originalSize) * 100,
    pages: pageCount,
  }
}

/**
 * PDFのページ数を取得
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
  return pdfDoc.getPageCount()
}
