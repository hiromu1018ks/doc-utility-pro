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

// ============================================================================
// PDF分割機能の型定義
// ============================================================================

/** 分割方法 */
export type SplitMethod = 'ranges' | 'equalParts' | 'equalPages'

/** ページ範囲（1ページ始まり、 inclusive） */
export interface PageRange {
  start: number  // 開始ページ（1以上）
  end: number    // 終了ページ（start以上）
}

/** ページ範囲のバリデーション結果 */
export interface RangeValidationResult {
  isValid: boolean
  ranges: PageRange[]
  errors: RangeError[]
  totalPages: number
}

/** ページ範囲エラー */
export interface RangeError {
  input: string
  message: string
}

/** PDF分割オプション */
export interface PdfSplitOptions {
  /** 分割方法 */
  method: SplitMethod
  /** ページ範囲指定（method='ranges'時） "1-3,5,8-10" 形式 */
  ranges: string
  /** 分割数（method='equalParts'時） */
  partsCount?: number
  /** ページ数ごとに分割（method='equalPages'時） */
  pagesPerSplit?: number
}

/** デフォルトの分割オプション */
export const DEFAULT_PDF_SPLIT_OPTIONS: PdfSplitOptions = {
  method: 'ranges',
  ranges: '',
} as const

/** 分割結果（単一） */
export interface SplitResult {
  blob: Blob
  filename: string
  size: number
  pages: number
  pageRange: string  // e.g. "1-3", "4", "5-7"
  pageNumbers: number[]  // 含まれるページ番号（1ページ始まり）
}

/** 分割処理の全体結果 */
export interface SplitBatchResult {
  splits: SplitResult[]
  zipBlob?: Blob  // ZIPファイル（全分割を含む）
  totalPages: number
  totalSplits: number
}

// ============================================================================
// PDFページ管理機能の型定義
// ============================================================================

/** ページ回転角度 */
export type RotationDegrees = 0 | 90 | 180 | 270

/** PDFページ状態 */
export interface PdfPage {
  id: string                        // ユニーク識別子
  originalIndex: number             // 元PDF内の位置（0ベース）
  pageNumber: number                // ページ番号（1ベース、表示用）
  thumbnail: string | null          // サムネイル（Data URLまたはBlob URL）
  rotation: RotationDegrees         // 現在の回転角度
  selected: boolean                 // 選択状態（一括操作用）
  dimensions?: {                    // ページサイズ
    width: number
    height: number
  }
}

/** PDFページ管理オプション */
export interface PdfPageManageOptions {
  /** 元のファイル名を維持 */
  keepFilename: boolean
}

/** デフォルトのページ管理オプション */
export const DEFAULT_PDF_PAGE_MANAGE_OPTIONS: PdfPageManageOptions = {
  keepFilename: true,
} as const

/** PDFページ管理結果 */
export interface PdfPageManageResult {
  blob: Blob
  filename: string
  size: number
  pages: number
}

/** 履歴エントリ（Undo/Redo用） */
export interface HistoryEntry {
  pages: PdfPage[]
  timestamp: number
  action: string
}

// ============================================================================
// PDFページ番号挿入機能の型定義
// ============================================================================

/** ページ番号の配置位置（9箇所） */
export type NumberPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/** 奇数・偶数ページで別の位置を使用する設定 */
export interface OddEvenPosition {
  odd: NumberPosition   // 奇数ページの位置
  even: NumberPosition  // 偶数ページの位置
}

/** ページ番号挿入オプション */
export interface PdfNumberingOptions {
  /** 配置位置（単一または奇数・偶数別） */
  position: NumberPosition | OddEvenPosition
  /** 開始番号（デフォルト: 1） */
  startNumber: number
  /** 開始ページ（1ベース、カバーページをスキップする場合など） */
  startFromPage: number
  /** フォントサイズ (pt単位) */
  fontSize: number
  /** 余白 (PDFユニット、1/72インチ) */
  marginX: number
  marginY: number
  /** フォントカラー (16進数 #RRGGBB) */
  fontColor: string
}

/** デフォルトのページ番号挿入オプション */
export const DEFAULT_PDF_NUMBERING_OPTIONS: PdfNumberingOptions = {
  position: 'bottom-right',
  startNumber: 1,
  startFromPage: 1,
  fontSize: 12,
  marginX: 50,
  marginY: 30,
  fontColor: '#000000',
} as const

/** ページ番号挿入結果 */
export interface NumberingResult {
  blob: Blob
  filename: string
  size: number
  pages: number
}
