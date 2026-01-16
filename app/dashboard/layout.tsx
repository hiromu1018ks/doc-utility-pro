"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { usePathname } from "next/navigation"

// Page title mapping moved outside component for better performance
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "ダッシュボード",
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return PAGE_TITLES[pathname]
  if (pathname?.includes("pdf-merge")) return "PDFファイルの結合 - ワークスペース"
  if (pathname?.includes("pdf-split")) return "PDF分割"
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

  // Memoize title calculation to avoid recreation on every render
  const title = useMemo(() => getPageTitle(pathname || "/"), [pathname])

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
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar
              currentPath={pathname || "/"}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
