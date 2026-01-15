"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MAX_TEXT_LENGTH } from "@/lib/constants"

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  disabled?: boolean
}

export function TextInput({
  value,
  onChange,
  onClear,
  disabled = false,
}: TextInputProps) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0
  const charCount = value.length
  const percentage = (charCount / MAX_TEXT_LENGTH) * 100

  // 使用量に応じて色を変更
  const progressColor =
    percentage > 90 ? "bg-destructive" :
    percentage > 75 ? "bg-yellow-500" :
    "bg-primary"

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= MAX_TEXT_LENGTH) {
      onChange(newValue)
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        maxLength={MAX_TEXT_LENGTH}
        placeholder="ここに校正したいテキストを入力してください..."
        className={cn(
          "min-h-[400px] resize-none transition-all",
          disabled && "opacity-50",
          percentage > 90 && "focus-visible:ring-destructive"
        )}
      />

      {/* 文字数プログレスバー */}
      <div className="space-y-2">
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute left-0 top-0 h-full transition-all duration-300",
              progressColor
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{charCount.toLocaleString()} 文字</span>
            <span>{wordCount.toLocaleString()} 単語</span>
            <span className={cn(
              percentage > 90 && "text-destructive font-medium"
            )}>
              {MAX_TEXT_LENGTH - charCount} 残り
            </span>
          </div>

          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={disabled}
              className="text-xs"
            >
              クリア
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
