"use client"

import { useState, useEffect, useRef, useTransition, Suspense } from "react"
import Settings from 'lucide-react/dist/esm/icons/settings'
import { cn } from "@/lib/utils"
import { TextInput } from "@/components/proofreading/text-input"
import dynamic from 'next/dynamic'
import { ProofreadingOptions, ProofreadingResult, DEFAULT_PROOFREADING_OPTIONS } from "@/types"

// Dynamic imports for better bundle splitting and code splitting
const OptionsPanel = dynamic(
  () => import('@/components/proofreading/options-panel').then(mod => ({ default: mod.OptionsPanel })),
  {
    loading: () => (
      <div className="w-80 h-full bg-muted/30 animate-pulse flex items-center justify-center">
        <div className="text-sm text-muted-foreground">読み込み中...</div>
      </div>
    ),
    ssr: false
  }
)

const DiffViewer = dynamic(
  () => import('@/components/proofreading/diff-viewer').then(mod => ({ default: mod.DiffViewer })),
  {
    loading: () => (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm animate-pulse">
        <div className="h-96 bg-muted/50 rounded" />
      </div>
    ),
    ssr: false
  }
)

const StreamingIndicator = dynamic(
  () => import('@/components/proofreading/streaming-indicator').then(mod => ({ default: mod.StreamingIndicator })),
  {
    loading: () => <div className="h-12 bg-muted/50 rounded animate-pulse" />,
    ssr: false
  }
)

const MobileOptionsDrawer = dynamic(
  () => import('@/components/proofreading/mobile-options-drawer').then(mod => ({ default: mod.MobileOptionsDrawer })),
  {
    ssr: false
  }
)

// Hoisted RegExp for better performance (created once, reused)
const WORD_SPLIT_REGEX = /\s+/

