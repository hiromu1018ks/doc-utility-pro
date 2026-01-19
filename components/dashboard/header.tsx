"use client"

import { memo, useState } from "react"
import Search from 'lucide-react/dist/esm/icons/search'
import Bell from 'lucide-react/dist/esm/icons/bell'
import Menu from 'lucide-react/dist/esm/icons/menu'
import LogOut from 'lucide-react/dist/esm/icons/log-out'
import { Button } from "@/components/ui/button"
import { useSession } from "@/hooks/use-session"

interface HeaderProps {
  title?: string
  onMenuClick?: () => void
}

export const Header = memo(function Header({ title = "ダッシュボード", onMenuClick }: HeaderProps) {
  const { session } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false)
    }
  }

  const userInitial = session?.user?.name?.charAt(0) || 'U'

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

        {/* User Info */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {session?.user?.name || '読み込み中...'}
            </p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.email || ''}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {userInitial}
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="ログアウト"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
})
