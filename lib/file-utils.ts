/**
 * ファイル操作ユーティリティ
 * PDF処理に関する汎用的なファイル操作関数
 */

import type { FileUpload } from '@/types'

/**
 * バイト数を読みやすいファイルサイズに変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * FileオブジェクトをFileUploadに変換
 */
export function fileToFileUpload(file: File, index: number): FileUpload {
  return {
    id: `${file.name}-${Date.now()}-${index}`,
    file,
    name: file.name,
    size: formatFileSize(file.size),
    type: 'pdf',
    status: 'pending',
  }
}

/**
 * 複数のFileオブジェクトをFileUpload配列に変換
 */
export function filesToFileUploads(files: File[]): FileUpload[] {
  return files.map((file, index) => fileToFileUpload(file, index))
}

/**
 * Blobをダウンロード
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // ダウンロード開始を待ってからURLを解放（遅延解放）
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * タイムスタンプ付きのファイル名を生成
 */
export function generateMergedFilename(options: {
  keepFilename?: boolean
  baseFilename?: string
}): string {
  const timestamp = new Date().toISOString().slice(0, 10)
  if (options.keepFilename && options.baseFilename) {
    const baseName = options.baseFilename.replace(/\.pdf$/i, '')
    return `${baseName}_merged_${timestamp}.pdf`
  }
  return `merged_${timestamp}.pdf`
}
