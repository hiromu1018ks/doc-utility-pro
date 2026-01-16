"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import Settings from 'lucide-react/dist/esm/icons/settings'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TextInput } from "@/components/proofreading/text-input"
import { OptionsPanel } from "@/components/proofreading/options-panel"
import { DiffViewer } from "@/components/proofreading/diff-viewer"
import { StreamingIndicator } from "@/components/proofreading/streaming-indicator"
import { MobileOptionsDrawer } from "@/components/proofreading/mobile-options-drawer"
import { ProofreadingOptions, ProofreadingResult, DEFAULT_PROOFREADING_OPTIONS } from "@/types"
import { MAX_TEXT_LENGTH } from "@/lib/constants"

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

    // タイムアウト設定（サーバーのmaxDurationより少し長く設定）
    const TIMEOUT_MS = 65000 // 65秒
    const timeoutId = setTimeout(() => {
      controller.abort()
      setError('リクエストがタイムアウトしました。もう一度お試しください。')
    }, TIMEOUT_MS)

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
        signal: controller.signal,
      })

      // タイムアウトをクリア
      clearTimeout(timeoutId)

      // エラーレスポンスの安全なパース
      if (!response.ok) {
        let errorMessage = "校正処理に失敗しました"
        try {
          const contentType = response.headers.get("content-type")
          if (contentType?.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            errorMessage = `サーバーエラー (${response.status}): ${response.statusText}`
          }
        } catch (parseError) {
          console.error('[PROOFREAD_RESPONSE_PARSE_ERROR]', {
            status: response.status,
            statusText: response.statusText,
            parseError
          })
          errorMessage = `サーバーエラー (${response.status})`
        }
        throw new Error(errorMessage)
      }

      // ストリーミングレスポンスを読み込む
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("レスポンスの読み込みに失敗しました")
      }

      let accumulatedText = ""
      let buffer = ""
      let streamErrorOccurred = false
      let debugLogs: string[] = []

      const addLog = (msg: string) => {
        console.log('[STREAM_DEBUG]', msg)
        debugLogs.push(msg)
      }

      addLog('ストリーミング開始')

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            addLog(`完了: 全${accumulatedText.length}文字`)
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          addLog(`チャンク (${chunk.length}文字): "${chunk.substring(0, 200)}"`)
          buffer += chunk

          // Vercel AI SDK data stream format:
          // - f:"..." - メタデータ（開始）
          // - 0:"text" - テキストチャンク（複数がスペース区切りで来る）
          // - d:"..." - メタデータ（終了）

          // 各行は改行で区切られている
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          addLog(`${lines.length}行を処理、バッファ残り: "${buffer.substring(0, 50)}"`)

          for (const line of lines) {
            if (!line) continue

            addLog(`行解析: "${line.substring(0, 50)}..."`)

            // テキストチャンクの処理
            if (line.startsWith("0:")) {
              try {
                const colonIndex = line.indexOf(':')
                if (colonIndex === -1) continue
                const jsonValue = line.slice(colonIndex + 1)
                const parsed = JSON.parse(jsonValue)
                if (typeof parsed === 'string' && parsed.length > 0) {
                  accumulatedText += parsed
                  addLog(`✓ テキスト追加: "${parsed}" (合計${accumulatedText.length}文字)`)
                  setCorrectedText(accumulatedText)
                }
              } catch (parseError) {
                console.error('[PARSE_ERROR]', { line, error: parseError })
                streamErrorOccurred = true
              }
            }
            // メタデータは無視
            else if (line.startsWith("f:") || line.startsWith("d:")) {
              addLog(`メタデータスキップ: ${line.substring(0, 30)}`)
            }
            // エラー
            else if (line.startsWith("error:")) {
              console.error('[STREAM_ERROR]', line)
            }
          }
        }

        // バッファに残っているデータを処理
        if (buffer) {
          addLog(`バッファ処理: "${buffer}"`)
          if (buffer.startsWith("0:")) {
            try {
              const colonIndex = buffer.indexOf(':')
              const jsonValue = buffer.slice(colonIndex + 1)
              const parsed = JSON.parse(jsonValue)
              if (typeof parsed === 'string' && parsed.length > 0) {
                accumulatedText += parsed
                addLog(`✓ バッファからテキスト追加: "${parsed}"`)
                setCorrectedText(accumulatedText)
              }
            } catch (parseError) {
              console.error('[BUFFER_PARSE_ERROR]', { buffer, error: parseError })
              streamErrorOccurred = true
            }
          }
        }

        addLog(`最終結果: ${accumulatedText.length}文字`)
        addLog(`デバッグログ (${debugLogs.length}件)`)

        if (streamErrorOccurred && accumulatedText.length > 0) {
          setWarning('一部のテキストが正しく受信できませんでした。結果が不完全である可能性があります。')
        }

        if (accumulatedText.length > 0) {
          // Use transition for non-urgent UI update
          startTransition(() => setShowResult(true))
        } else {
          console.error('[EMPTY_RESULT] デバッグログ:', debugLogs)
          setError('校正結果が空です。コンソールログを確認してください。')
        }
      } catch (streamErr) {
        // ストリーム読み込みエラー
        console.error('[PROOFREAD_STREAM_READ_ERROR]', {
          error: streamErr instanceof Error ? streamErr.message : String(streamErr),
          accumulatedLength: accumulatedText.length,
          hasPartialData: accumulatedText.length > 0
        })
        if (accumulatedText.length > 0) {
          setWarning('ストリーミングが中断されました。一部の結果のみ表示されています。')
          setShowResult(true)
        } else {
          throw streamErr
        }
      }
    } catch (err) {
      // AbortErrorはサイレントに処理（ユーザーキャンセルまたはタイムアウト）
      // タイムアウトの場合は既に setError() が呼ばれているため、ここでは何もしない
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました"
      setError(errorMessage)
      console.error("[PROOFREAD_ERROR]", err)
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
      // タイムアウトをクリア（timeoutIdはスコープ外なので参照できない）
      // Note: timeoutIdはtryブロック内でクリア済み
    }
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
  }

  const handleNewProofreading = () => {
    setShowResult(false)
    setInputText("")
    setCorrectedText("")
    setError(null)
    setWarning(null)
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
          <StreamingIndicator
            isActive={isStreaming}
            progress={correctedText.length}
          />

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
              <DiffViewer
                originalText={inputText}
                correctedText={correctedText}
                changes={result?.changes || []}
              />
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
        <OptionsPanel
          options={options}
          onOptionsChange={setOptions}
          onProofread={handleProofread}
          isStreaming={isStreaming}
          result={result}
          correctedText={correctedText}
          canProofread={inputText.trim().length > 0}
        />
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
