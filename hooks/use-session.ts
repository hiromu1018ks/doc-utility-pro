// クライアントコンポーネント用セッションフック

"use client"

import { useEffect, useState } from 'react'
import { Session } from 'next-auth'

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
}

export function useSession() {
  const [session, setSession] = useState<{ user: User } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          setSession(data)
        }
      } catch (error) {
        console.error('Failed to load session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  return { session, isLoading }
}
