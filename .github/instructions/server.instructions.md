---
name: Server-side Development
description: TypeScript/Node.js サーバーサイド開発向けのコーディング規約とパターン
applyTo: "src/**/*.ts"
---

# サーバーサイド開発ガイド（Express + TypeScript）

このファイルは図書館蔵書管理システムのサーバーサイド（`src/`）開発において遵守すべき規約とパターンを定義しています。

## アーキテクチャ原則

### ドメイン駆動設計（DDD）に基づくレイヤー構成

```
src/
├── domains/          # ドメイン層（ビジネスロジック）
├── infrastructure/   # インフラ層（データベース・永続化）
└── shared/           # 共有ユーティリティ
```

**重要**: Domain層はInfrastructure層に依存しない。インターフェース経由で結合。

### 依存関係の流れ
- **Controller → Service → Repository** (一方向のみ)
- **Component間の依存性注入**: `src/index.ts`で行う

## 必須パターン

### 1. Result<T, E> パターン（エラー処理）

**すべてのビジネスロジック関数はResult型を返す**。例外をスローしない。

```typescript
import { ok, err, isErr, isOk } from '@shared/result.js';

async function createUser(input: CreateUserInput): Promise<Result<User, UserError>> {
  // バリデーション
  if (!input.name || input.name.trim() === '') {
    return err({ type: 'VALIDATION_ERROR', field: 'name', message: '名前は必須です' });
  }

  // ビジネスロジック実行
  const created = await repository.create(input);
  if (isErr(created)) {
    return created; // エラーを伝播
  }

  return ok(created.value);
}
```

**例外が許可される箇所**:
- インフラ層（Repository実装内のDB操作失敗など）
- 共有ユーティリティ（brandedタイプのバリデーション、result.unwrap()など）
- プログラマーエラー（契約違反・assertion失敗）

**重要**: ドメイン層（Service）では例外を投げず、必ずResult型でエラーを返す。

- 使用関数: `ok()`, `err()`, `isOk()`, `isErr()`, `flatMap()`, `map()`, `mapErr()`
- 参考ファイル: `src/shared/result.ts`

### 2. ブランド型（型安全なID）

**すべてのIDはブランド型を使用。異なるID型の混同を防止。**

```typescript
import { createUserId, createBookId, createLoanId } from '@shared/branded-types.js';

// ✅ 正しい
const userId = createUserId('U001');
const bookId = createBookId('B001');
await userService.getUserById(userId); // OK
await userService.getUserById(bookId);  // ❌ コンパイルエラー

// ✅ ファクトリ関数を使用（常に）
export type UserId = Brand<string, 'UserId'>;
export function createUserId(value: string): UserId { /* ... */ }
```

利用可能な型: `UserId`, `BookId`, `LoanId`, `CopyId`, `ReservationId`, `OverdueRecordId`

### 3. ファクトリ関数パターン

**ServiceとRepositoryはファクトリ関数で生成。テスタビリティと依存性管理を向上。**

```typescript
// src/domains/user/user-service.ts
export function createUserService(repository: UserRepository): UserService {
  return {
    async createUser(input) { /* ... */ },
    async getUserById(id) { /* ... */ },
    async searchUsers(criteria) { /* ... */ },
  };
}

// src/index.ts（依存性注入）
const userRepository = createPgUserRepository(pool);
const userService = createUserService(userRepository);
const userRouter = createUserController(userService);
app.use('/api/users', userRouter);
```

### 4. インターフェース駆動設計

**Domain層はインターフェースのみに依存。実装はInfrastructure層で提供。**

```typescript
// src/domains/user/user-repository.ts（Domain層）
export interface UserRepository {
  create(input: CreateUserInput): Promise<Result<User, UserError>>;
  findById(id: UserId): Promise<Result<User, UserError>>;
  update(id: UserId, input: UpdateUserInput): Promise<Result<User, UserError>>;
}

// src/infrastructure/repositories/pg-user-repository.ts（Infrastructure層）
export function createPgUserRepository(pool: DatabasePool): UserRepository {
  return {
    async create(input) { /* PostgreSQL実装 */ },
    async findById(id) { /* PostgreSQL実装 */ },
    async update(id, input) { /* PostgreSQL実装 */ },
  };
}
```

## テスト駆動開発（TDD）

**すべてのテストファイルは "TDD: RED → GREEN → REFACTOR" サイクルに従う。**

