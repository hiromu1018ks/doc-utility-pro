"use client"

/**
 * テーマ切り替えボタン
 *
 * ライトモード/ダークモードを切り替えるアイコンボタン
 */

import { memo } from 'react'
import Sun from 'lucide-react/dist/esm/icons/sun'
import Moon from 'lucide-react/dist/esm/icons/moon'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

export interface ThemeToggleProps {
  /** className */
  className?: string
}

export const ThemeToggle = memo(function ThemeToggle({ className }: ThemeToggleProps) {
  const [{ theme, appliedTheme, isInitialized }, { setTheme }] = useTheme()

  // 初期化前はレンダリングをスキップ（ハイドレーション不一致回避）
  if (!isInitialized) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label="テーマ切り替え"
      >
        <Moon className="h-5 w-5" />
      </Button>
    )
  }

  // 現在のテーマに応じたアイコンとラベル
  const isDark = appliedTheme === 'dark'
  const Icon = isDark ? Sun : Moon
  const label = isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'
  const nextTheme = isDark ? 'light' : 'dark'

  const handleClick = () => {
    setTheme(nextTheme)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5 transition-transform duration-200 ease-out" />
    </Button>
  )
})
