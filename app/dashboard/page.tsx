"use client"

import FileText from 'lucide-react/dist/esm/icons/file-text'
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle'
import Layout from 'lucide-react/dist/esm/icons/layout'
import HardDrive from 'lucide-react/dist/esm/icons/hard-drive'
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const stats = [
  { label: "総ドキュメント", value: "128", icon: FileText, color: "text-blue-500" },
  { label: "処理済み", value: "96", icon: CheckCircle, color: "text-green-500" },
  { label: "テンプレート", value: "12", icon: Layout, color: "text-purple-500" },
  { label: "ストレージ使用量", value: "2.4 GB", icon: HardDrive, color: "text-orange-500" },
]

const tools = [
  {
    title: "PDF結合",
    description: "複数のPDFファイルを1つに結合",
    href: "/dashboard/pdf-merge",
    icon: FileText,
    color: "bg-blue-500",
  },
  {
    title: "PDF分割",
    description: "PDFファイルを複数に分割",
    href: "/dashboard/pdf-split",
    icon: Layout,
    color: "bg-purple-500",
  },
  {
    title: "文章校正AI",
    description: "AIによる文書チェック・修正",
    href: "/dashboard/proofreading",
    icon: CheckCircle,
    color: "bg-green-500",
  },
  {
    title: "圧縮・軽量化",
    description: "ファイルサイズを最適化",
    href: "/dashboard/compress",
    icon: HardDrive,
    color: "bg-orange-500",
  },
]

const recentFiles = [
  {
    id: "1",
    name: "2024年度_事業計画書.pdf",
    action: "結合",
    time: "2時間前",
    status: "completed" as const,
  },
  {
    id: "2",
    name: "会議議事録_10月.docx",
    action: "校正",
    time: "5時間前",
    status: "completed" as const,
  },
  {
    id: "3",
    name: "製品マニュアル.pdf",
    action: "分割",
    time: "1日前",
    status: "completed" as const,
  },
  {
    id: "4",
    name: "請求書_2024Q4.pdf",
    action: "結合",
    time: "2日前",
    status: "failed" as const,
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          おかえりなさい、田中さん
        </h2>
        <p className="mt-1 text-muted-foreground">
          本日のドキュメント処理状況を確認してください
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg bg-muted p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Tools */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          クイックアクセス
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link key={tool.href} href={tool.href}>
                <Card className="group cursor-pointer transition-all hover:shadow-md h-full">
                  <CardContent className="p-6">
                    <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${tool.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-foreground">{tool.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 -ml-2 h-8 text-primary"
                    >
                      開く
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              最近のアクティビティ
            </h3>
            <Button variant="ghost" size="sm">
              すべて表示
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.action}・{file.time}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={file.status === "completed" ? "default" : "destructive"}
                >
                  {file.status === "completed" ? "完了" : "失敗"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
