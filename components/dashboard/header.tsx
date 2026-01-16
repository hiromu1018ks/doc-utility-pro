"use client"

import { memo } from "react"
import Search from 'lucide-react/dist/esm/icons/search'
import Bell from 'lucide-react/dist/esm/icons/bell'
import Menu from 'lucide-react/dist/esm/icons/menu'
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title?: string
  onMenuClick?: () => void
}

export const Header = memo(function Header({ title = "ダッシュボード", onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="検索..."
            className="h-9 w-64 rounded-lg border border-input bg-background pl-9 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Notification */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
          田
        </div>
      </div>
    </header>
  )
})
