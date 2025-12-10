import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { DataTable, Alert, type Column, type SortDirection } from '../components';
import {
  searchBooks,
  type SearchBook,
  type SearchParams,
  type SearchSortBy,
  type SearchSortOrder,
} from '../lib/search-api';

// ============================================
// 型定義
// ============================================

/** 検索フォームデータ */
interface SearchFormData {
  keyword: string;
  publicationYearFrom: string;
  publicationYearTo: string;
  category: string;
  availableOnly: boolean;
}

/** アラート情報 */
interface AlertInfo {
  message: string;
  type: 'success' | 'error';
}

// ============================================
// 初期値
// ============================================

const initialFormData: SearchFormData = {
  keyword: '',
  publicationYearFrom: '',
  publicationYearTo: '',
  category: '',
  availableOnly: false,
};

// ============================================
// カラム定義
// ============================================

const createColumns = (): Column<SearchBook>[] => [
  { key: 'title', header: 'タイトル', sortable: true },
  { key: 'author', header: '著者', sortable: true },
  { key: 'isbn', header: 'ISBN' },
  { key: 'publisher', header: '出版社', render: (book) => book.publisher ?? '-' },
  { key: 'publicationYear', header: '出版年', sortable: true, render: (book) => book.publicationYear?.toString() ?? '-' },
  { key: 'category', header: 'カテゴリ', render: (book) => book.category ?? '-' },
  {
    key: 'availableCopies',
    header: '貸出状況',
    render: (book) => {
      const available = book.availableCopies;
      const total = book.totalCopies;
      if (available === 0) {
        return <span className="search-page-status-unavailable">貸出不可</span>;
      }
      return <span className="search-page-status-available">貸出可能 ({available}/{total})</span>;
    },
  },
];

// ============================================
// コンポーネント
// ============================================

