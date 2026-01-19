// クライアントコンポーネント用セッションフック

"use client"

import { useEffect, useState } from 'react'

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
}

export function useSession() {
  const [session, setSession] = useState<{ user: User } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          setSession(data)
          setError(null)
        } else if (res.status >= 500) {
          // サーバーエラー - 単なる未認証状態ではない
          setError('セッションの読み込みに失敗しました')
          console.error('[SESSION] Server error:', res.status)
        }
        // 4xxエラー（401など）は通常の未認証状態として扱う
      } catch (err) {
        console.error('[SESSION] Network error:', err)
        setError('ネットワークエラーが発生しました')
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  return { session, isLoading, error }
}
