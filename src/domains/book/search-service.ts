/**
 * SearchService - 蔵書検索サービス
 *
 * 蔵書検索処理を提供します。
 * タイトル、著者、ISBN、カテゴリによる部分一致検索と
 * 検索結果のソート機能を実装します。
 * Task 3.2: 詳細検索とフィルタリング機能（出版年範囲、カテゴリ、貸出可能のみ）
 */

import type { Result } from '../../shared/result.js';
import { ok } from '../../shared/result.js';
import type {
  SearchRepository,
  SearchBooksInput,
  SearchBooksResult,
  SearchSortBy,
  SearchSortOrder,
} from './search-repository.js';

// ============================================
// サービスインターフェース
// ============================================

/** 検索サービスの検索入力 */
export interface SearchInput {
  /** 検索キーワード（タイトル、著者、ISBN、カテゴリで部分一致） */
  readonly keyword: string;
  /** ソートフィールド */
  readonly sortBy?: SearchSortBy;
  /** ソート順序 */
  readonly sortOrder?: SearchSortOrder;
  /** 出版年の開始（以上） */
  readonly publicationYearFrom?: number;
  /** 出版年の終了（以下） */
  readonly publicationYearTo?: number;
  /** カテゴリによる絞り込み */
  readonly category?: string;
  /** 貸出可能書籍のみ */
  readonly availableOnly?: boolean;
}

/** SearchService インターフェース */
export interface SearchService {
  /**
   * 書籍を検索
   * @param input - 検索パラメータ
   * @returns 検索結果
   */
  search(input: SearchInput): Promise<Result<SearchBooksResult, never>>;
}

// ============================================
// サービス実装
// ============================================

/**
 * SearchServiceを作成
 * @param repository - 検索リポジトリ
 * @returns SearchService
 */
export function createSearchService(repository: SearchRepository): SearchService {
  return {
    async search(input: SearchInput): Promise<Result<SearchBooksResult, never>> {
      const searchParams: SearchBooksInput = {
        keyword: input.keyword,
        ...(input.sortBy !== undefined && { sortBy: input.sortBy }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.publicationYearFrom !== undefined && { publicationYearFrom: input.publicationYearFrom }),
        ...(input.publicationYearTo !== undefined && { publicationYearTo: input.publicationYearTo }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.availableOnly !== undefined && { availableOnly: input.availableOnly }),
      };

      const result = await repository.search(searchParams);

      return ok(result);
    },
  };
}
