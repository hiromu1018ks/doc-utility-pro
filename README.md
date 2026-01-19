# Doc Utility Pro

<div align="center">

**AI搭載 ドキュメントユーティリティプラットフォーム**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[デモ](https://doc-utility-pro.vercel.app) • [機能概要](#-機能) • [セットアップ](#-セットアップ) • [ architecture](#-プロジェクト構造)

</div>

---

## 📖 概要

**Doc Utility Pro** は、Next.js 16 + TypeScript で構築された、モダンなドキュメント管理・編集プラットフォームです。AIを活用した文章校正ツールと、クライアントサイドで完結するPDF操作機能を提供します。

### 主な特長

- 🤖 **AI文章校正** — GLM-4.7を搭載したリアルタイム校正機能
- 🔒 **認証システム** — NextAuth.js v5による安全なユーザー管理
- 📄 **PDF操作** — 結合/分割/圧縮/ページ管理/ページ番号挿入
- 🎨 **ダークモード** — デフォルトでダークテーマを適用
- ⚡ **ストリーミング対応** — AI応答をリアルタイムに表示
- 🔐 **セキュリティ重視** — アカウントロック、監査ログ、bcryptハッシュ

---

## ✨ 機能

### AI校正機能
- **リアルタイムストリーミング** — AI応答を逐次表示
- **5種類の校正オプション**
  - 文法（grammar）
  - スタイル（style）
  - スペル（spelling）
  - 明確性（clarity）
  - トーン（tone）
- **差分表示** — 元のテキストとの変更点をハイライト
- **カテゴリ別集計** — 変更内容を分類して表示

### PDFユーティリティ

| 機能 | 説明 |
|------|------|
| **PDF結合** | 複数のPDFを1つに結合。ドラッグ&ドロップで順序変更可能 |
| **PDF分割** | ページ範囲指定、均等分割、ページ数指定分割 |
| **PDF圧縮** | 3段階の圧縮プリセット（低・中・高）。メタデータ削除対応 |
| **ページ管理** | ページ削除、回転、並べ替え。Undo/Redo対応 |
| **ページ番号挿入** | 9箇所の配置位置、奇数/偶数ページ別設定 |

### 認証・セキュリティ
- **認証機能**
  - メールアドレス/パスワードによるログイン
  - セッション管理
- **セキュリティ**
  - bcryptによるパスワードハッシュ
  - アカウントロック機能（失敗回数制限）
  - 監査ログ記録
  - IPアドレス・User-Agent記録
- **ユーザー管理**
  - 管理者（ADMIN）・一般ユーザー（USER）のロール
  - ユーザー作成・削除・ロール変更
- **ダッシュボード**
  - アクティビティ履歴
  - 通知システム
  - 統計情報

---

## 🛠 技術スタック

### フロントエンド
- **Framework**: Next.js 16.1.2 (App Router)
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: カスタムコンポーネント（class-variance-authorityパターン）
- **Icons**: Lucide React（サブパスインポートで最適化）

### バックエンド
- **API**: Next.js API Routes
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Database**: Prisma ORM + PostgreSQL / SQLite

### AI Integration
- **Provider**: z.ai (GLM-4.7)
- **SDK**: Vercel AI SDK (@ai-sdk/openai)
- **Response**: Streaming (streamText)

### PDF操作
- **PDF Generation**: pdf-lib
- **PDF Rendering**: pdfjs-dist
- **Image Compression**: browser-image-compression
- **ZIP Generation**: JSZip

### 開発ツール
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Type Checking**: TypeScript Compiler

---

## 🚀 セットアップ

### 前提条件

- Node.js 18.x 以上
- pnpm 8.x 以上

### 1. リポジトリのクローン

```bash
git clone https://github.com/mahiro18s/doc-utility-pro.git
cd doc-utility-pro
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

`.env` ファイルを作成し、以下の環境変数を設定してください：

```bash
# ============================================
# AI API設定
# ============================================
ZAI_API_KEY=your_zai_api_key_here

# ============================================
# データベース設定
# ============================================
# 開発環境（SQLite）
DATABASE_URL="file:./prisma/dev.db"

# 本番環境（PostgreSQL）
# DATABASE_URL="postgresql://user:password@host:port/database"

# ============================================
# 認証設定
# ============================================
# 生成方法: openssl rand -base64 32
AUTH_SECRET="your-secret-key-change-this-in-production"
AUTH_URL="http://localhost:3000"

# ============================================
# 管理者ユーザー（シード用）
# ============================================
ADMIN_EMAIL="admin@doc-utility.local"
ADMIN_PASSWORD="ChangeThisPassword123!"
ADMIN_NAME="管理者"

# ============================================
# PDF処理設定（オプション）
# ============================================
NEXT_PUBLIC_PDF_MAX_FILES=30
NEXT_PUBLIC_PDF_MAX_FILE_SIZE_MB=50
```

### 4. データベースのセットアップ

```bash
# Prisma Clientの生成
pnpm prisma generate

# データベースのマイグレーション
pnpm prisma migrate dev

# 管理者ユーザーの作成
pnpm db:seed
```

### 5. 開発サーバーの起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) にアクセスしてください。

---

## 📁 プロジェクト構造

```
doc-utility-pro/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── proofread/            # AI校正エンドポイント
│   ├── dashboard/                # ダッシュボードページ
│   │   ├── page.tsx              # メインダッシュボード
│   │   ├── proofreading/         # AI校正ページ
│   │   ├── pdf-merge/            # PDF結合ページ
│   │   ├── pdf-split/            # PDF分割ページ
│   │   ├── pdf-compress/         # PDF圧縮ページ
│   │   ├── pdf-pages/            # PDFページ管理ページ
│   │   ├── page-numbers/         # ページ番号挿入ページ
│   │   ├── users/                # ユーザー管理ページ
│   │   └── layout.tsx            # ダッシュボードレイアウト
│   ├── login/                    # ログインページ
│   ├── layout.tsx                # ルートレイアウト
│   └── page.tsx                  # トップページ（リダイレクト）
│
├── components/                   # Reactコンポーネント
│   ├── ui/                       # 基本UIコンポーネント
│   ├── dashboard/                # ダッシュボード用コンポーネント
│   ├── proofreading/             # 校正用コンポーネント
│   └── pdf-*/                    # PDF各機能用コンポーネント
│
├── lib/                          # ユーティリティライブラリ
│   ├── auth.ts                   # 認証設定
│   ├── utils.ts                  # 汎用ユーティリティ
│   ├── constants.ts              # 定数定義
│   ├── security.ts               # セキュリティユーティリティ
│   └── pdf/                      # PDF操作ライブラリ
│
├── prisma/                       # Prisma設定
│   ├── schema.prisma             # データベーススキーマ
│   └── seed.ts                   # シードスクリプト
│
├── types/                        # TypeScript型定義
│   ├── index.ts                  # メイン型定義
│   └── auth.ts                   # 認証関連型
│
├── middleware.ts                 # Next.jsミドルウェア（認証）
├── tailwind.config.ts            # Tailwind設定
├── tsconfig.json                 # TypeScript設定
└── package.json                  # プロジェクト設定
```

---

## 🔧 開発コマンド

```bash
# 開発サーバー
pnpm dev

# 本番ビルド
pnpm build

# 本番サーバー起動
pnpm start

# 型チェック
pnpm tsc --noEmit

# リンティング
pnpm lint

# データベース関連
pnpm prisma generate        # Prisma Client生成
pnpm prisma migrate dev     # 開発環境マイグレーション
pnpm prisma migrate deploy  # 本番環境マイグレーション
pnpm prisma studio          # データベース閲覧ツール
pnpm db:seed                # 管理者ユーザー作成
```

---

## 🔐 環境変数リファレンス

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|:----:|--------------|
| `ZAI_API_KEY` | z.ai APIキー（GLM-4.7用） | ✅ | - |
| `DATABASE_URL` | データベース接続URL | ✅ | `file:./prisma/dev.db` |
| `AUTH_SECRET` | NextAuth.jsシークレットキー | ✅ | - |
| `AUTH_URL` | アプリケーションのベースURL | ✅ | `http://localhost:3000` |
| `ADMIN_EMAIL` | 管理者メールアドレス（シード用） | ❌ | `admin@doc-utility.local` |
| `ADMIN_PASSWORD` | 管理者パスワード（シード用） | ❌ | `ChangeThisPassword123!` |
| `ADMIN_NAME` | 管理者表示名（シード用） | ❌ | `管理者` |
| `NEXT_PUBLIC_PDF_MAX_FILES` | 最大アップロードファイル数 | ❌ | `30` |
| `NEXT_PUBLIC_PDF_MAX_FILE_SIZE_MB` | 最大ファイルサイズ（MB） | ❌ | `50` |

---

## 🏗 デプロイ

### Vercelへのデプロイ

このプロジェクトはVercelへのデプロイに最適化されています。

1. **GitHubリポジトリと連携**
   ```bash
   # Vercel CLIを使用
   pnpm add -g vercel
   vercel link
   ```

2. **環境変数の設定**
   ```bash
   # 本番環境
   vercel env add ZAI_API_KEY production
   vercel env add DATABASE_URL production
   vercel env add AUTH_SECRET production
   vercel env add AUTH_URL production
   ```

3. **デプロイ**
   ```bash
   vercel --prod
   ```

### PostgreSQLの使用（推奨）

本番環境ではVercel Postgresの使用を推奨します：

1. VercelダッシュボードからPostgresデータベースを作成
2. `.env`に`DATABASE_URL`を追加
3. `prisma schema`のproviderを`postgresql`に変更
4. マイグレーションを実行

```bash
# プロバイダー変更後
pnpm prisma migrate deploy
```

---

## 📊 アーキテクチャ

### AI校正フロー

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │─────▶│  API Route   │─────▶│  z.ai API   │
│ (streaming) │◀─────│ /api/proofread│◀─────│  (GLM-4.7)  │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ Parse Stream │
                    │  (0:"text")  │
                    └──────────────┘
```

### PDF処理フロー

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ File Upload │───▶│ Validation  │───▶│ pdf-lib     │
│ (drag/drop) │    │ (size/type) │    │ Processing  │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │   Blob URL  │
                                       │   Download  │
                                       └─────────────┘
```

### 認証フロー

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Login     │───▶│ NextAuth.js │───▶│   Prisma    │
│   Page      │    │  Middleware │    │   User DB   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                                    │
       ▼                                    ▼
┌─────────────┐                    ┌─────────────┐
│   Session   │                    │  Audit Log  │
│   Cookie    │                    │  Recording  │
└─────────────┘                    └─────────────┘
```

---

## 🤝 貢献

バグ報告や機能リクエストは[Issue](https://github.com/mahiro18s/doc-utility-pro/issues)にてお願いします。

---

## 📝 ライセンス

MIT License - [LICENSE](LICENSE) をご覧ください。

---

## 🙏 謝辞

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Vercel AI SDK](https://sdk.vercel.ai/) - AIインテグレーション
- [z.ai](https://open.bigmodel.cn/) - GLM-4.7 API
- [pdf-lib](https://pdf-lib.js.org/) - PDF操作
- [Tailwind CSS](https://tailwindcss.com/) - スタイリング
- [Lucide](https://lucide.dev/) - アイコン

---

<div align="center">

Made with ❤️ by [mahiro18s](https://github.com/mahiro18s)

</div>
