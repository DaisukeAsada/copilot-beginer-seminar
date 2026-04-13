---
description: "Use when editing backend TypeScript in src/**/*.ts. Enforce backend-specific rules for TDD, Result pattern, domain layering, ESM imports, validation boundaries, and domain index exports."
name: "Backend Implementation Rules"
applyTo: "src/**/*.ts"
---
# バックエンド専用規約

## 実装フロー
- TDD に従い、`Red -> Green -> Refactor` を必ず維持する。
- 先に失敗するテストで要求仕様または不具合を明文化し、そのテストを通す最小実装を行う。
- バグ修正は「再現テスト追加 -> 失敗確認 -> 修正 -> 成功確認」の順で進める。
- リファクタリングのみの場合は振る舞いを変更しない。振る舞い変更がある場合は先に失敗テストを追加する。
- 変更時は影響範囲の Vitest を優先して実行し、必要に応じて `npm run test:run` で回帰を確認する。

## レイヤー境界
- 依存方向は `Controller -> Service -> Repository` を維持し、逆方向参照を作らない。
- Controller は HTTP リクエスト/レスポンスの境界を扱い、入力の受け取り・必要最小限の整形・Service 呼び出しを担う。
- 入力値の妥当性検証やドメインルールに関わるバリデーションは Service 側で `src/shared/validation.ts` を用いて実施し、結果は `Result<T, E>` で返す既存パターンに合わせる。
- ドメイン公開 API は `src/domains/*/index.ts` に集約し、新規追加時は公開面を更新する。

## エラーと型
- 例外ベースではなく `src/shared/result.ts` の `Result<T, E>` (`ok`/`err`/`isOk`/`isErr`) を使ってエラーを表現する。
- ID や識別子は `src/shared/branded-types.ts` の Branded Types を使い、`string` の直接利用を避ける。

## ESM と import ルール
- バックエンドは ESM 前提のため、ローカル import は `.js` 拡張子を明示する。
- 既存の TypeScript strict 設定と ESLint ルールに従い、`any` 導入は最小限にする。

## テストパターン
- バックエンドのユニットテストは Vitest を使い、モック Repository を注入する既存パターンを優先する。
- 振る舞いをテストし、実装詳細に過度依存したアサーションを避ける。

## 参照ファイル
- `src/shared/result.ts`
- `src/shared/branded-types.ts`
- `src/domains/auth/auth-controller.ts`
- `src/domains/auth/auth-service.ts`
- `src/domains/book/book-service.ts`
- `src/e2e/e2e-integration.test.ts`
