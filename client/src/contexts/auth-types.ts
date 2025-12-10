import { createContext } from 'react';

/**
 * ユーザーロール
 */
export type UserRole = 'user' | 'librarian' | 'admin';

/**
 * 認証済みユーザー情報
 */
export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

/**
 * 認証コンテキストの値
 */
export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
