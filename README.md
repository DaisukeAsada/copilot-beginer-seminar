# 図書館蔵書管理システム

図書館の蔵書・貸出・予約・利用者を一元管理する Web アプリケーションです。

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| バックエンド | Express 5 + TypeScript (ESM) |
| フロントエンド | React 19 + Vite + React Router + TanStack Query |
| データベース | PostgreSQL |
| キャッシュ / キュー | Redis (セッション管理・BullMQ 通知キュー) |
| テスト | Vitest + React Testing Library |
| リンター / フォーマッター | ESLint + Prettier |

## アーキテクチャ

モノレポ構成で、バックエンドとフロントエンドを同一リポジトリで管理します。

```
src/                      # Express バックエンド
├── domains/              # ドメイン層（機能単位）
│   ├── auth/             # 認証・セッション・RBAC
│   ├── book/             # 蔵書管理・全文検索
│   ├── loan/             # 貸出・返却・延滞管理
│   ├── user/             # 利用者管理
│   ├── reservation/      # 予約管理
│   ├── report/           # 統計レポート
│   └── notification/     # 通知（メール・非同期ジョブ）
├── infrastructure/       # DB接続・リポジトリ実装
├── shared/               # Result型・Branded Types・バリデーション
├── scripts/              # DB初期化スクリプト
└── e2e/                  # E2E統合テスト

client/src/               # React フロントエンド
├── pages/                # 画面コンポーネント
├── components/           # 再利用UIコンポーネント
├── lib/                  # APIクライアント層
├── contexts/             # 認証コンテキスト
└── routes/               # ルーティング定義
```

### バックエンド設計

- **レイヤー構成**: `Controller → Service → Repository` の依存方向を維持
- **エラー処理**: 例外ではなく `Result<T, E>` パターンで表現 (`src/shared/result.ts`)
- **型安全ID**: Branded Types で各種 ID の混在を防止 (`src/shared/branded-types.ts`)
- **認証**: セッションベース、RBAC ロール階層 `admin > librarian > patron`

### フロントエンドページ

| パス | ページ | 説明 |
|------|--------|------|
| `/` | HomePage | ホーム |
| `/books` | BooksPage | 蔵書一覧 |
| `/books/search` | SearchPage | 蔵書検索 |
| `/loans` | LoansPage | 貸出一覧 |
| `/users` | UsersPage | 利用者管理 |
| `/reservations` | ReservationsPage | 予約管理 |
| `/reports` | ReportsPage | 統計レポート |

## セットアップ

### 前提条件

- Node.js
- PostgreSQL
- Redis

> Dev Container を使用すれば PostgreSQL・Redis が自動的にセットアップされます。

### 環境変数

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `POSTGRES_HOST` | `postgres` | PostgreSQL ホスト |
| `POSTGRES_PORT` | `5432` | PostgreSQL ポート |
| `POSTGRES_DB` | `library_db` | データベース名 |
| `POSTGRES_USER` | `library_user` | DBユーザー名 |
| `POSTGRES_PASSWORD` | `library_password` | DBパスワード |
| `PORT` | `3000` | バックエンドサーバーポート |

### インストールと起動

```bash
# 依存パッケージのインストール
npm install
cd client && npm install && cd ..

# データベース初期化（マイグレーション適用）
npm run db:init

# バックエンド開発サーバー起動（ポート 3000）
npm run dev

# フロントエンド開発サーバー起動（ポート 5173、別ターミナルで）
cd client && npm run dev
```

フロントエンドは Vite のプロキシ設定により `/api` へのリクエストを `http://localhost:3000` に転送します。

## 開発コマンド

### バックエンド（ワークスペースルート）

```bash
npm run dev          # 開発サーバー起動
npm run build        # TypeScript ビルド
npm test             # テスト（ウォッチモード）
npm run test:run     # テスト（単発実行）
npm run lint         # ESLint
npm run db:init      # DB初期化 / マイグレーション
```

### フロントエンド（`client/`）

```bash
npm run dev          # Vite 開発サーバー起動
npm run build        # 型チェック + ビルド
npm test             # テスト（ウォッチモード）
npm run test:run     # テスト（単発実行）
npm run lint         # ESLint
```

## 開発方針

- **TDD**: Red → Green → Refactor のサイクルで実装
- **TypeScript strict**: 全厳密オプション有効
- **ESM**: バックエンドの import は `.js` 拡張子を明示

## ライセンス

ISC
