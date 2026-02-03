---
applyTo: '**/*.ts'
---

# TypeScript 共通コーディング規約

このファイルはサーバー・クライアント両方の TypeScript コードに適用される基本規約を定義します。

## 必須ルール

### 1. 型安全性の徹底

#### 関数の戻り値型を明示

```typescript
// ✅ 正しい
function getUser(id: string): User | null {
  return users.find(u => u.id === id) ?? null;
}

async function fetchData(): Promise<Result<Data, Error>> {
  // ...
}

// ❌ 間違い（型推論に頼らない）
function getUser(id: string) {
  return users.find(u => u.id === id) ?? null;
}
```

#### `any` の使用禁止

```typescript
// ✅ 正しい
function processData(data: unknown): Result<ProcessedData, Error> {
  if (typeof data !== 'object' || data === null) {
    return err({ type: 'INVALID_DATA' });
  }
  // 型ガードで絞り込む
}

// ❌ 間違い
function processData(data: any) {
  // any は型チェックを無効化するため禁止
}
```

### 3. イミュータブル設計

#### オブジェクト・配列に `readonly` を使用

```typescript
// ✅ 正しい
interface User {
  readonly id: string;
  readonly name: string;
  readonly roles: readonly string[];
}

type Config = {
  readonly apiUrl: string;
  readonly timeout: number;
};

// ❌ 間違い（可変にする必要がある場合のみ許可）
interface User {
  id: string;
  name: string;
  roles: string[];
}
```

### 4. null/undefined の安全な扱い

#### オプショナルチェーンと null 合体演算子を活用

```typescript
// ✅ 正しい
const userName = user?.profile?.name ?? 'Unknown';
const count = data?.items?.length ?? 0;

// ❌ 間違い（unsafe なアクセス）
const userName = data.user.profile.name; // 途中が undefined だと例外
```

#### `noUncheckedIndexedAccess` への対応

```typescript
// tsconfig で noUncheckedIndexedAccess: true が有効のため、配列アクセスは undefined チェック必須

// ✅ 正しい
const first = items[0];
if (first !== undefined) {
  console.log(first.name);
}

// または
const first = items.at(0);
if (first) {
  console.log(first.name);
}

// ❌ 間違い
console.log(items[0].name); // items[0] は T | undefined 型
```

### 5. 厳格な tsconfig 設定への準拠

以下の設定が有効なため、コードは以下に従う必要があります：

- `strict: true` - すべての厳格チェック有効
- `noImplicitReturns: true` - すべてのコードパスで return 必須
- `noFallthroughCasesInSwitch: true` - switch の fallthrough 禁止
- `noUncheckedIndexedAccess: true` - 配列・オブジェクトアクセスは undefined を考慮
- `exactOptionalPropertyTypes: true` - `property?: T` と `property: T | undefined` を区別

```typescript
// ✅ 正しい - すべてのパスで return
function getStatus(code: number): string {
  if (code === 200) {
    return 'OK';
  } else if (code === 404) {
    return 'Not Found';
  } else {
    return 'Unknown';
  }
}

// ❌ 間違い - else がない場合 undefined が返る可能性
function getStatus(code: number): string {
  if (code === 200) {
    return 'OK';
  } else if (code === 404) {
    return 'Not Found';
  }
  // noImplicitReturns エラー
}
```

## コード品質チェック

### 開発中の確認コマンド

```bash
# 構文エラーのチェック（ESLint）
npm run lint

# TypeScript コンパイルチェック（型エラー検出）
npx tsc --noEmit

# テスト実行
npm test
```

### コミット前の必須チェック

1. `npm run lint` でエラーがないこと
2. `npx tsc --noEmit` で型エラーがないこと
3. 関連するテストが pass すること

## 型定義のベストプラクティス

### type vs interface の使い分け

```typescript
// ✅ オブジェクト形状の定義には interface を優先
interface User {
  readonly id: string;
  readonly name: string;
}

// ✅ ユニオン型・交差型・プリミティブには type を使用
type Status = 'active' | 'inactive' | 'pending';
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

### 型のエクスポート

```typescript
// ✅ 型のみのインポート・エクスポートには type 修飾子を使用（ランタイムコード削減）
export type { User, CreateUserInput };
import type { Config } from './config.js';

// ✅ 値と型を同時にエクスポートする場合
export { createUser };
export type { User };
```
