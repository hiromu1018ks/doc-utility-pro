/**
 * ZIP操作ユーティリティ
 * JSZipを使用した一括ダウンロード機能
 */

import JSZip from 'jszip'

/**
 * 複数のBlobをZIPファイルとしてダウンロード
 *
 * @param items - Blobとファイル名の配列
 * @param zipFilename - ZIPファイル名
 */
export async function downloadBlobsAsZip(
  items: Array<{ blob: Blob; filename: string }>,
  zipFilename: string
): Promise<void> {
  const zip = new JSZip()

  // ZIPにファイルを追加
  items.forEach(({ blob, filename }) => {
    zip.file(filename, blob)
  })

  // ZIPを生成
  const zipBlob = await zip.generateAsync({ type: 'blob' })

  // ダウンロード
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // URLを解放
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * 複数のBlobからZIP Blobを生成
 *
 * @param items - Blobとファイル名の配列
 * @returns ZIPファイルのBlob
 */
export async function createZipBlob(
  items: Array<{ blob: Blob; filename: string }>
): Promise<Blob> {
  const zip = new JSZip()

  items.forEach(({ blob, filename }) => {
    zip.file(filename, blob)
  })

  return zip.generateAsync({ type: 'blob' })
}
