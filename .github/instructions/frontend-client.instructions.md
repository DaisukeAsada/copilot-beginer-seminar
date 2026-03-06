---
description: "Use when editing frontend code in client/src. Enforces React+TypeScript patterns, api-client usage, auth context usage, and Vite /api proxy assumptions."
name: "Frontend Client Rules"
applyTo: "client/src/**/*.{ts,tsx}"
---
# フロントエンド（client/src）実装ルール

- 対象: `client/src/**/*.{ts,tsx}` の変更時。
- 既存の React + TypeScript 構成に従い、型安全を優先する。
- API 通信は `client/src/lib/api-client.ts` を基盤に統一し、`fetch` の重複実装を避ける。
- 機能別 API は `client/src/lib/*-api.ts` に集約し、ページやコンポーネントへ直接 HTTP 処理を書かない。
- 認証状態は `client/src/contexts/auth-context.tsx` と `use-auth.ts` の利用を前提にし、Provider 外での利用を避ける。
- データ取得・更新は既存方針に合わせて React Query を優先し、ローディング/エラー状態を明示的に扱う。
- UI は `client/src/components` の既存コンポーネント再利用を優先し、重複コンポーネントを増やさない。
- テストは Vitest + React Testing Library の既存パターン（`getByRole` などアクセシブルクエリ優先）に合わせる。
- 開発時の API 接続は Vite の `/api` プロキシ（`client/vite.config.ts`）経由で `localhost:3000` へ接続する前提で実装する。

参考:
- `client/src/lib/api-client.ts`
- `client/src/contexts/auth-context.tsx`
- `client/src/pages/BooksPage.tsx`
- `client/vite.config.ts`
