// NextAuth.js v5 設定

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from './db'
import { verifyPassword } from './password'
import {
  normalizeEmail,
  isAccountLocked,
  recordFailedLogin,
  resetFailedLogins,
  checkRateLimit,
  createAuditLog,
} from './security'
import type { Role } from '@/types/auth'

// 必須環境変数のチェック
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required. Set it in .env file.')
}

// NextAuth型定義の拡張
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: Role
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // メールアドレスを正規化
          const email = normalizeEmail(credentials.email as string)
          const password = credentials.password as string

          // レート制限チェック（メールアドレスベース）
          const rateLimit = checkRateLimit(email, {
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000, // 15分
          })

          if (!rateLimit.allowed) {
            console.warn(`Rate limit exceeded for email: ${email}`)
            return null
          }

          // アカウントロックチェック
          const locked = await isAccountLocked(email)
          if (locked) {
            console.warn(`Account locked for email: ${email}`)
            return null
          }

          // ユーザー検索
          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            // 監査ログに記録（エラーを無視）
            createAuditLog('anonymous', 'LOGIN_FAILURE', {
              details: { message: `User not found: ${email}` },
            }).catch(err => console.error('Audit log failed:', err))
            return null
          }

          // パスワード検証
          const isValid = await verifyPassword(password, user.password)

          if (!isValid) {
            // 失敗を記録（エラーを無視）
            recordFailedLogin(email)
              .then(result => {
                return createAuditLog(user.id, 'LOGIN_FAILURE', {
                  details: { attempts: result.remainingAttempts + 1 },
                })
              })
              .catch(err => console.error('Failed to record login failure:', err))
            return null
          }

          // ログイン成功 - 失敗回数をリセット
          try {
            await resetFailedLogins(email)
          } catch (err) {
            console.error('Failed to reset failed logins:', err)
          }

          try {
            await createAuditLog(user.id, 'LOGIN_SUCCESS')
          } catch (err) {
            console.error('Failed to create audit log:', err)
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as Role,
          }
        } catch (error) {
          // データベースエラーや予期しないエラーをログに記録
          console.error('Authorization error:', error)
          // ユーザーには詳細を公開せず、nullを返して認証失敗とする
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id
          token.role = user.role
        }
        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (session.user && token) {
          session.user.id = token.id as string
          session.user.role = token.role as Role
        }
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    },
  },
})
