# プロジェクトガイドライン

## 前提条件
- チャットへの回答は、日本語で行う。
- すべてのドキュメント（README、設計書、コメントなど）は、日本語で記述する。
- 大きな変更を行う場合は、事前に計画を提案して承認を得てから実装を開始する。

## 技術構成
- バックエンド: Node.js + Express + TypeScript
- フロントエンド: React + Vite + TypeScript
- データベース: PostgreSQL
- テスト: Vitest（バックエンド/フロント）+ React Testing Library（フロント）
- Lint/Format: ESLint + Prettier

## コードスタイル
- TypeScript を前提に、型安全を優先する。
- 日本語コメントは必要な箇所のみ簡潔に記述する。
- バックエンドでは次を徹底する。
  - 関数の戻り値型を明示する。
  - 未使用引数は `_` プレフィックスを使う。
  - `null` / `undefined` を明示的に扱い、曖昧な真偽判定を避ける。
- フロントエンドは既存の React + TypeScript 構成に従う。

参考:
- `eslint.config.mjs`
- `client/eslint.config.js`

## アーキテクチャ
- モノレポ構成。
  - `src/`: バックエンド
  - `client/src/`: フロントエンド
- バックエンドは `src/domains/*` で Controller → Service → Repository を分離する。
- エラーハンドリングは例外より `Result<T, E>` を優先する。
- インフラ実装は `src/infrastructure/*` に集約する。

参考:
- `src/index.ts`
- `src/shared/result.ts`
- `src/domains/book/book-service.ts`
- `client/src/lib/api-client.ts`

## ビルドとテスト
- 依存関係: `npm install`、`cd client && npm install`
- バックエンド: `npm run dev` / `npm run build` / `npm run test:run` / `npm run lint`
- フロントエンド: `cd client && npm run dev` / `npm run build` / `npm run test:run` / `npm run lint`

## プロジェクト固有の規約
- ユースケースは可能な限り `Result<T, E>` を返し、`isOk` / `isErr` で分岐する。
- バリデーションは入力境界（主に Controller / Service 入口）で行う。
- ID は Branded Types（例: `BookId`, `UserId`）を利用する。
- `src/index.ts` の `/api/books` は `searchRouter` を先にマウントする（順序退行に注意）。
- API 通信は `client/src/lib/api-client.ts` に統一し、処理の重複実装を避ける。
- 開発時は Vite の `/api` プロキシ（`client/vite.config.ts`）経由で `localhost:3000` に接続する。
