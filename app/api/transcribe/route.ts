import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { checkRateLimit } from "@/lib/rate-limit"
import { MEETING_MINUTES_TEMPLATES, AUDIO_TRANSCRIPTION_CONSTANTS } from "@/lib/constants"
import { auth } from "@/lib/auth"

// タイムアウトを延長（音声処理は時間がかかるため）
export const maxDuration = 300

/**
 * 音声文字起こし＆議事録生成API
 * POST /api/transcribe
 */
export async function POST(req: NextRequest) {
  // セッションチェック
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json(
      { error: "認証が必要です" },
      { status: 401 }
    )
  }

  // レート制限チェック
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
             req.headers.get("x-real-ip") ||
             "unknown"

  if (checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "リクエスト数が制限を超えました。しばらく待ってから再試行してください。" },
      { status: 429 }
    )
  }

  // APIキーの検証
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "サーバー設定エラー: APIキーが設定されていません" },
      { status: 500 }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const templateId = formData.get("templateId") as string || "standard"

    // バリデーション
    if (!file) {
      return NextResponse.json(
        { error: "ファイルが必要です" },
        { status: 400 }
      )
    }

    // ファイルサイズチェック
    if (file.size > AUDIO_TRANSCRIPTION_CONSTANTS.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `ファイルサイズが大きすぎます（最大${AUDIO_TRANSCRIPTION_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB）` },
        { status: 400 }
      )
    }

    // ファイルタイプチェック
    const allowedTypes: readonly string[] = AUDIO_TRANSCRIPTION_CONSTANTS.ALLOWED_TYPES
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "対応していないファイル形式です（MP3/WAV/AAC/FLAC/M4A）" },
        { status: 400 }
      )
    }

    // テンプレートの取得
    const template = MEETING_MINUTES_TEMPLATES[templateId] || MEETING_MINUTES_TEMPLATES.standard

    // Geminiクライアントの初期化
    const genAI = new GoogleGenerativeAI(apiKey)

    // ファイルをBase64に変換
    const arrayBuffer = await file.arrayBuffer()
    const base64Audio = Buffer.from(arrayBuffer).toString("base64")

    // 文字起こし（Gemini 2.5 Flash）
    const flashModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const transcriptionPrompt = `この音声を日本語で文字起こしてください。
・話者区分は不要です
・テキストのみを出力してください
・句読点を適切に含めてください`

    const transcriptionResult = await flashModel.generateContent([
      {
        inlineData: {
          mimeType: file.type,
          data: base64Audio,
        },
      },
      transcriptionPrompt,
    ])

    const transcription = transcriptionResult.response.text().trim()

    if (!transcription) {
      return NextResponse.json(
        { error: "文字起こしに失敗しました" },
        { status: 500 }
      )
    }

    // 議事録生成（Gemini 2.5 Pro）
    const proModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })

    const minutesPrompt = `${template.prompt}

以下の文字起こしから議事録を作成してください：

${transcription}`

    const minutesResult = await proModel.generateContent(minutesPrompt)
    const meetingMinutes = minutesResult.response.text().trim()

    // レスポンスを返す
    return NextResponse.json({
      transcription,
      meetingMinutes,
      fileName: file.name,
      templateId,
      timestamp: Date.now(),
    })

  } catch (error) {
    console.error("[TRANSCRIPTION_API_ERROR]", {
      message: error instanceof Error ? error.message : "Unknown error",
      type: error?.constructor?.name,
    })

    let errorMessage = "処理に失敗しました"
    let statusCode = 500

    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()

      if (errorMsg.includes("timeout") || errorMsg.includes("etimedout")) {
        errorMessage = "処理がタイムアウトしました。ファイルサイズを小さくして再試行してください。"
        statusCode = 504
      } else if (errorMsg.includes("fetch") || errorMsg.includes("network")) {
        errorMessage = "AIサービスに接続できません。後でもう一度お試しください。"
        statusCode = 503
      } else if (errorMsg.includes("quota") || errorMsg.includes("limit")) {
        errorMessage = "APIリクエスト上限に達しました。しばらく待ってから再試行してください。"
        statusCode = 429
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