export default function ProofreadingPage() {
  const [inputText, setInputText] = useState("")
  const [options, setOptions] = useState<ProofreadingOptions>(DEFAULT_PROOFREADING_OPTIONS)
  const [correctedText, setCorrectedText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isMobileOptionsOpen, setIsMobileOptionsOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Will be used for retry UI in future enhancements
  const [retryCount, setRetryCount] = useState(0)
  const [, startTransition] = useTransition()

  // AbortController for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // 校正結果のオブジェクトを構築
  const result: ProofreadingResult | null = correctedText
    ? {
        originalText: inputText,
        correctedText: correctedText,
        changes: [], // 将来的にDiff解析を実装
        summary: {
          totalChanges: 0, // 将来的に変更数をカウント
          changesByCategory: {
            grammar: 0,
            style: 0,
            spelling: 0,
            clarity: 0,
            tone: 0,
          },
          wordCount: inputText.trim() ? inputText.trim().split(WORD_SPLIT_REGEX).length : 0,
          characterCount: inputText.length,
        },
      }
    : null

  const handleProofread = async () => {
    if (!inputText.trim()) return

    // リトライ状態をリセット
    setRetryCount(0)

    // 直ちに新しいAbortControllerを作成して割り込みを防ぐ
    const controller = new AbortController()
    const previousController = abortControllerRef.current
    abortControllerRef.current = controller

    // 前のリクエストをキャンセル
    if (previousController) {
      previousController.abort()
    }

    setIsStreaming(true)
    setCorrectedText("")
    setShowResult(false)
    setError(null)
    setWarning(null)

    // リトライ設定
    const MAX_RETRIES = 3
    const BASE_DELAY_MS = 1000 // 1秒
    const TIMEOUT_MS = 125000 // 125秒（サーバーの120秒より少し長く設定）

    // テキストチャンクをパースするヘルパー関数（重複排除）
    const parseTextChunk = (line: string, accumulator: string): string => {
      if (!line.startsWith("0:")) return accumulator
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) return accumulator
      try {
        const jsonValue = line.slice(colonIndex + 1)
        const parsed = JSON.parse(jsonValue)
        if (typeof parsed === 'string' && parsed.length > 0) {
          return accumulator + parsed
        }
      } catch {
        // パースエラーは無視
      }
      return accumulator
    }

    // リトライループ
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      setRetryCount(attempt)

      // 前の試行のAbortControllerをクリーンアップ（メモリリーク防止）
      const previousAttemptController = abortControllerRef.current
      if (previousAttemptController && previousAttemptController !== controller) {
        previousAttemptController.abort()
      }

      // この試行用のAbortControllerを作成
      const attemptController = new AbortController()
      abortControllerRef.current = attemptController

      const timeoutId = setTimeout(() => {
        attemptController.abort()
      }, TIMEOUT_MS)

      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

      try {
        const response = await fetch("/api/proofread", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: inputText,
            options,
          }),
          signal: attemptController.signal,
        })

        // エラーレスポンスの処理
        if (!response.ok) {
          // 4xxエラーはリトライしない（クライアントエラー）
          if (response.status >= 400 && response.status < 500) {
            let errorMessage = "校正処理に失敗しました"
            try {
              const contentType = response.headers.get("content-type")
              if (contentType?.includes("application/json")) {
                const errorData = await response.json()
                errorMessage = errorData.error || errorMessage
              } else {
                errorMessage = `サーバーエラー (${response.status}): ${response.statusText}`
              }
            } catch {
              errorMessage = `サーバーエラー (${response.status})`
            }
            throw new Error(errorMessage)
          }
          // 5xxエラーはリトライ可能
          throw new Error(`Server error (${response.status})`)
        }

        // ストリーミングレスポンスを読み込む
        reader = response.body?.getReader() ?? null
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("レスポンスの読み込みに失敗しました")
        }

        let accumulatedText = ""
        let buffer = ""
        // ストリームエラー追跡（将来的な拡張用）
        // eslint-disable-next-line prefer-const
        let streamErrorOccurred = false

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            // Vercel AI SDK data stream format:
            // - f:"..." - メタデータ（開始）
            // - 0:"text" - テキストチャンク（複数がスペース区切りで来る）
            // - d:"..." - メタデータ（終了）

            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (!line) continue
              accumulatedText = parseTextChunk(line, accumulatedText)
            }

            // リアルタイムでUIを更新
            setCorrectedText(accumulatedText)
          }

          // バッファに残っているデータを処理
          if (buffer) {
            accumulatedText = parseTextChunk(buffer, accumulatedText)
            setCorrectedText(accumulatedText)
          }

          // ストリーム成功時の処理
          if (accumulatedText.length > 0) {
            clearTimeout(timeoutId) // 成功時にタイマーをクリア

            // 最終試行でストリームエラーがあった場合のみ警告を表示
            if (streamErrorOccurred && attempt === MAX_RETRIES) {
              setWarning('一部のテキストが正しく受信できませんでした。結果が不完全である可能性があります。')
            }
            startTransition(() => setShowResult(true))
            return // 成功 - リトライループを終了
          } else {
            throw new Error('校正結果が空です')
          }
        } catch (streamErr) {
          // ストリーム読み込みエラー
          console.error('[PROOFREAD_STREAM_READ_ERROR]', {
            error: streamErr instanceof Error ? streamErr.message : String(streamErr),
            accumulatedLength: accumulatedText.length,
            attempt,
          })

          // 部分データがある場合、リトライ可能ならリトライを優先
          if (accumulatedText.length > 0) {
            if (attempt < MAX_RETRIES) {
              console.log(`[RETRY] ストリーム中断、リトライします (${attempt + 1}/${MAX_RETRIES})`)
              setCorrectedText("") // 次のリトライのためにテキストをリセット
              // リトライ処理へ
            } else {
              // 最終試行: 部分結果を表示
              setWarning('ストリーミングが中断されました。一部の結果のみ表示されています。')
              setShowResult(true)
              return
            }
          }
          throw streamErr
        }
      } catch (err) {
        clearTimeout(timeoutId)

        const error = err instanceof Error ? err : new Error(String(err))
        const isAbortError = error.name === 'AbortError'

        // ユーザーキャンセル（abortControllerRefがnullにセットされている）を検出
        const isUserCancelled = abortControllerRef.current === null

        if (isAbortError) {
          if (isUserCancelled) {
            // ユーザーキャンセルはサイレントに処理
            return
          }
          // タイムアウトエラー
          if (attempt < MAX_RETRIES) {
            // 指数バックオフでリトライ
            const delayMs = BASE_DELAY_MS * Math.pow(2, attempt)
            console.log(`[RETRY] タイムアウト、${delayMs}ms後にリトライします (${attempt + 1}/${MAX_RETRIES})`)
            setError(`リトライ中... (${attempt + 1}/${MAX_RETRIES}回目)`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
            setError(null)
            continue
          } else {
            setError('リクエストがタイムアウトしました。もう一度お試しください。')
            break
          }
        }

        // ネットワークエラーまたはリトライ可能なエラー
        if (isRetryableError(error) && attempt < MAX_RETRIES) {
          const delayMs = BASE_DELAY_MS * Math.pow(2, attempt)
          console.log(`[RETRY] 試行 ${attempt + 1}/${MAX_RETRIES + 1} 失敗、${delayMs}ms後にリトライします...`, {
            error: error.message
          })
          setError(`リトライ中... (${attempt + 1}/${MAX_RETRIES}回目)`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          setError(null)
          continue
        }

        // リトライ不可能またはリトライ回数超過
        setError(error.message)
        console.error("[PROOFREAD_ERROR]", err)
        break
      } finally {
        // Stream readerをクリーンアップ
        if (reader) {
          try {
            reader.cancel()
          } catch {
            // クリーンアップエラーは無視
          }
        }
      }
    }

    setIsStreaming(false)
    abortControllerRef.current = null
  }

  // リトライ可能なエラーか判定
  function isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return /network|timeout|connection|econnreset|etimedout|server error/i.test(message)
  }

  const handleClear = () => {
    const controller = abortControllerRef.current
    abortControllerRef.current = null
    if (controller) {
      controller.abort()
    }
    setInputText("")
    setCorrectedText("")
    setShowResult(false)
    setError(null)
    setWarning(null)
    setRetryCount(0)
  }

  const handleNewProofreading = () => {
    setShowResult(false)
    setInputText("")
    setCorrectedText("")
    setError(null)
    setWarning(null)
    setRetryCount(0)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* メインコンテンツエリア */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* ページタイトル */}
          <div>
            <h2 className="text-lg font-bold text-foreground">
              AI文章校正
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              GLM-4.7 AIを使用して文章を校正・改善します
            </p>
          </div>

          {/* ストリーミングインジケーター */}
          <Suspense fallback={<div className="h-12 bg-muted/50 rounded animate-pulse" />}>
            <StreamingIndicator
              isActive={isStreaming}
              progress={correctedText.length}
            />
          </Suspense>

          {/* 警告表示 */}
          {warning && (
            <div className="rounded-lg bg-status-warning-bg p-4 border border-status-warning-border">
              <p className="text-sm text-status-warning-text">{warning}</p>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 結果表示エリア（校正完了時） */}
          {showResult && correctedText && (
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  校正結果
                </h3>
                <button
                  onClick={handleNewProofreading}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  新しい校正
                </button>
              </div>
              <Suspense fallback={<div className="h-96 bg-muted/50 rounded animate-pulse" />}>
                <DiffViewer
                  originalText={inputText}
                  correctedText={correctedText}
                  changes={result?.changes || []}
                />
              </Suspense>
            </div>
          )}

          {/* テキスト入力エリア */}
          <div className={cn(
            "rounded-lg border border-border bg-card p-4 shadow-sm",
            showResult && correctedText && "hidden"
          )}>
            <TextInput
              value={inputText}
              onChange={setInputText}
              onClear={handleClear}
              disabled={isStreaming}
            />
          </div>
        </div>
      </div>

      {/* 右パネル - オプション（デスクトップ） */}
      <div className="hidden w-80 border-l border-border bg-muted/30 xl:block">
        <Suspense fallback={<div className="w-80 h-full bg-muted/30 animate-pulse flex items-center justify-center"><div className="text-sm text-muted-foreground">読み込み中...</div></div>}>
          <OptionsPanel
            options={options}
            onOptionsChange={setOptions}
            onProofread={handleProofread}
            isStreaming={isStreaming}
            result={result}
            correctedText={correctedText}
            canProofread={inputText.trim().length > 0}
          />
        </Suspense>
      </div>

      {/* モバイル用オプションドロワー */}
      <MobileOptionsDrawer
        isOpen={isMobileOptionsOpen}
        onClose={() => setIsMobileOptionsOpen(false)}
      >
        <OptionsPanel
          options={options}
          onOptionsChange={setOptions}
          onProofread={handleProofread}
          isStreaming={isStreaming}
          result={result}
          correctedText={correctedText}
          canProofread={inputText.trim().length > 0}
        />
      </MobileOptionsDrawer>

      {/* モバイル用FAB（Floating Action Button） */}
      <button
        className="xl:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
        onClick={() => setIsMobileOptionsOpen(true)}
        aria-label="校正オプションを開く"
      >
        <Settings className="h-6 w-6" />
      </button>
    </div>
  )
}
