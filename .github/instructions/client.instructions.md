---
name: Client-side Development
description: React + TypeScript クライアントサイド開発向けのコーディング規約とパターン
applyTo: "client/src/**/*.{ts,tsx}"
---

# クライアントサイド開発ガイド（React + TypeScript）

このファイルは図書館蔵書管理システムのクライアントサイド（`client/src/`）開発において遵守すべき規約とパターンを定義しています。

## アーキテクチャ概要

### フォルダ構成

```
client/src/
├── components/       # 再利用可能なUI コンポーネント
│   ├── FormInput.tsx         # バリデーション付き入力フィールド
│   ├── DataTable.tsx         # ソート・フィルタ機能付きテーブル
│   ├── Alert.tsx             # 通知・エラー表示
│   ├── ConfirmDialog.tsx     # 確認ダイアログ
│   └── index.ts              # 公開API
├── pages/            # ページコンポーネント（メインUI）
│   ├── BooksPage.tsx
│   ├── SearchPage.tsx
│   ├── LoansPage.tsx
│   ├── UsersPage.tsx
│   ├── ReservationsPage.tsx
│   ├── ReportsPage.tsx
│   └── HomePage.tsx
├── routes/           # ルーティング定義
│   └── routes.tsx    # React Routerの設定
├── contexts/         # Context API（状態管理）
│   ├── auth-context.tsx  # 認証状態管理
│   ├── auth-types.ts     # Context型定義
│   └── use-auth.ts       # useAuth カスタムフック
├── lib/              # API クライアント関数
│   ├── api-client.ts         # 基本HTTP通信
│   ├── book-api.ts           # 書籍API
│   ├── user-api.ts           # 利用者API
│   ├── loan-api.ts           # 貸出API
│   ├── search-api.ts         # 検索API
│   ├── reservation-api.ts    # 予約API
│   └── report-api.ts         # レポートAPI
└── test/             # テスト設定
```

**重要**: コンポーネント（UI）とページ（機能）を明確に分離。

## コンポーネント設計パターン

### 1. FormInput コンポーネント（バリデーション付き入力）

**バリデーションルールを定義し、リアルタイム検証を実現。**

```typescript
// components/FormInput.tsx
export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

export interface FormInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  validationRules?: ValidationRule[];
  error?: string;  // サーバーエラーを表示
  onValidationChange?: (isValid: boolean) => void;
}

// 使用例
<FormInput
  id="email"
  label="メールアドレス"
  value={formData.email}
  onChange={(value) => setFormData({ ...formData, email: value })}
  required={true}
  validationRules={[
    {
      validate: (v) => /^[\w.-]+@[\w.-]+\.\w+$/.test(v),
      message: '有効なメールアドレスを入力してください',
    },
  ]}
  error={serverErrors.email}  // サーバーの検証エラー
  onValidationChange={(isValid) => setFieldValid('email', isValid)}
/>
```

**重要**:
- 入力値変更はonChange経由（再レンダリング最小化）
- バリデーションはtouched後リアルタイム実行
- サーバーエラーはerrorプロップで表示

### 2. DataTable コンポーネント（ソート・フィルタ機能付きテーブル）

**汎用テーブルで、カスタム列定義とアクション機能に対応。**

```typescript
// components/DataTable.tsx
interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactElement;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
}

// 使用例
const columns: Column<Book>[] = [
  { key: 'title', header: 'タイトル', sortable: true },
  { key: 'author', header: '著者', sortable: true },
  {
    key: 'id',
    header: '操作',
    render: (book) => (
      <div>
        <button onClick={() => handleEdit(book)}>編集</button>
        <button onClick={() => handleDelete(book)}>削除</button>
      </div>
    ),
  },
];

<DataTable<Book>
  columns={columns}
  data={books}
  loading={isLoading}
  onRowClick={(book) => console.log(book.id)}
/>
```

### 3. Alert コンポーネント（通知・エラー表示）

