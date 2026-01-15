"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ProofreadingOptions, ProofreadingResult, ProofreadingOption, PROOFREADING_OPTIONS } from "@/types"
import { Loader2, Copy, CheckCircle2, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface OptionsPanelProps {
  options: ProofreadingOptions
  onOptionsChange: (options: ProofreadingOptions) => void
  onProofread: () => void
  isStreaming: boolean
  result: ProofreadingResult | null
  correctedText: string
  canProofread: boolean
}

export function OptionsPanel({
  options,
  onOptionsChange,
  onProofread,
  isStreaming,
  result,
  correctedText,
  canProofread,
}: OptionsPanelProps) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleToggle = (key: keyof ProofreadingOptions) => {
    onOptionsChange({ ...options, [key]: !options[key] })
  }

  const hasEnabledOptions = Object.values(options).some(Boolean)

  const handleCopy = async () => {
    if (!correctedText) return

    // Clear existing timeout and error
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setCopyError(null)

    try {
      // モダンブラウザ用Clipboard API
      await navigator.clipboard.writeText(correctedText)
      setCopied(true)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // フォールバック: 非HTTPS環境や古いブラウザ向け
      console.warn('Clipboard API failed, using fallback:', err)
      try {
        const textArea = document.createElement('textarea')
        textArea.value = correctedText
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)

        if (successful) {
          setCopied(true)
          timeoutRef.current = setTimeout(() => setCopied(false), 2000)
        } else {
          throw new Error('Fallback copy failed')
        }
      } catch (fallbackErr) {
        console.error('All copy methods failed:', fallbackErr)
        // ユーザーにエラーを通知
        setCopyError('コピーに失敗しました。手動でコピーしてください。')
        timeoutRef.current = setTimeout(() => setCopyError(null), 3000)
      }
    }
  }

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">校正オプション</h2>
      </div>

      <Separator />

      {/* コピー失敗時のエラー通知 */}
      {copyError && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{copyError}</p>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* 文法チェック */}
        <div className="flex items-center justify-between group">
          <div className="space-y-0.5">
            <Label htmlFor="grammar" className="text-sm text-foreground cursor-pointer group-hover:text-primary transition-colors">
              文法チェック
            </Label>
            <p className="text-xs text-muted-foreground">
              文法的な間違いを検出・修正
            </p>
          </div>
          <Switch
            id="grammar"
            checked={options.grammar}
            onClick={() => handleToggle("grammar")}
          />
        </div>

        {/* 文体チェック */}
        <div className="flex items-center justify-between group">
          <div className="space-y-0.5">
            <Label htmlFor="style" className="text-sm text-foreground cursor-pointer group-hover:text-primary transition-colors">
              文体・スタイル
            </Label>
            <p className="text-xs text-muted-foreground">
              文体の一貫性と表現を改善
            </p>
          </div>
          <Switch
            id="style"
            checked={options.style}
            onClick={() => handleToggle("style")}
          />
        </div>

        {/* タイプミス・表記 */}
        <div className="flex items-center justify-between group">
          <div className="space-y-0.5">
            <Label htmlFor="spelling" className="text-sm text-foreground cursor-pointer group-hover:text-primary transition-colors">
              タイプミス・表記
            </Label>
            <p className="text-xs text-muted-foreground">
              タイプミスや表記揺れを修正
            </p>
          </div>
          <Switch
            id="spelling"
            checked={options.spelling}
            onClick={() => handleToggle("spelling")}
          />
        </div>

        {/* 明確性 */}
        <div className="flex items-center justify-between group">
          <div className="space-y-0.5">
            <Label htmlFor="clarity" className="text-sm text-foreground cursor-pointer group-hover:text-primary transition-colors">
              明確性
            </Label>
            <p className="text-xs text-muted-foreground">
              文章をより明確にする提案
            </p>
          </div>
          <Switch
            id="clarity"
            checked={options.clarity}
            onClick={() => handleToggle("clarity")}
          />
        </div>

        {/* トーン調整 */}
        <div className="flex items-center justify-between group">
          <div className="space-y-0.5">
            <Label htmlFor="tone" className="text-sm text-foreground cursor-pointer group-hover:text-primary transition-colors">
              トーン調整
            </Label>
            <p className="text-xs text-muted-foreground">
              適切なトーンに調整
            </p>
          </div>
          <Switch
            id="tone"
            checked={options.tone}
            onClick={() => handleToggle("tone")}
          />
        </div>

        {/* 統計情報（結果がある場合） */}
        {result && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">統計情報</h3>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-foreground">
                  {result.summary.totalChanges}件の変更
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-card p-3 border border-border">
                  <span className="text-muted-foreground">単語数</span>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {result.summary.wordCount.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-card p-3 border border-border">
                  <span className="text-muted-foreground">文字数</span>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {result.summary.characterCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* カテゴリ別の変更数 */}
              {PROOFREADING_OPTIONS.some(
                (option) => result.summary.changesByCategory[option] > 0
              ) && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">カテゴリ別</span>
                  {PROOFREADING_OPTIONS.map(
                    (category) =>
                      result.summary.changesByCategory[category] > 0 && (
                        <div
                          key={category}
                          className="flex items-center justify-between rounded-lg bg-card px-3 py-2 border border-border"
                        >
                          <span className="text-xs text-foreground">
                            {getCategoryLabel(category)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {result.summary.changesByCategory[category]}件
                          </Badge>
                        </div>
                      )
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* アクションボタン */}
      <div className="space-y-2 p-4">
        {correctedText && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCopy}
            disabled={isStreaming}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                コピーしました
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                校正結果をコピー
              </>
            )}
          </Button>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={onProofread}
          disabled={!canProofread || !hasEnabledOptions || isStreaming}
        >
          {isStreaming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              校正中...
            </>
          ) : (
            "校正する"
          )}
        </Button>
      </div>
    </div>
  )
}

function getCategoryLabel(category: ProofreadingOption): string {
  const labels: Record<ProofreadingOption, string> = {
    grammar: "文法",
    style: "文体",
    spelling: "表記",
    clarity: "明確性",
    tone: "トーン",
  }
  return labels[category]
}
