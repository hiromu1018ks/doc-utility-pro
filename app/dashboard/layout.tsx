"use client"

import { useState, useMemo, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ToastContainer, Toast } from "@/components/ui/toast"
import { useNotifications } from "@/hooks/use-notifications"
import { usePathname } from "next/navigation"

// Page title mapping moved outside component for better performance
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "ダッシュボード",
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return PAGE_TITLES[pathname]
  if (pathname?.includes("pdf-merge")) return "PDFファイルの結合 - ワークスペース"
  if (pathname?.includes("pdf-split")) return "PDF分割"
  if (pathname?.includes("pdf-pages")) return "PDFページ管理"
  if (pathname?.includes("proofreading")) return "文章校正AI"
  if (pathname?.includes("page-numbers")) return "ページ番号挿入"
  if (pathname?.includes("compress")) return "圧縮・軽量化"
  return "ダッシュボード"
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const [{ notifications }, { dismiss }] = useNotifications()

  // Memoize title calculation to avoid recreation on every render
  const title = useMemo(() => getPageTitle(pathname || "/"), [pathname])

  // Memoize handlers to prevent unnecessary re-renders of child components
  const handleMenuClick = useCallback(() => setSidebarOpen(true), [])
  const handleSidebarClose = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar currentPath={pathname || "/"} />
      </div>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={handleSidebarClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar
              currentPath={pathname || "/"}
              onClose={handleSidebarClose}
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} onMenuClick={handleMenuClick} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Notification Container */}
      <ToastContainer>
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            onDismiss={dismiss}
          />
        ))}
      </ToastContainer>
    </div>
  )
}
