"use client"

import { FileUpload } from "@/types"
import { FileCard } from "./file-card"

interface FileListProps {
  files: FileUpload[]
  onRemove?: (id: string) => void
  className?: string
}

export function FileList({ files, onRemove, className }: FileListProps) {
  if (files.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-[#374151]">
          アップロード済みファイル ({files.length})
        </p>
      </div>
      <div className="space-y-2">
        {files.map((file) => (
          <FileCard key={file.id} file={file} onRemove={onRemove} />
        ))}
      </div>
    </div>
  )
}
