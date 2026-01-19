/**
 * 圧縮オプションパネルコンポーネント
 * 圧縮プリセット選択と詳細オプション設定を提供するサイドバーUI
 */

'use client'

import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { PdfCompressionOptions, CompressionResult, CompressionPreset } from '@/types'
import { COMPRESSION_PRESET_LABELS } from '@/types'
import Archive from 'lucide-react/dist/esm/icons/archive'
import Gauge from 'lucide-react/dist/esm/icons/gauge'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles'
import FileWarning from 'lucide-react/dist/esm/icons/file-warning'
import Loader2 from 'lucide-react/dist/esm/icons/loader-2'
import Download from 'lucide-react/dist/esm/icons/download'
import FileText from 'lucide-react/dist/esm/icons/file-text'

interface CompressionOptionsProps {
  options: PdfCompressionOptions
  onOptionsChange: (options: PdfCompressionOptions) => void
  onCompress: () => void
  onDownload?: () => void
  disabled?: boolean
  isProcessing?: boolean
  compressionResult?: CompressionResult | null
}

type CompressionSwitchOption = 'removeMetadata' | 'removeAnnotations'

/** プリセット情報（UI表示用） */
const PRESET_INFO: Array<{
  id: CompressionPreset
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    id: 'high',
    description: '画質を優先、メタデータ削除のみ',
    icon: Sparkles,
  },
  {
    id: 'medium',
    description: '画質とファイルサイズのバランス',
    icon: Gauge,
  },
  {
    id: 'low',
    description: 'ファイルサイズ優先、画質は犠牲',
    icon: FileWarning,
  },
]

export function CompressionOptions({
  options,
  onOptionsChange,
  onCompress,
  onDownload,
  disabled = false,
  isProcessing = false,
  compressionResult,
}: CompressionOptionsProps) {
  // プリセットを変更
  const handlePresetChange = (preset: CompressionPreset) => {
    onOptionsChange({ ...options, preset })
  }

  // スイッチオプションを変更
  const handleSwitchChange = (key: CompressionSwitchOption) => () => {
    onOptionsChange({ ...options, [key]: !options[key] })
  }

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">圧縮オプション</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          圧縮レベルとオプションを設定
        </p>
      </div>

      {/* オプション内容 */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* 圧縮レベル選択 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">圧縮レベル</Label>
          <div className="space-y-2">
            {PRESET_INFO.map(preset => {
              const Icon = preset.icon
              const isSelected = options.preset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetChange(preset.id)}
                  disabled={disabled}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    'hover:bg-accent/50',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {COMPRESSION_PRESET_LABELS[preset.id]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {preset.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 詳細オプション */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">詳細オプション</Label>

          {/* メタデータ削除 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="removeMetadata" className="text-sm font-normal cursor-pointer">
                メタデータを削除
              </Label>
              <p className="text-xs text-muted-foreground">
                作成者、タイトルなどの情報を削除
              </p>
            </div>
            <Switch
              id="removeMetadata"
              checked={options.removeMetadata}
              onClick={handleSwitchChange('removeMetadata')}
              disabled={disabled}
            />
          </div>

          {/* 注釈削除 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="removeAnnotations" className="text-sm font-normal cursor-pointer">
                注釈を削除
              </Label>
              <p className="text-xs text-muted-foreground">
                コメント、注釈などを削除
              </p>
            </div>
            <Switch
              id="removeAnnotations"
              checked={options.removeAnnotations}
              onClick={handleSwitchChange('removeAnnotations')}
              disabled={disabled}
            />
          </div>
        </div>

        {/* 圧縮結果のサマリー */}
        {compressionResult && (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <FileText className="h-4 w-4" />
              圧縮完了
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">元のサイズ</p>
                <p className="text-sm font-medium">
                  {(compressionResult.originalSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">圧縮後</p>
                <p className="text-sm font-medium">
                  {(compressionResult.compressedSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">削減率</p>
                <p className="text-sm font-medium text-green-600">
                  {compressionResult.reductionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="border-t border-border p-4 space-y-2">
        {compressionResult && onDownload ? (
          <Button
            onClick={onDownload}
            className="w-full"
            size="default"
          >
            <Download className="h-4 w-4 mr-2" />
            ダウンロード
          </Button>
        ) : (
          <Button
            onClick={onCompress}
            disabled={disabled || isProcessing}
            className="w-full"
            size="default"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                圧縮中...
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                圧縮する
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
