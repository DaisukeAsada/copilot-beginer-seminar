/**
 * 検索API クライアント
 *
 * 蔵書検索のREST APIとの通信を行うための関数群
 * Task 11.2: 蔵書検索画面
 */

import { apiClient } from './api-client';

// ============================================
// 型定義
// ============================================

/** ソートフィールド */
export type SearchSortBy = 'title' | 'author' | 'publicationYear';

/** ソート順序 */
export type SearchSortOrder = 'asc' | 'desc';

/** 検索書籍 */
export interface SearchBook {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly publisher: string | null;
  readonly publicationYear: number | null;
  readonly isbn: string;
  readonly category: string | null;
  readonly availableCopies: number;
  readonly totalCopies: number;
}

/** 検索結果 */
export interface SearchResult {
  readonly books: readonly SearchBook[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

/** 検索パラメータ */
export interface SearchParams {
  /** 検索キーワード */
  readonly keyword?: string;
  /** ソートフィールド */
  readonly sortBy?: SearchSortBy;
  /** ソート順序 */
  readonly sortOrder?: SearchSortOrder;
  /** 出版年の開始（以上） */
  readonly publicationYearFrom?: number;
  /** 出版年の終了（以下） */
  readonly publicationYearTo?: number;
  /** カテゴリ */
  readonly category?: string;
  /** 貸出可能のみ */
  readonly availableOnly?: boolean;
  /** ページ番号 */
  readonly page?: number;
  /** ページサイズ */
  readonly limit?: number;
}

// ============================================
// API 関数
// ============================================

const API_BASE = '/api/books/search';

/**
 * 書籍を検索
 */
export async function searchBooks(params: SearchParams = {}): Promise<SearchResult> {
  const queryParams = new URLSearchParams();

  if (params.keyword !== undefined && params.keyword !== '') {
    queryParams.set('keyword', params.keyword);
  }
  if (params.sortBy !== undefined) {
    queryParams.set('sortBy', params.sortBy);
  }
  if (params.sortOrder !== undefined) {
    queryParams.set('sortOrder', params.sortOrder);
  }
  if (params.publicationYearFrom !== undefined) {
    queryParams.set('publicationYearFrom', params.publicationYearFrom.toString());
  }
  if (params.publicationYearTo !== undefined) {
    queryParams.set('publicationYearTo', params.publicationYearTo.toString());
  }
  if (params.category !== undefined && params.category !== '') {
    queryParams.set('category', params.category);
  }
  if (params.availableOnly === true) {
    queryParams.set('availableOnly', 'true');
  }
  if (params.page !== undefined) {
    queryParams.set('page', params.page.toString());
  }
  if (params.limit !== undefined) {
    queryParams.set('limit', params.limit.toString());
  }

  const queryString = queryParams.toString();
  const url = queryString !== '' ? `${API_BASE}?${queryString}` : API_BASE;

  return apiClient.get<SearchResult>(url);
}
