"use client"

import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadAreaProps {
  className?: string
}

export function UploadArea({ className }: UploadAreaProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] p-8 text-center transition-colors hover:border-primary/50 hover:bg-blue-50/30",
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white">
        <Upload className="h-6 w-6 text-[#9ca3af]" />
      </div>
      <p className="text-sm font-medium text-[#374151]">
        ここにファイルをドラッグ&ドロップ、またはクリックして選択
      </p>
      <p className="mt-1 text-xs text-[#9ca3af]">PDF、DOCXファイル（最大50MB）</p>
    </div>
  )
}
