"use client"

import { FileText, Minimize } from "lucide-react"
import { cn } from "@/lib/utils"
import { MEETING_MINUTES_TEMPLATES } from "@/lib/constants"

interface TemplateSelectorProps {
  selectedTemplateId: string
  onTemplateChange: (templateId: string) => void
  disabled?: boolean
  className?: string
}

export function TemplateSelector({
  selectedTemplateId,
  onTemplateChange,
  disabled = false,
  className,
}: TemplateSelectorProps) {
  const templates = Object.values(MEETING_MINUTES_TEMPLATES)

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-medium text-foreground">議事録テンプレート</h3>
        <p className="text-xs text-muted-foreground mt-1">
          音声認識後に生成する議事録の形式を選択してください
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {templates.map((template) => {
          const isSelected = template.id === selectedTemplateId

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => !disabled && onTemplateChange(template.id)}
              disabled={disabled}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/30",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {isSelected ? (
                  <FileText className="h-5 w-5" />
                ) : (
                  <Minimize className="h-5 w-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {template.name}
                  </p>
                  {isSelected && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                      選択中
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {template.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* テンプレートのプレビュー */}
      {selectedTemplateId && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium text-foreground mb-2">選択されたテンプレートの構成</p>
          <div className="text-xs text-muted-foreground space-y-1">
            {selectedTemplateId === "standard" && (
              <>
                <p>・会議概要（日時、参加者）</p>
                <p>・議事の要約</p>
                <p>・主要な議論内容</p>
                <p>・決定事項</p>
                <p>・次回のアクション</p>
              </>
            )}
            {selectedTemplateId === "concise" && (
              <>
                <p>・全体の要約</p>
                <p>・決定事項</p>
                <p>・アクションアイテム</p>
              </>
            )}
            {selectedTemplateId === "detailed" && (
              <>
                <p>・会議情報</p>
                <p>・議事録（発言者ごとの詳細な記録）</p>
                <p>・決定事項</p>
                <p>・次回のアクション（担当者付き）</p>
              </>
            )}
            {selectedTemplateId === "brainstorming" && (
              <>
                <p>・セッション概要</p>
                <p>・出されたアイデア（カテゴリー別）</p>
                <p>・評価・選定結果</p>
                <p>・次回のステップ</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
