export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide-react icon name
}

export interface FileUpload {
  id: string;
  file?: File; // 実際のFileオブジェクト（PDF処理用）
  name: string;
  size: string;
  type: 'pdf' | 'docx';
  pages?: number;
  status?: 'pending' | 'loading' | 'ready' | 'error';
  error?: string;
}

export interface StatCard {
  label: string;
  value: string;
  icon: string;
  color?: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  fileName: string;
  time: string;
  status: 'completed' | 'processing' | 'failed';
}

// 文章校正AI関連の型定義
export type ProofreadingOption = 'grammar' | 'style' | 'spelling' | 'clarity' | 'tone';

// オプションの配列（反復処理用）
export const PROOFREADING_OPTIONS: readonly ProofreadingOption[] =
  ['grammar', 'style', 'spelling', 'clarity', 'tone'] as const;

// ProofreadingOptionから導出される型（冗長性を排除）
export type ProofreadingOptions = Record<ProofreadingOption, boolean>;

// デフォルトのオプション値
export const DEFAULT_PROOFREADING_OPTIONS: ProofreadingOptions = {
  grammar: true,
  style: true,
  spelling: true,
  clarity: true,
  tone: true,
} as const;

export interface TextChange {
  id: string;
  originalText: string;
  correctedText: string;
  type: 'addition' | 'deletion' | 'replacement' | 'none';
  category: ProofreadingOption;
}

export interface ProofreadingResult {
  originalText: string;
  correctedText: string;
  changes: TextChange[];
  summary: {
    totalChanges: number;
    changesByCategory: Record<ProofreadingOption, number>;
    wordCount: number;
    characterCount: number;
  };
}

// ============================================================================
// PDFマージ機能の型定義
// ============================================================================

/** 結合順序オプション */
export type MergeOrder = 'original' | 'filename';

/** 画像品質オプション */
export type ImageQuality = 'high' | 'medium' | 'low';

/** 結合オプション */
export interface PdfMergeOptions {
  /** 結合順序 */
  order: MergeOrder;
  /** 元のファイル名を維持 */
  keepFilename: boolean;
  /** しおり（目次）を作成 */
  createBookmarks: boolean;
  /** 画像品質 */
  imageQuality: ImageQuality;
  /** ファイルサイズを最適化 */
  optimize: boolean;
}

/** デフォルトの結合オプション */
export const DEFAULT_PDF_MERGE_OPTIONS: PdfMergeOptions = {
  order: 'original',
  keepFilename: true,
  createBookmarks: true,
  imageQuality: 'high',
  optimize: false,
} as const;

/** 処理ステージ */
export type ProcessingStage =
  | 'validating'
  | 'loading'
  | 'processing'
  | 'finalizing'
  | 'completed'
  | 'error';

/** 処理進捗 */
export interface ProcessingProgress {
  stage: ProcessingStage;
  percentage: number; // 0-100
  currentFile?: number;
  totalFiles?: number;
  message: string;
}

/** 処理状態 */
export type MergeStatus = 'idle' | 'processing' | 'completed' | 'error';

/** PDF結合結果 */
export interface MergeResult {
  blob: Blob;
  filename: string;
  size: number;
  pages: number;
}

// ============================================================================
// PDFバリデーション型定義
// ============================================================================

/** バリデーションエラー種別 */
export type ValidationError =
  | 'INVALID_TYPE'
  | 'FILE_TOO_LARGE'
  | 'FILE_TOO_SMALL'
  | 'MAX_FILES_EXCEEDED'
  | 'NO_FILES'
  | 'UNKNOWN_ERROR'

/** バリデーション結果 */
export type ValidationResult =
  | { success: true }
  | { success: false; error: ValidationError; message: string }
