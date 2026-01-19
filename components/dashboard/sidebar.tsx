"use client"

import { memo } from "react"
import Home from 'lucide-react/dist/esm/icons/home'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles'
import Files from 'lucide-react/dist/esm/icons/files'
import Scissors from 'lucide-react/dist/esm/icons/scissors'
import Type from 'lucide-react/dist/esm/icons/type'
import Archive from 'lucide-react/dist/esm/icons/archive'
import Edit3 from 'lucide-react/dist/esm/icons/edit-3'
import X from 'lucide-react/dist/esm/icons/x'
import Link from "next/link"
import { cn } from "@/lib/utils"
import { NavItem } from "@/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems: NavItem[] = [
  { label: "ホーム", href: "/dashboard", icon: "home" },
  { label: "文章校正AI", href: "/dashboard/proofreading", icon: "sparkles" },
  { label: "PDF結合", href: "/dashboard/pdf-merge", icon: "files" },
  { label: "PDF分割", href: "/dashboard/pdf-split", icon: "scissors" },
  { label: "PDFページ管理", href: "/dashboard/pdf-pages", icon: "edit3" },
  { label: "ページ番号挿入", href: "/dashboard/page-numbers", icon: "type" },
  { label: "圧縮・軽量化", href: "/dashboard/pdf-compress", icon: "archive" },
]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  sparkles: Sparkles,
  files: Files,
  scissors: Scissors,
  edit3: Edit3,
  type: Type,
  archive: Archive,
}

interface SidebarProps {
  currentPath?: string
  onClose?: () => void
}

export const Sidebar = memo(function Sidebar({ currentPath = "/", onClose }: SidebarProps) {
  // Use currentPath from props instead of calling usePathname() again
  // This prevents redundant subscriptions and improves performance
  const pathname = currentPath

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center justify-between p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Files className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">DocUtility Pro</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground lg:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const Icon = iconMap[item.icon]

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User Section */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-medium text-white">田</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">田中 太郎</p>
            <p className="text-xs text-muted-foreground truncate">tanaka@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
})
