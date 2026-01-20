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

// ============================================================================
// 音声文字起こし機能の定数
// ============================================================================

/** 音声処理設定（環境変数から読み取り） */
export const AUDIO_TRANSCRIPTION_CONSTANTS = {
  /** 最大ファイルサイズ（バイト） */
  MAX_FILE_SIZE: parseInt(process.env.NEXT_PUBLIC_AUDIO_MAX_SIZE_MB || '500', 10) * 1024 * 1024,
  /** 最小ファイルサイズ（バイト） */
  MIN_FILE_SIZE: 1024, // 1KB
  /** 最大ファイル数 */
  MAX_FILES: parseInt(process.env.NEXT_PUBLIC_AUDIO_MAX_FILES || '1', 10),
  /** 許可するMIMEタイプ */
  ALLOWED_TYPES: [
    'audio/mpeg',      // MP3
    'audio/mp3',       // MP3（別名）
    'audio/wav',       // WAV
    'audio/wave',      // WAV（別名）
    'audio/aac',       // AAC
    'audio/flac',      // FLAC
    'audio/x-flac',    // FLAC（別名）
    'audio/mp4',       // M4A（MP4コンテナ）
    'audio/x-m4a',     // M4A
  ] as const,
  /** 結果保持期間（日） */
  RETENTION_DAYS: 7,
} as const

/** 議事録プリセットテンプレート */
export const MEETING_MINUTES_TEMPLATES: Record<string, {
  id: string
  name: string
  description: string
  prompt: string
}> = {
  standard: {
    id: 'standard',
    name: '標準会議議事録',
    description: '日時、参加者、議題、決定事項を含む標準形式',
    prompt: `あなたはプロフェッショナルな会議議事録作成者です。

以下の文字起こしから、明確で構造化された議事録を作成してください。

【指示】
- 箇条書きを使用して簡潔にまとめる
- 重要な発言や決定事項を明確にする
- 中立的な立場で記述する
- 日本語で出力する

【出力形式】
## 会議概要
- 日時：（自動抽出）
- 参加者：（自動抽出）

## 議事の要約
全体の流れを3〜5行でまとめる

## 主要な議論内容
議題ごとの議論を要約

## 決定事項
決定事項を箇条書き

## 次回のアクション
担当者付きのアクションアイテム`,
  },
  concise: {
    id: 'concise',
    name: '簡易版',
    description: '重要ポイントのみを抽出した簡潔な形式',
    prompt: `以下の文字起こしから、簡潔な議事録を作成してください。

【指示】
- 重要なポイントのみ抽出
- 1〜2ページ以内に収める
- 箇条書き中心

【出力形式】
## 要約
全体の要約（3〜5行）

## 決定事項
重要な決定事項

## アクションアイテム
次回のアクション`,
  },
  detailed: {
    id: 'detailed',
    name: '詳細版',
    description: '発言内容を詳しく記録した詳細な形式',
    prompt: `以下の文字起こしから、詳細な会議議事録を作成してください。

【指示】
- 発言者ごとに内容を記録
- 議論の経緯を詳しく追う
- 全ての決定事項を記録

【出力形式】
## 会議情報
- 日時：
- 参加者：

## 議事録（詳細）
議題ごとの詳細な議論記録

## 決定事項
全決定事項のリスト

## 次回のアクション
担当者付きのアクションアイテム`,
  },
  brainstorming: {
    id: 'brainstorming',
    name: 'ブレインストーミング',
    description: 'アイデア出し会議向けの形式',
    prompt: `以下のブレインストーミングセッションの文字起こしから、議事録を作成してください。

【指示】
- 出されたアイデアを全て記録
- アイデアのカテゴリー分け
- 評価・選定結果を記録

【出力形式】
## セッション概要
テーマ、参加者、時間

## 出されたアイデア
カテゴリー別のアイデアリスト

## 評価・選定
採用されたアイデアと理由

## 次回のステップ
具体的なアクション`,
  },
} as const