/**
 * 蔵書検索ページ
 * Task 11.2: 蔵書検索画面
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export function SearchPage(): React.ReactElement {
  // ステート
  const [books, setBooks] = useState<readonly SearchBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<SearchFormData>(initialFormData);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [alert, setAlert] = useState<AlertInfo | null>(null);
  const [sortBy, setSortBy] = useState<SearchSortBy | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<SearchSortOrder | undefined>(undefined);
  const [selectedBook, setSelectedBook] = useState<SearchBook | null>(null);

  // 検索実行
  const executeSearch = useCallback(async (params: SearchParams) => {
    setLoading(true);
    try {
      const result = await searchBooks(params);
      setBooks(result.books);
    } catch {
      setAlert({ message: '検索に失敗しました', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // 初期ロード
  useEffect(() => {
    void executeSearch({});
  }, [executeSearch]);

  // フォーム送信
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const params: SearchParams = {
        keyword: formData.keyword !== '' ? formData.keyword : undefined,
        publicationYearFrom:
          formData.publicationYearFrom !== ''
            ? parseInt(formData.publicationYearFrom, 10)
            : undefined,
        publicationYearTo:
          formData.publicationYearTo !== ''
            ? parseInt(formData.publicationYearTo, 10)
            : undefined,
        category: formData.category !== '' ? formData.category : undefined,
        availableOnly: formData.availableOnly || undefined,
        sortBy,
        sortOrder,
      };

      await executeSearch(params);
    },
    [formData, sortBy, sortOrder, executeSearch]
  );

  // ソート処理
  const handleSort = useCallback(
    async (key: string, direction: SortDirection) => {
      const newSortBy = key as SearchSortBy;
      const newSortOrder = direction as SearchSortOrder;
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);

      const params: SearchParams = {
        keyword: formData.keyword !== '' ? formData.keyword : undefined,
        publicationYearFrom:
          formData.publicationYearFrom !== ''
            ? parseInt(formData.publicationYearFrom, 10)
            : undefined,
        publicationYearTo:
          formData.publicationYearTo !== ''
            ? parseInt(formData.publicationYearTo, 10)
            : undefined,
        category: formData.category !== '' ? formData.category : undefined,
        availableOnly: formData.availableOnly || undefined,
        sortBy: newSortBy,
        sortOrder: newSortOrder,
      };

      await executeSearch(params);
    },
    [formData, executeSearch]
  );

  // 行クリック
  const handleRowClick = useCallback((book: SearchBook) => {
    setSelectedBook(book);
  }, []);

  // 詳細閉じる
  const handleCloseDetail = useCallback(() => {
    setSelectedBook(null);
  }, []);

  // アラートを閉じる
  const handleCloseAlert = useCallback(() => {
    setAlert(null);
  }, []);

  // 詳細検索トグル
  const handleToggleAdvanced = useCallback(() => {
    setShowAdvanced((prev) => !prev);
  }, []);

  // カラム定義
  const columns = createColumns();

  return (
    <div data-testid="search-page" className="search-page">
      <h1>蔵書検索</h1>

      {/* アラート */}
      {alert !== null && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={handleCloseAlert}
          autoHide={5000}
          dismissible
        />
      )}

      {/* 検索フォーム */}
      <form onSubmit={handleSubmit} className="search-page-form">
        <div className="search-page-search-row">
          <input
            type="text"
            className="search-page-keyword-input"
            placeholder="タイトル、著者、ISBN、カテゴリで検索"
            value={formData.keyword}
            onChange={(e) => setFormData((prev) => ({ ...prev, keyword: e.target.value }))}
          />
          <button type="submit" className="search-page-search-button">
            検索
          </button>
          <button
            type="button"
            className="search-page-advanced-button"
            onClick={handleToggleAdvanced}
          >
            詳細検索
          </button>
        </div>

        {/* 詳細検索オプション */}
        {showAdvanced && (
          <div className="search-page-advanced-options">
            <div className="search-page-advanced-row">
              <label htmlFor="publicationYearFrom" className="search-page-label">
                出版年（開始）
              </label>
              <input
                type="number"
                id="publicationYearFrom"
                className="search-page-year-input"
                value={formData.publicationYearFrom}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, publicationYearFrom: e.target.value }))
                }
              />
            </div>
            <div className="search-page-advanced-row">
              <label htmlFor="publicationYearTo" className="search-page-label">
                出版年（終了）
              </label>
              <input
                type="number"
                id="publicationYearTo"
                className="search-page-year-input"
                value={formData.publicationYearTo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, publicationYearTo: e.target.value }))
                }
              />
            </div>
            <div className="search-page-advanced-row">
              <label htmlFor="category" className="search-page-label">
                カテゴリ
              </label>
              <input
                type="text"
                id="category"
                className="search-page-category-input"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="search-page-advanced-row">
              <label htmlFor="availableOnly" className="search-page-checkbox-label">
                <input
                  type="checkbox"
                  id="availableOnly"
                  checked={formData.availableOnly}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, availableOnly: e.target.checked }))
                  }
                />
                貸出可能のみ
              </label>
            </div>
          </div>
        )}
      </form>

      {/* 検索結果 */}
      <DataTable<SearchBook>
        data={books}
        columns={columns}
        keyField="id"
        loading={loading}
        emptyMessage="該当する蔵書がありません"
        ariaLabel="蔵書検索結果"
        onSort={handleSort}
        sortKey={sortBy}
        sortDirection={sortOrder}
        onRowClick={handleRowClick}
      />

      {/* 書籍詳細モーダル */}
      {selectedBook !== null && (
        <div className="search-page-modal-overlay" onClick={handleCloseDetail}>
          <div
            className="search-page-modal"
            role="dialog"
            aria-labelledby="book-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="book-detail-title">書籍詳細</h2>
            <dl className="search-page-detail-list">
              <dt>タイトル</dt>
              <dd>{selectedBook.title}</dd>
              <dt>著者</dt>
              <dd>{selectedBook.author}</dd>
              <dt>出版社</dt>
              <dd>{selectedBook.publisher ?? '-'}</dd>
              <dt>出版年</dt>
              <dd>{selectedBook.publicationYear?.toString() ?? '-'}</dd>
              <dt>ISBN</dt>
              <dd>{selectedBook.isbn}</dd>
              <dt>カテゴリ</dt>
              <dd>{selectedBook.category ?? '-'}</dd>
              <dt>貸出状況</dt>
              <dd>
                貸出可能: {selectedBook.availableCopies} / {selectedBook.totalCopies}
                {selectedBook.availableCopies === 0 && (
                  <span className="search-page-all-borrowed"> すべて貸出中</span>
                )}
              </dd>
            </dl>
            <button
              type="button"
              className="search-page-close-button"
              onClick={handleCloseDetail}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