**ユーザーフィードバック用。成功メッセージとエラーメッセージを表示。**

```typescript
// components/Alert.tsx
interface AlertProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
  autoDismiss?: number;  // ミリ秒
}

// ページ内での使用例
const [alert, setAlert] = useState<AlertInfo | null>(null);

// API呼び出し成功時
setAlert({ message: '保存しました', type: 'success' });

// API呼び出し失敗時
setAlert({ message: error.message, type: 'error' });

// 表示
{alert && <Alert message={alert.message} type={alert.type} />}
```

### 4. ConfirmDialog コンポーネント（確認ダイアログ）

**削除やリスク操作の確認時に使用。**

```typescript
interface ConfirmDialogProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

// ページ内での使用例
const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

const handleDeleteBook = (book: Book) => {
  setConfirmDialog({
    message: `"${book.title}"を削除してもよろしいですか？`,
    onConfirm: async () => {
      try {
        await deleteBook(book.id);
        setAlert({ message: '削除しました', type: 'success' });
        // 一覧を再取得
      } catch (error) {
        setAlert({ message: '削除に失敗しました', type: 'error' });
      }
      setConfirmDialog(null);
    },
    onCancel: () => setConfirmDialog(null),
  });
};

{confirmDialog && <ConfirmDialog {...confirmDialog} />}
```

## API クライアント層（lib/）

### 基本HTTP通信クラス（api-client.ts）

**すべてのAPI呼び出しを一元化。認証トークン・エラーハンドリングを統一。**

```typescript
// lib/api-client.ts
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly data?: unknown
  ) {
    super(message);
  }
}

async function request<T>(
  url: string,
  method: string,
  body?: unknown,
  options?: ApiClientOptions
): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.token && { 'Authorization': `Bearer ${options.token}` }),
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error.message, error);
  }

  return response.json();
}
```

### ドメイン別API関数（book-api.ts, user-api.ts等）

**バックエンドのエンドポイントをドメイン別に関数化。**

```typescript
// lib/book-api.ts
export async function createBook(input: CreateBookInput): Promise<Book> {
  return request<Book>('/api/books', 'POST', input);
}

export async function updateBook(id: string, input: UpdateBookInput): Promise<Book> {
  return request<Book>(`/api/books/${id}`, 'PUT', input);
}

export async function deleteBook(id: string): Promise<void> {
  await request<void>(`/api/books/${id}`, 'DELETE');
}

export async function getBooks(): Promise<Book[]> {
  return request<Book[]>('/api/books', 'GET');
}
```

**重要**: コンポーネント内での直接fetch呼び出しを避ける。必ずlib層の関数を使用。

## ページコンポーネント（pages/）

**各機能の主要UIを統合。フォーム、テーブル、状態管理を組織化。**

```typescript
// pages/BooksPage.tsx
interface BookFormData {
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  category?: string;
}

interface AlertInfo {
  message: string;
  type: 'success' | 'error';
}

export function BooksPage(): React.ReactElement {
  const [formData, setFormData] = useState<BookFormData>(initialFormData);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertInfo | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // 初期化: 一覧取得
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const data = await getBooks();
      setBooks(data);
    } catch (error) {
      setAlert({ message: '一覧取得に失敗しました', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // フォーム送信
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'create') {
        const created = await createBook(formData);
        setBooks([...books, created]);
        setAlert({ message: '作成しました', type: 'success' });
      } else {
        const updated = await updateBook(editingId!, formData);
        setBooks(books.map(b => b.id === editingId ? updated : b));
        setAlert({ message: '更新しました', type: 'success' });
      }
      resetForm();
    } catch (error) {
      setAlert({ message: `${mode === 'create' ? '作成' : '更新'}に失敗しました`, type: 'error' });
    }
  };

  const handleEdit = (book: Book) => {
    setFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      isbn: book.isbn,
      category: book.category,
    });
    setMode('edit');
    setEditingId(book.id);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setMode('create');
    setEditingId(null);
  };

  return (
    <div>
      <h1>書籍管理</h1>
      <form onSubmit={handleSubmit}>
        <FormInput
          id="title"
          label="タイトル"
          value={formData.title}
          onChange={(v) => setFormData({ ...formData, title: v })}
          required={true}
        />
        {/* その他の入力フィールド */}
        <button type="submit">{mode === 'create' ? '作成' : '更新'}</button>
      </form>
      <DataTable<Book> columns={columns} data={books} loading={isLoading} />
      {alert && <Alert message={alert.message} type={alert.type} />}
    </div>
  );
}
```

