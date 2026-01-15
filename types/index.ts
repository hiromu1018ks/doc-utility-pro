export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide-react icon name
}

export interface FileUpload {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx';
  pages?: number;
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
