import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './auth-context';
import { useAuth } from './use-auth';

// テスト用コンポーネント
function TestComponent(): React.ReactElement {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user-name">{user?.name ?? 'no-user'}</div>
      <div data-testid="user-role">{user?.role ?? 'no-role'}</div>
      <button onClick={() => login({ id: '1', name: 'テスト利用者', role: 'user' })}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  describe('初期状態', () => {
    it('認証されていない状態で開始する', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('no-user');
    });
  });

  describe('login', () => {
    it('ログインするとユーザー情報が設定される', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await user.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-name')).toHaveTextContent('テスト利用者');
        expect(screen.getByTestId('user-role')).toHaveTextContent('user');
      });
    });
  });

  describe('logout', () => {
    it('ログアウトするとユーザー情報がクリアされる', async () => {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // まずログイン
      await user.click(screen.getByRole('button', { name: 'Login' }));
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // ログアウト
      await user.click(screen.getByRole('button', { name: 'Logout' }));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user-name')).toHaveTextContent('no-user');
      });
    });
  });
});

describe('useAuth', () => {
  it('AuthProvider外で使用するとエラーをスローする', () => {
    // エラーをキャッチするためにconsole.errorを抑制
    const originalError = console.error;
    console.error = () => {};

    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider');

    console.error = originalError;
  });
});
