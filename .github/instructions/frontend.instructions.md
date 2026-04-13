---
description: "Use when editing frontend TypeScript/TSX in client/src. Enforce frontend-specific rules for TDD, page/component/lib boundaries, API client usage, auth context usage, and RTL testing."
name: "Frontend Implementation Rules"
applyTo: "client/src/**/*.{ts,tsx}"
---
# フロントエンド専用規約

## 実装フロー
- TDD に従い、`Red -> Green -> Refactor` を必ず維持する。
- 先に失敗するテストで要求仕様または不具合を明文化し、そのテストを通す最小実装を行う。
- バグ修正は「再現テスト追加 -> 失敗確認 -> 修正 -> 成功確認」の順で進める。
- リファクタリングのみの場合は振る舞いを変更しない。振る舞い変更がある場合は先に失敗テストを追加する。
- 変更時は影響範囲のテストを優先し、必要に応じて `cd client && npm run test:run` で回帰を確認する。

## 責務分離
- `pages/` は画面単位の構成と状態管理、`components/` は再利用 UI、`lib/` は API 呼び出しを担当させる。
- 画面やコンポーネントから直接 `fetch` を呼ばず、`client/src/lib/api-client.ts` と各 `*-api.ts` を経由する。
- 公開エントリがあるディレクトリ（例: `components/index.ts`, `pages/index.ts`, `lib/index.ts`）では、必要な export を更新する。

## 型と実装スタイル
- TypeScript strict 前提で実装し、`any` の導入は最小限にする。
- 既存の命名、React Hooks の使い方、エラーハンドリングのパターンに合わせる。
- 認証状態は `contexts/auth-context.tsx` と `use-auth.ts` の既存パターンを踏襲する。

## テストパターン
- フロントエンドテストは Vitest + React Testing Library を使用し、ユーザー操作起点で振る舞いを検証する。
- `*.test.tsx` / `*.test.ts` の既存スタイルに合わせ、実装詳細より公開された挙動を優先して検証する。
- API 呼び出しを含むテストは既存のモックパターンを再利用する。

## 参照ファイル
- `client/src/lib/api-client.ts`
- `client/src/lib/book-api.ts`
- `client/src/contexts/auth-context.tsx`
- `client/src/contexts/use-auth.ts`
- `client/src/components/FormInput.tsx`
- `client/src/pages/BooksPage.tsx`
- `client/src/routes/routes.tsx`
