# Project Guidelines

## 適用範囲
この指示はワークスペース全体に適用する。

## 回答言語
- 必ず日本語で回答する。

## コードスタイル
- TypeScript は `strict` 前提で、`any` の導入は最小限にする。
- 既存の ESLint/Prettier 設定を優先し、手動でスタイルを持ち込まない。
- 既存の命名とレイヤー構成（Controller/Service/Repository、`index.ts` で公開 API 集約）に合わせる。
- ESM 前提のため、バックエンドの import は既存実装に合わせて `.js` 拡張子を明示する。

## アーキテクチャ
- モノレポ構成:
  - `src/`: Express ベースのバックエンド
  - `client/src/`: React + Vite フロントエンド
- バックエンドはドメイン単位 (`src/domains/*`) で実装し、依存方向は `Controller -> Service -> Repository` を維持する。
- 共通ロジックは `src/shared/` に集約する。特に `Result<T, E>` と Branded Types を優先して使う。
- フロントエンドは `pages/` を画面単位、`components/` を再利用 UI、`lib/` を API 呼び出し層として責務分離する。

## ビルドとテスト
- バックエンド (workspace root):
  - `npm run dev`: 開発サーバー起動
  - `npm run build`: TypeScript ビルド
  - `npm test` / `npm run test:run`: Vitest
  - `npm run lint`: ESLint
  - `npm run db:init`: DB 初期化/マイグレーション適用
- フロントエンド (`client/`):
  - `npm run dev`: Vite 開発サーバー起動
  - `npm run build`: 型チェック + ビルド
  - `npm test` / `npm run test:run`: Vitest
  - `npm run lint`: ESLint
- 変更時は、影響範囲に応じて最小でも関連テストを実行する。

## 実装フロー
- 実装は TDD (Test-Driven Development) に従い、`Red -> Green -> Refactor` の順で進める。
- まず失敗するテストで要求仕様または不具合を明文化し、そのテストを通す最小実装のみを加える。
- バグ修正は「再現テスト追加 -> 失敗確認 -> 修正 -> 成功確認」の順で進める。
- リファクタリングのみの場合は振る舞いを変更せず既存テストをグリーンに保つ。振る舞い変更がある場合は、先に失敗テストを追加する。
- 1つの変更目的に対して1つ以上の対応テストを追加し、テスト意図が不明瞭なケースを避ける。

## 実装規約
- 例外を多用せず、`src/shared/result.ts` の `Result<T, E>` (`ok`/`err`/`isOk`/`isErr`) でエラーを表現する。
- ID や識別子は `src/shared/branded-types.ts` の Branded Types を使い、`string` の生利用を避ける。
- 入力バリデーションは責務を分離し、Controller では外部入力の型・形・必須項目をチェックし、Service ではドメインルールや業務上の整合性を検証して `Result` で返す。
- 新規機能は既存ドメインの公開面 (`src/domains/*/index.ts`) を更新して、外部公開 API を明確化する。
- フロントエンドの API 呼び出しは `client/src/lib/api-client.ts` と各 `*-api.ts` を経由し、画面から直接 `fetch` を乱立させない。

## テスト規約
- バックエンドは Vitest で、モック Repository を注入する既存パターンを踏襲する。
- フロントエンドは React Testing Library を使い、ユーザー操作起点で振る舞いを検証する。
- テストファイルのスタイルは既存の `*.test.ts(x)` に合わせる。

## 参照優先ファイル
- `src/shared/result.ts`
- `src/shared/branded-types.ts`
- `src/domains/auth/auth-controller.ts`
- `src/domains/auth/auth-service.ts`
- `src/domains/book/book-service.ts`
- `src/e2e/e2e-integration.test.ts`
- `client/src/contexts/auth-context.tsx`
- `client/src/lib/api-client.ts`
- `client/src/components/FormInput.tsx`
- `client/src/pages/BooksPage.tsx`

## 注意点
- DB 初期化には PostgreSQL 環境変数 (`POSTGRES_HOST` など) が必要。
- フロントエンド開発時は API プロキシ先（通常 `http://localhost:3000/api`）を前提にする。
- 認証はセッションベースで、RBAC は `admin > librarian > patron` の階層を維持する。
