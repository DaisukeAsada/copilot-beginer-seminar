/**
 * SearchPage テスト
 *
 * 蔵書検索画面のテスト
 * Task 11.2: 蔵書検索画面
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchPage } from './SearchPage';
import * as searchApi from '../lib/search-api';
import type { SearchResult, SearchBook } from '../lib/search-api';

// API モック
vi.mock('../lib/search-api');

const mockSearchBooks: readonly SearchBook[] = [
  {
    id: 'book-1',
    title: 'TypeScript入門',
    author: '山田太郎',
    publisher: '技術評論社',
    publicationYear: 2024,
    isbn: '9784123456789',
    category: 'プログラミング',
    availableCopies: 3,
    totalCopies: 5,
  },
  {
    id: 'book-2',
    title: 'React実践ガイド',
    author: '佐藤花子',
    publisher: 'オライリー・ジャパン',
    publicationYear: 2023,
    isbn: '9784987654321',
    category: 'プログラミング',
    availableCopies: 0,
    totalCopies: 2,
  },
  {
    id: 'book-3',
    title: '図書館学入門',
    author: '鈴木一郎',
    publisher: '岩波書店',
    publicationYear: 2020,
    isbn: '9784000000000',
    category: '図書館学',
    availableCopies: 1,
    totalCopies: 1,
  },
];

const mockSearchResult: SearchResult = {
  books: mockSearchBooks,
  total: 3,
  page: 1,
  limit: 20,
  totalPages: 1,
};

describe('SearchPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(searchApi.searchBooks).mockResolvedValue(mockSearchResult);
  });

  describe('画面表示', () => {
    it('ページタイトルが表示される', async () => {
      render(<SearchPage />);

      expect(screen.getByRole('heading', { name: '蔵書検索' })).toBeInTheDocument();
    });

    it('検索フォームが表示される', async () => {
      render(<SearchPage />);

      expect(screen.getByPlaceholderText('タイトル、著者、ISBN、カテゴリで検索')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
    });

    it('詳細検索オプションが表示される', async () => {
      render(<SearchPage />);

      // 詳細検索を開く
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: '詳細検索' }));

      expect(screen.getByLabelText('出版年（開始）')).toBeInTheDocument();
      expect(screen.getByLabelText('出版年（終了）')).toBeInTheDocument();
      expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument();
      expect(screen.getByLabelText('貸出可能のみ')).toBeInTheDocument();
    });

    it('初期状態で検索結果が表示される', async () => {
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
        expect(screen.getByText('React実践ガイド')).toBeInTheDocument();
        expect(screen.getByText('図書館学入門')).toBeInTheDocument();
      });
    });
  });

  describe('検索機能 (Req 2.1, 2.2)', () => {
    it('キーワード検索が実行できる', async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('タイトル、著者、ISBN、カテゴリで検索');
      await user.type(searchInput, 'TypeScript');
      await user.click(screen.getByRole('button', { name: '検索' }));

      await waitFor(() => {
        expect(searchApi.searchBooks).toHaveBeenCalledWith(
          expect.objectContaining({ keyword: 'TypeScript' })
        );
      });
    });

    it('検索結果が0件の場合はメッセージが表示される', async () => {
      vi.mocked(searchApi.searchBooks).mockResolvedValue({
        books: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('該当する蔵書がありません')).toBeInTheDocument();
      });
    });
  });

  describe('詳細検索 (Req 2.4)', () => {
    it('出版年範囲で絞り込みができる', async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });

      // 詳細検索を開く
      await user.click(screen.getByRole('button', { name: '詳細検索' }));

      await user.type(screen.getByLabelText('出版年（開始）'), '2022');
      await user.type(screen.getByLabelText('出版年（終了）'), '2024');
      await user.click(screen.getByRole('button', { name: '検索' }));

      await waitFor(() => {
        expect(searchApi.searchBooks).toHaveBeenCalledWith(
          expect.objectContaining({
            publicationYearFrom: 2022,
            publicationYearTo: 2024,
          })
        );
      });
    });

    it('カテゴリで絞り込みができる', async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });

      // 詳細検索を開く
      await user.click(screen.getByRole('button', { name: '詳細検索' }));

      await user.type(screen.getByLabelText('カテゴリ'), 'プログラミング');
      await user.click(screen.getByRole('button', { name: '検索' }));

      await waitFor(() => {
        expect(searchApi.searchBooks).toHaveBeenCalledWith(
          expect.objectContaining({ category: 'プログラミング' })
        );
      });
    });

    it('貸出可能のみで絞り込みができる', async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });

      // 詳細検索を開く
      await user.click(screen.getByRole('button', { name: '詳細検索' }));

      await user.click(screen.getByLabelText('貸出可能のみ'));
      await user.click(screen.getByRole('button', { name: '検索' }));

      await waitFor(() => {
        expect(searchApi.searchBooks).toHaveBeenCalledWith(
          expect.objectContaining({ availableOnly: true })
        );
      });
    });
  });

  describe('ソート機能 (Req 2.5)', () => {
    it('タイトル順でソートができる', async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });

      // タイトルヘッダーをクリック
      const titleHeader = screen.getByRole('columnheader', { name: /タイトル/ });
      await user.click(titleHeader);

      await waitFor(() => {
        expect(searchApi.searchBooks).toHaveBeenCalledWith(
          expect.objectContaining({ sortBy: 'title', sortOrder: 'asc' })
        );
      });
    });

    it('著者順でソートができる', async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });

      // 著者ヘッダーをクリック
      const authorHeader = screen.getByRole('columnheader', { name: /著者/ });
      await user.click(authorHeader);

      await waitFor(() => {
        expect(searchApi.searchBooks).toHaveBeenCalledWith(
          expect.objectContaining({ sortBy: 'author', sortOrder: 'asc' })
        );
      });
    });

    it('出版年順でソートができる', async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });

      // 出版年ヘッダーをクリック
      const yearHeader = screen.getByRole('columnheader', { name: /出版年/ });
      await user.click(yearHeader);

      await waitFor(() => {
        expect(searchApi.searchBooks).toHaveBeenCalledWith(
          expect.objectContaining({ sortBy: 'publicationYear', sortOrder: 'asc' })
        );
      });
    });

    it('同じカラムを再クリックで降順に切り替わる', async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      // 初期ロード完了を待つ
      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });

      // 1回目クリック: 昇順
      const titleHeader = screen.getByRole('columnheader', { name: /タイトル/ });
      await user.click(titleHeader);

      // ローディング後にデータ再表示を待つ
      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /タイトル/ })).toHaveAttribute('aria-sort', 'ascending');
      });

      // 2回目クリック: 降順
      await user.click(screen.getByRole('columnheader', { name: /タイトル/ }));

      // ローディング後にデータ再表示を待つ
      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /タイトル/ })).toHaveAttribute('aria-sort', 'descending');
      });

      // descで呼び出されたことを確認
      expect(searchApi.searchBooks).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'title', sortOrder: 'desc' })
      );
    });
  });

  describe('書籍詳細表示 (Req 2.3)', () => {
    it('書籍行をクリックすると詳細が表示される', async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });

      // 書籍行をクリック
      await user.click(screen.getByText('TypeScript入門'));

      // 詳細情報が表示される（モーダル内を確認）
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('書籍詳細')).toBeInTheDocument();
        expect(within(dialog).getByText('TypeScript入門')).toBeInTheDocument();
        expect(within(dialog).getByText('山田太郎')).toBeInTheDocument();
        expect(within(dialog).getByText('技術評論社')).toBeInTheDocument();
      });
    });

    it('貸出状況が表示される', async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('TypeScript入門')).toBeInTheDocument();
      });

      // 書籍行をクリック
      await user.click(screen.getByText('TypeScript入門'));

      // 貸出状況が表示される
      await waitFor(() => {
        expect(screen.getByText(/貸出可能: 3 \/ 5/)).toBeInTheDocument();
      });
    });

    it('貸出不可の場合は「貸出中」と表示される', async () => {
      const user = userEvent.setup();
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('React実践ガイド')).toBeInTheDocument();
      });

      // 貸出不可の書籍行をクリック
      await user.click(screen.getByText('React実践ガイド'));

      await waitFor(() => {
        expect(screen.getByText(/貸出可能: 0 \/ 2/)).toBeInTheDocument();
        expect(screen.getByText('すべて貸出中')).toBeInTheDocument();
      });
    });
  });

  describe('データ取得', () => {
    it('データ取得中はローディング表示', async () => {
      vi.mocked(searchApi.searchBooks).mockImplementation(
        () => new Promise(() => {})
      );

      render(<SearchPage />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('エラー時はエラーメッセージが表示される', async () => {
      vi.mocked(searchApi.searchBooks).mockRejectedValue(new Error('Network error'));

      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByText('検索に失敗しました')).toBeInTheDocument();
      });
    });
  });
});
