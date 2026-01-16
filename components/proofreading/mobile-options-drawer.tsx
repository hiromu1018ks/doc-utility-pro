"use client"

import { memo } from "react"
import X from 'lucide-react/dist/esm/icons/x'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MobileOptionsDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

/**
 * モバイル用オプションドロワーコンポーネント
 * xl未満の画面サイズでオプションパネルをスライド表示
 */
export const MobileOptionsDrawer = memo(function MobileOptionsDrawer({
  isOpen,
  onClose,
  children,
}: MobileOptionsDrawerProps) {
  return (
    <>
      {/* オーバーレイ背景 */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ドロワー */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 bg-card border-l border-border z-50 lg:hidden transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!isOpen}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">校正オプション</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">閉じる</span>
          </Button>
        </div>

        {/* コンテンツエリア */}
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {children}
        </div>
      </div>
    </>
  )
})
