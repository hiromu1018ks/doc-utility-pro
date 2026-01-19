// シードスクリプト - 初期管理者ユーザーを作成
// 実行方法: pnpm db:seed

import { db } from '../lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@doc-utility.local'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123'
  const adminName = process.env.ADMIN_NAME || '管理者'

  console.log('🌱 シードスクリプトを開始します...')

  // 既存のユーザーをチェック
  const existingUser = await db.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingUser) {
    console.log('✅ 管理者ユーザーは既に存在します:', adminEmail)
    return
  }

  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  // 管理者ユーザーを作成
  const user = await db.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN'
    }
  })

  console.log('✅ 管理者ユーザーを作成しました:')
  console.log('   メールアドレス:', adminEmail)
  console.log('   パスワード:', adminPassword)
  console.log('   ⚠️  本番環境では必ずパスワードを変更してください！')
}

main()
  .catch((e) => {
    console.error('❌ シードスクリプトが失敗しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
