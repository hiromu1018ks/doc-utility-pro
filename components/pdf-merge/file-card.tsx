"use client"

import { FileText, File, X, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileUpload } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface FileCardProps {
  file: FileUpload
  onRemove?: (id: string) => void
  className?: string
}

export function FileCard({ file, onRemove, className }: FileCardProps) {
  const getFileIcon = () => {
    switch (file.type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />
      case "docx":
        return <File className="h-5 w-5 text-blue-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm",
        className
      )}
    >
      {/* Drag Handle */}
      <div className="cursor-grab text-gray-400">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="9" cy="6" r="1.5" fill="currentColor" />
          <circle cx="15" cy="6" r="1.5" fill="currentColor" />
          <circle cx="9" cy="12" r="1.5" fill="currentColor" />
          <circle cx="15" cy="12" r="1.5" fill="currentColor" />
          <circle cx="9" cy="18" r="1.5" fill="currentColor" />
          <circle cx="15" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {/* File Icon */}
      {getFileIcon()}

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#111827] truncate">
          {file.name}
        </p>
        <p className="text-xs text-[#9ca3af]">{file.size}</p>
      </div>

      {/* Pages Badge */}
      {file.pages && (
        <Badge variant="secondary" className="shrink-0">
          {file.pages}ページ
        </Badge>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-red-500"
          onClick={() => onRemove?.(file.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
