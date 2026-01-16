"use client"

import Upload from 'lucide-react/dist/esm/icons/upload'
import { cn } from "@/lib/utils"

interface UploadAreaProps {
  className?: string
}

export function UploadArea({ className }: UploadAreaProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted",
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-card">
        <Upload className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">
        ここにファイルをドラッグ&ドロップ、またはクリックして選択
      </p>
      <p className="mt-1 text-xs text-muted-foreground">PDF、DOCXファイル（最大50MB）</p>
    </div>
  )
}
