"use client"

import { useState } from "react"
import { Download, Copy, Check, FileText, FileAudio, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { TranscriptionResult } from "@/types"

interface TranscriptionResultProps {
  result: TranscriptionResult
  onReset: () => void
  className?: string
}

export function TranscriptionResult({ result, onReset, className }: TranscriptionResultProps) {
  const [activeTab, setActiveTab] = useState<"transcript" | "minutes">("minutes")
  const [copied, setCopied] = useState<"transcript" | "minutes" | null>(null)

  const handleCopy = async (text: string, type: "transcript" | "minutes") => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    // ダウンロード開始を待ってからURLを解放
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const handleDownloadMarkdown = () => {
    const content = `# ${result.fileName} - 議事録

生成日時: ${new Date(result.timestamp).toLocaleString("ja-JP")}

---

## 文字起こし

${result.transcript}

---

## 議事録

${result.minutes}
`
    handleDownload(content, `${result.fileName}-議事録.md`)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 完了通知 */}
      <div className="flex items-center gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-green-50">
          <Check className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            処理が完了しました
          </p>
          <p className="text-xs text-muted-foreground">
            文字起こしと議事録の生成が正常に完了しました
          </p>
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("transcript")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "transcript"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileAudio className="h-4 w-4" />
          文字起こし
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("minutes")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "minutes"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          議事録
        </button>
      </div>

      {/* コンテンツエリア */}
      <div className="space-y-4">
        {/* アクションボタン */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(
              activeTab === "transcript" ? result.transcript : result.minutes,
              activeTab
            )}
          >
            {copied === activeTab ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                コピー済み
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                コピー
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(
              activeTab === "transcript" ? result.transcript : result.minutes,
              activeTab === "transcript" ? `${result.fileName}-文字起こし.txt` : `${result.fileName}-議事録.txt`
            )}
          >
            <Download className="h-4 w-4 mr-2" />
            ダウンロード
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadMarkdown}
          >
            <Download className="h-4 w-4 mr-2" />
            Markdownでダウンロード
          </Button>
        </div>

        {/* テキスト表示エリア */}
        <div className="rounded-lg border border-border bg-muted/30 p-6">
          <textarea
            readOnly
            value={activeTab === "transcript" ? result.transcript : result.minutes}
            className={cn(
              "w-full min-h-[400px] resize-y rounded-md border-0 bg-transparent p-0",
              "text-sm leading-relaxed text-foreground",
              "focus:outline-none focus:ring-0",
              "whitespace-pre-wrap break-words"
            )}
          />
        </div>

        {/* 新しい処理ボタン */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={onReset}
            variant="outline"
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            別のファイルを処理する
          </Button>
        </div>
      </div>
    </div>
  )
}
