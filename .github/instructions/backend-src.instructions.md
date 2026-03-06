---
description: "Use when editing backend TypeScript in src/. Enforces Result pattern, layer separation (Controller/Service/Repository), branded IDs, and input-boundary validation."
name: "Backend Src Rules"
applyTo: "src/**/*.ts"
---
# バックエンド（src）実装ルール

- 対象: `src/**/*.ts` の変更時。
- 関数の戻り値型を明示する。
- 未使用引数は `_` プレフィックスを使う。
- `null` / `undefined` を明示的に扱い、曖昧な真偽判定を避ける。
- ユースケースは可能な限り `Result<T, E>` を返し、`isOk` / `isErr` で分岐する。
- 入力バリデーションは Controller / Service 入口で行い、ドメインエラー型に正規化する。
- ID は Branded Types（例: `BookId`, `UserId`）を利用する。
- レイヤー責務を守る: Controller（HTTP入出力）/ Service（業務ロジック）/ Repository（永続化）。
- ルーティング変更時は `src/index.ts` の `/api/books` で `searchRouter` を先にマウントする順序を維持する。

参考:
- `src/shared/result.ts`
- `src/shared/branded-types.ts`
- `src/domains/book/book-service.ts`
- `src/index.ts`
