"use client"

import FileText from 'lucide-react/dist/esm/icons/file-text'
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle'
import Layout from 'lucide-react/dist/esm/icons/layout'
import HardDrive from 'lucide-react/dist/esm/icons/hard-drive'
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right'
import Clock from 'lucide-react/dist/esm/icons/clock'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useSession } from "@/hooks/use-session"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { formatBytes } from "@/lib/storage"

// クイックアクセスツール（静的定義）
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
    href: "/dashboard/pdf-compress",
    icon: HardDrive,
    color: "bg-orange-500",
  },
]

export default function DashboardPage() {
  const { session } = useSession()
  const [{ stats, recentActivities, isLoading }] = useDashboardData()
  const userName = session?.user?.name || 'ユーザー'

  // 統計カードを動的に生成
  const statsCards = [
    {
      label: "総ドキュメント",
      value: stats.totalDocuments.toString(),
      icon: FileText,
      color: "text-blue-500",
    },
    {
      label: "処理済み",
      value: stats.processedCount.toString(),
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      label: "失敗",
      value: stats.failedCount.toString(),
      icon: Clock,
      color: "text-red-500",
    },
    {
      label: "ストレージ使用量",
      value: formatBytes(stats.totalStorageUsed),
      icon: HardDrive,
      color: "text-orange-500",
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          おかえりなさい、{userName}さん
        </h2>
        <p className="mt-1 text-muted-foreground">
          本日のドキュメント処理状況を確認してください
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
            >
              更新
              <Clock className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">読み込み中...</div>
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {activity.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.action}・{activity.time}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={activity.status === "completed" ? "default" : "destructive"}
                  >
                    {activity.status === "completed" ? "完了" : "失敗"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>まだアクティビティがありません</p>
              <p className="text-sm mt-1">PDFツールを使用して開始してください</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
