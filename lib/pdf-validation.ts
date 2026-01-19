/**
 * PDFファイルバリデーション
 * ファイルの検証ルールとエラーメッセージ管理
 */

import { PDF_MERGE_CONSTANTS } from '@/lib/constants'
import type { ValidationError, ValidationResult } from '@/types'

// 型を再エクスポート
export type { ValidationError, ValidationResult }

/**
 * 単一ファイルを検証
 */
export function validateFile(file: File): ValidationResult {
  // MIMEタイプチェック
  if (!PDF_MERGE_CONSTANTS.ALLOWED_TYPES.includes(file.type as typeof PDF_MERGE_CONSTANTS.ALLOWED_TYPES[number])) {
    return {
      success: false,
      error: 'INVALID_TYPE',
      message: 'PDFファイルのみアップロード可能です',
    }
  }

  // 拡張子チェック（MIMEタイプが不正確な場合の対策）
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension !== 'pdf') {
    return {
      success: false,
      error: 'INVALID_TYPE',
      message: 'PDFファイルのみアップロード可能です',
    }
  }

  // サイズチェック（上限）
  if (file.size > PDF_MERGE_CONSTANTS.MAX_FILE_SIZE) {
    const maxSizeMB = (PDF_MERGE_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)
    return {
      success: false,
      error: 'FILE_TOO_LARGE',
      message: `ファイルサイズは${maxSizeMB}MB以下にしてください`,
    }
  }

  // サイズチェック（下限）
  if (file.size < PDF_MERGE_CONSTANTS.MIN_FILE_SIZE) {
    return {
      success: false,
      error: 'FILE_TOO_SMALL',
      message: 'ファイルサイズが小さすぎます',
    }
  }

  return { success: true }
}

/**
 * ファイルリスト全体を検証（追加時）
 */
export function validateFilesToAdd(
  newFiles: File[],
  currentCount: number
): ValidationResult {
  if (newFiles.length === 0) {
    return {
      success: false,
      error: 'NO_FILES',
      message: 'ファイルを選択してください',
    }
  }

  // 各ファイルの検証
  for (const file of newFiles) {
    const result = validateFile(file)
    if (!result.success) return result
  }

  // 総数チェック
  const totalCount = currentCount + newFiles.length
  if (totalCount > PDF_MERGE_CONSTANTS.MAX_FILES) {
    return {
      success: false,
      error: 'MAX_FILES_EXCEEDED',
      message: `アップロード可能なファイルは${PDF_MERGE_CONSTANTS.MAX_FILES}個までです`,
    }
  }

  return { success: true }
}

/**
 * マージ実行前の検証
 */
export function validateMerge(fileCount: number): ValidationResult {
  if (fileCount === 0) {
    return {
      success: false,
      error: 'NO_FILES',
      message: '結合するファイルがありません',
    }
  }

  if (fileCount < 2) {
    return {
      success: false,
      error: 'NO_FILES',
      message: '結合には2つ以上のファイルが必要です',
    }
  }

  return { success: true }
}
