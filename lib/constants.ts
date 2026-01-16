// 共通定数
export const MAX_TEXT_LENGTH = 10000
export const MIN_TEXT_LENGTH = 0

// ============================================================================
// PDFマージ機能の定数
// ============================================================================

/** PDF処理設定（環境変数から読み取り） */
export const PDF_MERGE_CONSTANTS = {
  /** 最大ファイル数 */
  MAX_FILES: parseInt(process.env.NEXT_PUBLIC_PDF_MAX_FILES || '30', 10),
  /** 1ファイルあたりの最大サイズ（バイト） */
  MAX_FILE_SIZE: parseInt(process.env.NEXT_PUBLIC_PDF_MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024,
  /** 最小ファイルサイズ（バイト） */
  MIN_FILE_SIZE: 100,
  /** 許可するMIMEタイプ */
  ALLOWED_TYPES: ['application/pdf'] as const,
} as const
