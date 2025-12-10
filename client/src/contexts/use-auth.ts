import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './auth-types';

/**
 * 認証コンテキストを使用するカスタムフック
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
