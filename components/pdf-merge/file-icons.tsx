import { memo } from 'react'
import FileText from 'lucide-react/dist/esm/icons/file-text'
import File from 'lucide-react/dist/esm/icons/file'

/**
 * Fully static icon components for file types
 *
 * Using memo() with no props ensures these components:
 * 1. Never re-render (no props = no reason to update)
 * 2. Are skipped entirely during React's diff algorithm
 * 3. Can be shared across all FileCard instances without recreation
 */
export const PdfIcon = memo(function PdfIcon() {
  return <FileText className="h-5 w-5 text-error" />
})

export const DocxIcon = memo(function DocxIcon() {
  return <File className="h-5 w-5 text-info" />
})

export const DefaultFileIcon = memo(function DefaultFileIcon() {
  return <FileText className="h-5 w-5 text-muted-foreground" />
})
