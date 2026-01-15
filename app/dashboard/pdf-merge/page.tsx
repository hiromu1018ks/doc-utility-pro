"use client"

import { useState } from "react"
import { FileUpload } from "@/types"
import { UploadArea } from "@/components/pdf-merge/upload-area"
import { FileList } from "@/components/pdf-merge/file-list"
import { OutputOptions } from "@/components/pdf-merge/output-options"

export default function PDFMergePage() {
  const [files, setFiles] = useState<FileUpload[]>([])

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id))
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Page Title */}
          <div>
            <h2 className="text-lg font-bold text-[#1f2937]">
              PDFファイルの結合 - ワークスペース
            </h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              複数のPDFファイルを1つに結合できます
            </p>
          </div>

          {/* Upload Area */}
          <UploadArea />

          {/* File List */}
          <FileList files={files} onRemove={handleRemoveFile} />
        </div>
      </div>

      {/* Right Panel - Output Options */}
      <div className="hidden w-80 border-l border-[#e5e7eb] xl:block">
        <OutputOptions />
      </div>
    </div>
  )
}
