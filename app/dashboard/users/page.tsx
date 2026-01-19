// ユーザー管理ページ（管理者のみ）

"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'
import UserPlus from 'lucide-react/dist/esm/icons/user-plus'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // 新規ユーザーフォーム
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER')

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (!res.ok) {
        if (res.status === 401) {
          setError('管理者権限が必要です')
          return
        }
        throw new Error('ユーザー一覧の取得に失敗しました')
      }
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 新規ユーザーを作成
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword,
          role: newRole,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'ユーザーの作成に失敗しました')
      }

      // フォームをリセット
      setNewEmail('')
      setNewName('')
      setNewPassword('')
      setNewRole('USER')
      setShowCreateForm(false)

      // ユーザー一覧を再取得
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsCreating(false)
    }
  }

  // ユーザーを削除
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`${name}さんを削除してもよろしいですか？`)) {
      return
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'ユーザーの削除に失敗しました')
      }

      // ユーザー一覧を再取得
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ユーザー管理</h1>
          <p className="text-sm text-muted-foreground">
            招待制ユーザーの追加・削除を行います
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? 'outline' : 'default'}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          ユーザーを追加
        </Button>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 新規ユーザー作成フォーム */}
      {showCreateForm && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">新規ユーザー追加</h2>
          <form onSubmit={handleCreateUser} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                type="text"
                placeholder="山田 太郎"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="8文字以上"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">ロール</Label>
              <select
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'USER' | 'ADMIN')}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="USER">一般ユーザー</option>
                <option value="ADMIN">管理者</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? '作成中...' : '作成'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={isCreating}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ユーザー一覧 */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">登録ユーザー一覧</h2>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">ユーザーが登録されていません</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{user.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === 'ADMIN'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {user.role === 'ADMIN' ? '管理者' : '一般'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteUser(user.id, user.name)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
