# プロジェクトガイドライン

## コードスタイル
- TypeScript を前提に、型安全を優先する。
- 既存コードに合わせて、日本語コメントを維持する（必要な箇所のみ簡潔に）。
- ルート（バックエンド）は厳格な ESLint 設定を採用しているため、特に次を守る。
  - 関数の戻り値型を明示する。
  - 未使用引数は `_` プレフィックスを使う。
  - 真偽判定は曖昧なチェックを避け、`null` / `undefined` を明示的に扱う。
- フロントエンドは既存の React + TypeScript 構成に従う。

参考:
- `eslint.config.mjs`
- `client/eslint.config.js`

## アーキテクチャ
- モノレポ構成。
  - `src/`: Express ベースのバックエンド
  - `client/src/`: React + Vite のフロントエンド
- バックエンドはドメイン単位（`src/domains/*`）で、Controller → Service → Repository の責務分離を行う。
- エラーハンドリングは例外中心ではなく `Result<T, E>` を使う。
- インフラ実装は `src/infrastructure/*` に集約する。

参考:
- `src/index.ts`
- `src/shared/result.ts`
- `src/domains/book/book-service.ts`
- `client/src/lib/api-client.ts`

## ビルドとテスト
- 依存関係インストール:
  - ルート: `npm install`
  - フロント: `cd client && npm install`
- バックエンド:
  - 開発実行: `npm run dev`
  - ビルド: `npm run build`
  - テスト: `npm run test:run`
  - Lint: `npm run lint`
- フロントエンド:
  - 開発実行: `cd client && npm run dev`
  - ビルド: `cd client && npm run build`
  - テスト: `cd client && npm run test:run`
  - Lint: `cd client && npm run lint`

## プロジェクト固有の規約
- バックエンドのユースケース実装では、可能な限り `Result<T, E>` を返し、`isOk` / `isErr` で分岐する。
- バリデーションは入力境界（主に Controller / Service の入口）で実施し、ドメインエラー型に正規化する。
- ID は Branded Types（例: `BookId`, `UserId`）を使う既存方針に合わせる。
- `src/index.ts` の `/api/books` では `searchRouter` を先にマウントしている。ルーティング変更時は順序による退行に注意する。
- フロントエンドの API 通信は `client/src/lib/api-client.ts` を基盤に統一し、認証トークンやエラー処理の実装を重複させない。
- 開発時の API 接続先は Vite の `/api` プロキシ（`client/vite.config.ts`）前提。バックエンドは `localhost:3000` で起動する。
