# 図書館蔵書管理システム - AI開発ガイド（概要）

このプロジェクトは**ドメイン駆動設計（DDD）**に基づいた図書館蔵書管理システムです。モノレポ構造で、サーバー（Express + TypeScript）とクライアント（React + TypeScript）から構成されています。

## プロジェクト構成

```
copilot-beginer-seminar/
├── src/                              # サーバーサイド（Node.js/Express）
│   ├── domains/                      # ドメイン層（7つのドメイン）
│   ├── infrastructure/               # インフラ層（DB・リポジトリ）
│   └── shared/                       # 共有ユーティリティ（Result型・ブランド型）
├── client/src/                       # クライアントサイド（React）
│   ├── components/                   # UI コンポーネント
│   ├── pages/                        # ページコンポーネント
│   ├── lib/                          # API クライアント層
│   ├── contexts/                     # Context API（状態管理）
│   └── routes/                       # ルーティング定義
├── .github/
│   ├── copilot-instructions.md       # このファイル（全体概要）
│   └── instructions/
│       ├── typescript.instructions.md # TypeScript基本規約（既存）
│       ├── server.instructions.md     # サーバーサイド詳細ガイド
│       └── client.instructions.md     # クライアントサイド詳細ガイド
```

## ドメイン構成

プロジェクトは以下の7つのドメインで構成されています：

1. **auth** - 認証・認可（RBAC）
2. **book** - 書籍・蔵書管理（CRUD・検索）
3. **loan** - 貸出管理（貸出・返却・延滞）
4. **user** - 利用者管理（CRUD・検索）
5. **reservation** - 予約管理（予約・キャンセル）
6. **report** - レポート生成（統計・ランキング）
7. **notification** - 通知サービス（非同期通知）

## 技術スタック

### サーバーサイド
- **言語**: TypeScript
- **フレームワーク**: Express.js 5.x
- **データベース**: PostgreSQL
- **テスト**: Vitest + Supertest
- **ビルド**: TypeScript Compiler

### クライアントサイド
- **言語**: TypeScript
- **フレームワーク**: React 19 + React Router 7
- **バンドラー**: Vite
- **テスト**: Vitest + React Testing Library
- **データ取得**: カスタムfetch

## 重要な共通原則

### 1. 例外を投げない
- すべてのビジネスロジックはResult<T, E>型を返す
- 異常終了は型で表現

### 2. 型安全性
- ブランド型を使用してIDの型安全性を保証
- インターフェース駆動で実装から分離

### 3. テスト駆動開発（TDD）
- すべてのテストは "RED → GREEN → REFACTOR" に従う
- テストコメントに「TDD:」を記載

### 4. 依存性注入
- サービス・リポジトリはファクトリ関数で生成
- `src/index.ts`でコンポーネントを組み立て

### 5. コード品質
- ESLint・Prettier設定を遵守
- TypeScript コンパイルエラーなし
- 複雑な処理には日本語コメント記載

## セットアップと開発ワークフロー

### 初期セットアップ
```bash
# サーバー
npm install
npm run db:init  # データベース初期化

# クライアント
cd client && npm install
```

### 開発
```bash
# サーバー
npm run dev       # 開発サーバー起動
npm test          # テスト（ウォッチモード）
npm run lint      # ESLintチェック

# クライアント
cd client && npm run dev  # 開発サーバー起動
cd client && npm test     # テスト
cd client && npm run lint # ESLintチェック
```

### ビルド・デプロイ
```bash
# サーバー
npm run build     # コンパイル

# クライアント
cd client && npm run build  # バンドル（dist生成）
```

## API レスポンス仕様

### 成功時（2xx）
```json
{
  "id": "B001",
  "title": "TypeScript実践ガイド",
  "author": "著者名",
  ...
}
```

### エラー時
```json
{
  "error": {
    "type": "VALIDATION_ERROR|NOT_FOUND|DUPLICATE_ISBN|...",
    "field": "fieldName",
    "message": "詳細なエラーメッセージ"
  }
}
```

## 関連リソース

- [VS Code Copilot カスタム指示ドキュメント](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
- TypeScript設定: `tsconfig.json`
- ESLint設定: `eslint.config.mjs`（サーバー）、`client/eslint.config.js`（クライアント）
