// ログインフォームコンポーネント

"use client"

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FileText from 'lucide-react/dist/esm/icons/file-text'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // NextAuthのsignIn関数を使用（CSRF対応済み）
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません')
        return
      }

      if (result?.ok) {
        // ログイン成功後にダッシュボードへリダイレクト
        window.location.href = '/dashboard'
      }
    } catch (err) {
      // ネットワークエラーとサーバーエラーを区別
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('ネットワークエラーが発生しました。接続を確認してください。')
      } else {
        setError('エラーが発生しました')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* ロゴとタイトル */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            DocUtility Pro
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            アカウントにログインしてください
          </p>
        </div>

        {/* ログインフォーム */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* エラーメッセージ */}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* メールアドレス */}
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* パスワード */}
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* 送信ボタン */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          {/* デモ用のヒント - 開発環境のみ表示 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <p className="font-medium">開発用管理者アカウント:</p>
              <p>メール: admin@doc-utility.local</p>
              <p>パスワード: Admin123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
