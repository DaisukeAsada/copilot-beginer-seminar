import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { BooksPage } from '../pages/BooksPage';
import { SearchPage } from '../pages/SearchPage';
import { LoansPage } from '../pages/LoansPage';
import { UsersPage } from '../pages/UsersPage';
import { ReservationsPage } from '../pages/ReservationsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

/**
 * アプリケーションルート定義
 */
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