```typescript
// src/domains/user/user-service.test.ts
describe('UserService', () => {
  let service: UserService;
  let mockRepository: UserRepository;

  beforeEach(() => {
    // Arrange: モック設定
    mockRepository = createMockRepository({
      create: vi.fn(async () => ok(mockUser)),
    });
    service = createUserService(mockRepository);
  });

  it('有効な入力で利用者を登録できる', async () => {
    // Arrange
    const input: CreateUserInput = { name: 'Test', email: 'test@example.com' };
    
    // Act
    const result = await service.createUser(input);
    
    // Assert
    expect(isOk(result)).toBe(true);
    expect(mockRepository.create).toHaveBeenCalledWith(input);
  });
});
```

テストコマンド:
```bash
npm test          # ウォッチモード
npm run test:run  # 1回のみ実行
```

## エラー処理

### エラー型の定義

**各ドメインは独自のエラー型をUnion型で定義。**

```typescript
// src/domains/user/types.ts
export type UserError =
  | { type: 'NOT_FOUND'; userId: UserId }
  | { type: 'DUPLICATE_EMAIL'; email: string }
  | { type: 'VALIDATION_ERROR'; field: string; message: string };
```

### Controllerでのエラーハンドリング

**ServiceのResult型をHTTPステータスコードにマッピング。**

```typescript
function getErrorStatusCode(error: UserError): number {
  switch (error.type) {
    case 'VALIDATION_ERROR': return 400;  // Bad Request
    case 'NOT_FOUND': return 404;        // Not Found
    case 'DUPLICATE_EMAIL': return 409;  // Conflict
  }
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const result = await userService.createUser(req.body);
  
  if (isErr(result)) {
    const statusCode = getErrorStatusCode(result.error);
    res.status(statusCode).json({ error: result.error });
    return;
  }
  
  res.status(201).json(result.value);
});
```

## バリデーション

**バリデーションはService層で実施。結果をResult型で返す。**

```typescript
import { validateRequired, validateEmail } from '@shared/validation.js';

function validateCreateUserInput(input: CreateUserInput): Result<void, UserError> {
  const nameValidation = validateRequired(input.name, 'name');
  if (isErr(nameValidation)) {
    return err({
      type: 'VALIDATION_ERROR',
      field: 'name',
      message: nameValidation.error,
    });
  }

  const emailValidation = validateEmail(input.email);
  if (isErr(emailValidation)) {
    return err({
      type: 'VALIDATION_ERROR',
      field: 'email',
      message: emailValidation.error,
    });
  }

  return ok(undefined);
}
```

## コーディング規約

### インポート規則

**ESModulesのため、すべてのimportに `.js` 拡張子を付与**（TypeScriptファイルでも）。

```typescript
// ✅ 正しい
import { UserService } from './user-service.js';
import { createUserId } from '@shared/branded-types.js';

// ❌ 間違い
import { UserService } from './user-service';
import { createUserId } from '@shared/branded-types';
```

### 型定義

**インターフェース・型定義には `readonly` キーワードを使用。**

```typescript
// ✅ 正しい
export interface User {
  readonly id: UserId;
  readonly name: string;
  readonly email: string;
}

export type UserError =
  | { readonly type: 'NOT_FOUND' }
  | { readonly type: 'DUPLICATE_EMAIL'; readonly email: string };

// ❌ 間違い
export interface User {
  id: UserId;
  name: string;
  email: string;
}
```

### コメント

**複雑な処理には日本語コメントを付与。セクション分けに `// ============================================` を使用。**

```typescript
// ============================================
// バリデーション関数
// ============================================

/**
 * 利用者登録入力をバリデーション
 * @param input - 入力値
 * @returns バリデーション結果
 */
function validateCreateUserInput(input: CreateUserInput): Result<void, UserError> {
  // メールアドレスの重複をチェック
  if (existingUser !== null) {
    return err({ type: 'DUPLICATE_EMAIL', email: input.email });
  }
  return ok(undefined);
}
```

## Lintと型チェック

```bash
npm run lint       # ESLintで静的解析
npm run lint:fix   # 自動修正
npx tsc --noEmit  # TypeScriptコンパイルチェック
npm run format    # Prettierでフォーマット
```

ESLint設定: `eslint.config.mjs`
TypeScript設定: `tsconfig.json`
