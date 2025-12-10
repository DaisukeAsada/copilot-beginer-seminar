/**
 * Report Repository Interface
 *
 * レポートデータの取得を担当するリポジトリのインターフェース定義。
 * 具体的な実装は Infrastructure 層で行います。
 */

import type { DateRange, PopularBookItem, CategoryStatisticsItem } from './types.js';

// ============================================
// リポジトリインターフェース
// ============================================

/** レポートリポジトリ */
export interface ReportRepository {
  /**
   * 期間内の貸出数を取得
   * @param dateRange - 集計期間
   * @returns 貸出数
   */
  countLoans(dateRange: DateRange): Promise<number>;

  /**
   * 期間内の返却数を取得
   * @param dateRange - 集計期間
   * @returns 返却数
   */
  countReturns(dateRange: DateRange): Promise<number>;

  /**
   * 期間内の延滞数を取得
   * @param dateRange - 集計期間
   * @returns 延滞数
   */
  countOverdues(dateRange: DateRange): Promise<number>;

  /**
   * 人気書籍ランキングを取得
   * @param dateRange - 集計期間
   * @param limit - 取得件数上限
   * @returns 人気書籍ランキング項目の配列
   */
  getPopularBooks(dateRange: DateRange, limit: number): Promise<PopularBookItem[]>;

  /**
   * カテゴリ別貸出統計を取得
   * @param dateRange - 集計期間
   * @returns カテゴリ別貸出統計項目の配列
   */
  getCategoryStatistics(dateRange: DateRange): Promise<CategoryStatisticsItem[]>;
}
