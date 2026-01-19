// Prismaクライアントのシングルトンインスタンス
// 開発環境でのホットリロード時の接続多重化を防ぐためのグローバル変数

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
