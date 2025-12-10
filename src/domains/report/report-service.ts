/**
 * ReportService - レポート・統計サービス
 *
 * 貸出統計、人気書籍ランキング、カテゴリ別統計を提供します。
 */

import type { Result } from '../../shared/result.js';
import { ok, err } from '../../shared/result.js';
import type { ReportRepository } from './report-repository.js';
import type {
  DateRange,
  StatisticsSummary,
  PopularBooksRanking,
  CategoryStatistics,
  ReportError,
} from './types.js';

// ============================================
// サービスインターフェース
// ============================================

/** ReportService インターフェース */
export interface ReportService {
  /**
   * 統計サマリーを取得
   * @param dateRange - 集計期間
   * @returns 統計サマリーまたはエラー
   */
  getStatisticsSummary(dateRange: DateRange): Promise<Result<StatisticsSummary, ReportError>>;

  /**
   * 人気書籍ランキングを取得
   * @param dateRange - 集計期間
   * @param limit - 取得件数上限
   * @returns 人気書籍ランキングまたはエラー
   */
  getPopularBooksRanking(
    dateRange: DateRange,
    limit: number
  ): Promise<Result<PopularBooksRanking, ReportError>>;

  /**
   * カテゴリ別貸出統計を取得
   * @param dateRange - 集計期間
   * @returns カテゴリ別貸出統計またはエラー
   */
  getCategoryStatistics(dateRange: DateRange): Promise<Result<CategoryStatistics, ReportError>>;
}

// ============================================
// バリデーション
// ============================================

/**
 * 期間の妥当性を検証
 * @param dateRange - 検証する期間
 * @returns 有効な場合はtrue
 */
function isValidDateRange(dateRange: DateRange): boolean {
  return dateRange.startDate <= dateRange.endDate;
}

// ============================================
// サービス実装
// ============================================

/** ReportService 実装を作成 */
export function createReportService(reportRepository: ReportRepository): ReportService {
  return {
    async getStatisticsSummary(
      dateRange: DateRange
    ): Promise<Result<StatisticsSummary, ReportError>> {
      // 期間の妥当性チェック
      if (!isValidDateRange(dateRange)) {
        return err({
          type: 'INVALID_DATE_RANGE',
          message: '開始日は終了日より前である必要があります',
        });
      }

      // 各統計を集計
      const [loanCount, returnCount, overdueCount] = await Promise.all([
        reportRepository.countLoans(dateRange),
        reportRepository.countReturns(dateRange),
        reportRepository.countOverdues(dateRange),
      ]);

      return ok({
        loanCount,
        returnCount,
        overdueCount,
        dateRange,
      });
    },

    async getPopularBooksRanking(
      dateRange: DateRange,
      limit: number
    ): Promise<Result<PopularBooksRanking, ReportError>> {
      // 期間の妥当性チェック
      if (!isValidDateRange(dateRange)) {
        return err({
          type: 'INVALID_DATE_RANGE',
          message: '開始日は終了日より前である必要があります',
        });
      }

      // 人気書籍ランキングを取得
      const items = await reportRepository.getPopularBooks(dateRange, limit);

      return ok({
        items,
        dateRange,
      });
    },

    async getCategoryStatistics(
      dateRange: DateRange
    ): Promise<Result<CategoryStatistics, ReportError>> {
      // 期間の妥当性チェック
      if (!isValidDateRange(dateRange)) {
        return err({
          type: 'INVALID_DATE_RANGE',
          message: '開始日は終了日より前である必要があります',
        });
      }

      // カテゴリ別統計を取得
      const items = await reportRepository.getCategoryStatistics(dateRange);

      // 合計貸出数を計算
      const totalLoanCount = items.reduce((sum, item) => sum + item.loanCount, 0);

      return ok({
        items,
        totalLoanCount,
        dateRange,
      });
    },
  };
}
