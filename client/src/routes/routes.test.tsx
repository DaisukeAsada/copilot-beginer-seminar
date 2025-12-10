import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './routes';

describe('AppRoutes', () => {
  describe('ルートパス', () => {
    it('/ でホームページを表示する', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      );

      expect(screen.getByText(/図書館蔵書管理システム/i)).toBeInTheDocument();
    });
  });

  describe('蔵書管理ルート', () => {
    it('/books で書籍一覧ページを表示する', () => {
      render(
        <MemoryRouter initialEntries={['/books']}>
          <AppRoutes />
        </MemoryRouter>
      );

      expect(screen.getByTestId('books-page')).toBeInTheDocument();
    });

    it('/books/search で検索ページを表示する', () => {
      render(
        <MemoryRouter initialEntries={['/books/search']}>
          <AppRoutes />
        </MemoryRouter>
      );

      expect(screen.getByTestId('search-page')).toBeInTheDocument();
    });
  });

  describe('貸出管理ルート', () => {
    it('/loans で貸出一覧ページを表示する', () => {
      render(
        <MemoryRouter initialEntries={['/loans']}>
          <AppRoutes />
        </MemoryRouter>
      );

      expect(screen.getByTestId('loans-page')).toBeInTheDocument();
    });
  });

  describe('利用者管理ルート', () => {
    it('/users で利用者一覧ページを表示する', () => {
      render(
        <MemoryRouter initialEntries={['/users']}>
          <AppRoutes />
        </MemoryRouter>
      );

      expect(screen.getByTestId('users-page')).toBeInTheDocument();
    });
  });

  describe('予約ルート', () => {
    it('/reservations で予約一覧ページを表示する', () => {
      render(
        <MemoryRouter initialEntries={['/reservations']}>
          <AppRoutes />
        </MemoryRouter>
      );

      expect(screen.getByTestId('reservations-page')).toBeInTheDocument();
    });
  });

  describe('レポートルート', () => {
    it('/reports でレポートページを表示する', () => {
      render(
        <MemoryRouter initialEntries={['/reports']}>
          <AppRoutes />
        </MemoryRouter>
      );

      expect(screen.getByTestId('reports-page')).toBeInTheDocument();
    });
  });

  describe('存在しないルート', () => {
    it('存在しないパスで404ページを表示する', () => {
      render(
        <MemoryRouter initialEntries={['/nonexistent']}>
          <AppRoutes />
        </MemoryRouter>
      );

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });
  });
});
