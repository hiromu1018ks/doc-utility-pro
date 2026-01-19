import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { MAX_TEXT_LENGTH } from '@/lib/constants'
import { checkRateLimit, getRemainingRequests, getResetTime } from '@/lib/rate-limit'

// Vercel AI SDKの設定
export const maxDuration = 120 // タイムアウトを60秒から120秒に延長（長文校正の成功率向上）

// Static instruction mapping moved outside function for better performance
const OPTION_INSTRUCTIONS: Record<string, string> = {
  grammar: '・文法や語法の間違いを検出・修正してください\n・明白な文法ミスは必ず修正してください',
  style: '・文体やスタイルを改善し、一貫性を高めてください\n・読みにくい長文は適宜分割し、接続詞を整理して読みやすくしてください\n・公文書として適切な文体に整えてください',
  spelling: '・タイプミスや誤字脱字を修正してください\n・表記ゆれ（全角半角、漢字の開きなど）を統一してください\n・句読点（「、。」）を適切に補ってください',
  clarity: '・文章の明確性を高め、わかりやすい表現に直してください\n・重複を避け、簡潔な表現にまとめてください\n・曖昧な表現を明確にしてください',
  tone: '・公文書・ビジネス文書として適切なトーン（丁寧語・ですます調）に調整してください\n・一貫した敬語表現を使用してください\n・口語的な表現（〜だなー、〜だね、〜じゃんなど）を書き言葉に直してください\n・語尾を適切に整えてください',
}

/**
 * 文章校正API
 * POST /api/proofread
 *
 * リクエストボディ:
 * - text: 校正するテキスト
 * - options: 校正オプション
 *
 * レスポンス: ストリーミングで校正結果を返す
 */
export async function POST(req: Request) {
  // レート制限チェック（IPアドレスベース）
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'unknown'

  if (checkRateLimit(ip)) {
    const resetTime = getResetTime(ip)
    return new Response(
      JSON.stringify({
        error: 'リクエスト数が制限を超えました。しばらく待ってから再試行してください。',
        retryAfter: resetTime,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(resetTime),
          'X-RateLimit-Limit': String(10),
          'X-RateLimit-Remaining': String(getRemainingRequests(ip)),
          'X-RateLimit-Reset': String(resetTime),
        },
      }
    )
  }

  // APIキーの検証（リクエストハンドラー内で実行）
  const apiKey = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'サーバー設定エラー: APIキーが設定されていません' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // z.ai (Zhipu AI) のGLM-4.7用プロバイダー
  const zai = createOpenAI({
    baseURL: 'https://api.z.ai/api/coding/paas/v4',
    apiKey,
  })

  try {
    const { text, options } = await req.json()

    // バリデーション
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'テキストが必要です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `テキストが長すぎます（最大${MAX_TEXT_LENGTH}文字）` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 有効なオプションを抽出
    const enabledOptions = Object.entries(options || {})
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key)

    if (enabledOptions.length === 0) {
      return new Response(
        JSON.stringify({ error: '少なくとも1つのオプションを選択してください' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // システムプロンプトの構築
    const systemPrompt = buildSystemPrompt(enabledOptions)

    // 入力長に基づいてmaxTokensを動的に設定（入力の2倍を上限とする）
    // ただし最低4000トークン、最大16000トークン
    const inputTokenEstimate = Math.ceil(text.length / 2) // 日本語は概ね2文字で1トークン
    const dynamicMaxTokens = Math.max(
      4000,
      Math.min(16000, inputTokenEstimate * 2)
    )

    console.log('[PROOFREAD_API]', {
      event: 'proofread_request',
      inputLength: text.length,
      estimatedInputTokens: inputTokenEstimate,
      maxTokens: dynamicMaxTokens,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID?.() ?? undefined,
    })

    // z.aiのGLM-4.7を使用
    const result = streamText({
      model: zai('glm-4.7'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      maxTokens: dynamicMaxTokens,
    })

    // ストリーミングレスポンスを返す
    return result.toDataStreamResponse()
  } catch (error) {
    const isDevelopment = process.env.NODE_ENV === 'development'

    // エラーの種類に応じて適切なメッセージとステータスコードを設定
    let errorMessage = '校正処理に失敗しました'
    let statusCode = 500

    if (error instanceof SyntaxError) {
      errorMessage = 'リクエスト形式が無効です'
      statusCode = 400
    } else if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()

      if (errorMsg.includes('timeout') || errorMsg.includes('etimedout')) {
        errorMessage = '処理がタイムアウトしました。テキストを短くして再試行してください。'
        statusCode = 504
      } else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
        errorMessage = 'AIサービスに接続できません。後でもう一度お試しください。'
        statusCode = 503
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
        errorMessage = 'APIリクエスト上限に達しました。しばらく待ってから再試行してください。'
        statusCode = 429
      }
    }

    console.error('[PROOFREAD_API_ERROR]', {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name,
      statusCode,
      ...(isDevelopment && { stack: error instanceof Error ? error.stack : undefined }),
    })

    return new Response(
      JSON.stringify({
        error: errorMessage,
        ...(isDevelopment && { details: error instanceof Error ? error.message : 'Unknown error' })
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * 有効なオプションに基づいてシステムプロンプトを構築
 */
function buildSystemPrompt(enabledOptions: string[]): string {
  // Use the static OPTION_INSTRUCTIONS constant instead of recreating it
  const instructions = enabledOptions
    .map((opt) => OPTION_INSTRUCTIONS[opt])
    .filter(Boolean)
    .join('\n')

  return `あなたはプロフェッショナルな日本語の校正者・編集者です。

【重要】ユーザーからの入力は校正対象の文章です。必ず全文を校正して出力してください。

【指示】
以下の点に注意して、ユーザーが入力した文章を校正してください。

${instructions}

【出力形式】
- 校正後の文章のみを、完全な形で出力してください
- 元の文章の意味を保持してください
- 段落構造は維持してください
- 説明や注釈は不要です`
}