**ページコンポーネントの責務**:
1. 状態管理（フォーム・一覧・ローディング）
2. API呼び出しのオーケストレーション
3. UI コンポーネントの構成

## 認証状態管理（Context API）

**ログイン状態をアプリ全体で共有。**

```typescript
// contexts/auth-context.tsx
export interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'librarian' | 'user';
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback((newUser: AuthUser) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// contexts/use-auth.ts（カスタムフック）
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// 使用例
function MyComponent(): React.ReactElement {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <div>
      {isAuthenticated && <span>ユーザー: {user?.name}</span>}
      <button onClick={logout}>ログアウト</button>
    </div>
  );
}
```

## ルーティング（React Router）

**SPA内のページ遷移を管理。**

```typescript
// routes/routes.tsx
export function AppRoutes(): React.ReactElement {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/books" element={<BooksPage />} />
      <Route path="/books/search" element={<SearchPage />} />
      <Route path="/loans" element={<LoansPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/reservations" element={<ReservationsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
```

## テスト（Vitest + React Testing Library）

**コンポーネントの動作をテスト。**

```typescript
// components/FormInput.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormInput } from './FormInput';

describe('FormInput', () => {
  it('バリデーション失敗時にエラーメッセージを表示', async () => {
    const handleValidationChange = vi.fn();
    
    render(
      <FormInput
        id="test"
        label="Test"
        value="a"
        onChange={vi.fn()}
        validationRules={[
          {
            validate: (v) => v.length > 3,
            message: '4文字以上入力してください',
          },
        ]}
        onValidationChange={handleValidationChange}
      />
    );

    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.type(input, 'bc');
    await userEvent.click(document.body); // blur

    expect(screen.getByText('4文字以上入力してください')).toBeInTheDocument();
    expect(handleValidationChange).toHaveBeenCalledWith(false);
  });
});
```

テストコマンド:
```bash
cd client
npm test          # ウォッチモード
npm run test:run  # 1回のみ実行
```

## コーディング規約

### React コンポーネント

```typescript
// ✅ 正しい：関数型コンポーネント
export function MyComponent(): React.ReactElement {
  const [state, setState] = useState<string>('');
  
  return <div>{state}</div>;
}

// ❌ 間違い：クラスコンポーネント
class MyComponent extends React.Component { }
```

### 型定義

**Props・State・UIの状態は常に型定義。**

```typescript
interface MyComponentProps {
  readonly title: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

interface FormData {
  readonly name: string;
  readonly email: string;
}
```

### エラーハンドリング

**API呼び出しは常にtry-catchでラップ。ユーザーにはAlert経由で通知。**

```typescript
try {
  const result = await apiFunction();
  setData(result);
  setAlert({ message: '成功', type: 'success' });
} catch (error) {
  if (error instanceof ApiError) {
    setAlert({ message: error.message, type: 'error' });
  } else {
    setAlert({ message: '予期しないエラーが発生しました', type: 'error' });
  }
}
```

## Lint と型チェック

```bash
cd client
npm run lint       # ESLintで静的解析
npm run build      # TypeScriptコンパイルとビルド
```

ESLint設定: `client/eslint.config.js`
TypeScript設定: `client/tsconfig.app.json`
