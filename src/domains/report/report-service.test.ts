/**
 * ReportService - Unit Tests
 *
 * TDD: RED → GREEN → REFACTOR
 */

import { describe, it, expect } from 'vitest';
import { createReportService, type ReportService } from './report-service.js';
import type { ReportRepository } from './report-repository.js';
import type { DateRange, PopularBookItem, CategoryStatisticsItem } from './types.js';
import { isOk, isErr } from '../../shared/result.js';
import { createBookId } from '../../shared/branded-types.js';

// ============================================
// モックリポジトリ
// ============================================

function createMockReportRepository(overrides: Partial<ReportRepository> = {}): ReportRepository {
  return {
    countLoans: () => Promise.resolve(0),
    countReturns: () => Promise.resolve(0),
    countOverdues: () => Promise.resolve(0),
    getPopularBooks: () => Promise.resolve([]),
    getCategoryStatistics: () => Promise.resolve([]),
    ...overrides,
  };
}

// ============================================
// テストケース
// ============================================

describe('ReportService', () => {
  let service: ReportService;
  let mockRepository: ReportRepository;

  describe('getStatisticsSummary', () => {
    it('有効な期間で統計サマリーを取得できる', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      mockRepository = createMockReportRepository({
        countLoans: () => Promise.resolve(100),
        countReturns: () => Promise.resolve(90),
        countOverdues: () => Promise.resolve(10),
      });
      service = createReportService(mockRepository);

      // Act
      const result = await service.getStatisticsSummary(dateRange);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.loanCount).toBe(100);
        expect(result.value.returnCount).toBe(90);
        expect(result.value.overdueCount).toBe(10);
        expect(result.value.dateRange).toEqual(dateRange);
      }
    });

    it('開始日が終了日より後の場合はエラーを返す', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-01-01'),
      };
      mockRepository = createMockReportRepository();
      service = createReportService(mockRepository);

      // Act
      const result = await service.getStatisticsSummary(dateRange);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.type).toBe('INVALID_DATE_RANGE');
      }
    });

    it('貸出数が0件の場合でも正常に取得できる', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      mockRepository = createMockReportRepository({
        countLoans: () => Promise.resolve(0),
        countReturns: () => Promise.resolve(0),
        countOverdues: () => Promise.resolve(0),
      });
      service = createReportService(mockRepository);

      // Act
      const result = await service.getStatisticsSummary(dateRange);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.loanCount).toBe(0);
        expect(result.value.returnCount).toBe(0);
        expect(result.value.overdueCount).toBe(0);
      }
    });
  });

  describe('getPopularBooksRanking', () => {
    it('人気書籍ランキングを取得できる', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      const mockPopularBooks: PopularBookItem[] = [
        { bookId: createBookId('book-1'), title: '本A', author: '著者A', loanCount: 50, rank: 1 },
        { bookId: createBookId('book-2'), title: '本B', author: '著者B', loanCount: 30, rank: 2 },
        { bookId: createBookId('book-3'), title: '本C', author: '著者C', loanCount: 20, rank: 3 },
      ];
      mockRepository = createMockReportRepository({
        getPopularBooks: () => Promise.resolve(mockPopularBooks),
      });
      service = createReportService(mockRepository);

      // Act
      const result = await service.getPopularBooksRanking(dateRange, 10);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.items).toHaveLength(3);
        expect(result.value.items[0]?.rank).toBe(1);
        expect(result.value.items[0]?.loanCount).toBe(50);
        expect(result.value.dateRange).toEqual(dateRange);
      }
    });

    it('無効な期間でエラーを返す', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-01-01'),
      };
      mockRepository = createMockReportRepository();
      service = createReportService(mockRepository);

      // Act
      const result = await service.getPopularBooksRanking(dateRange, 10);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.type).toBe('INVALID_DATE_RANGE');
      }
    });

    it('ランキングが空の場合でも正常に取得できる', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      mockRepository = createMockReportRepository({
        getPopularBooks: () => Promise.resolve([]),
      });
      service = createReportService(mockRepository);

      // Act
      const result = await service.getPopularBooksRanking(dateRange, 10);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.items).toHaveLength(0);
      }
    });
  });

  describe('getCategoryStatistics', () => {
    it('カテゴリ別貸出統計を取得できる', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      const mockCategoryStats: CategoryStatisticsItem[] = [
        { category: '小説', loanCount: 50, percentage: 50 },
        { category: '技術書', loanCount: 30, percentage: 30 },
        { category: '児童書', loanCount: 20, percentage: 20 },
      ];
      mockRepository = createMockReportRepository({
        getCategoryStatistics: () => Promise.resolve(mockCategoryStats),
      });
      service = createReportService(mockRepository);

      // Act
      const result = await service.getCategoryStatistics(dateRange);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.items).toHaveLength(3);
        expect(result.value.totalLoanCount).toBe(100);
        expect(result.value.items[0]?.category).toBe('小説');
        expect(result.value.items[0]?.percentage).toBe(50);
        expect(result.value.dateRange).toEqual(dateRange);
      }
    });

    it('無効な期間でエラーを返す', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-01-01'),
      };
      mockRepository = createMockReportRepository();
      service = createReportService(mockRepository);

      // Act
      const result = await service.getCategoryStatistics(dateRange);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.type).toBe('INVALID_DATE_RANGE');
      }
    });

    it('統計が空の場合でも正常に取得できる', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      mockRepository = createMockReportRepository({
        getCategoryStatistics: () => Promise.resolve([]),
      });
      service = createReportService(mockRepository);

      // Act
      const result = await service.getCategoryStatistics(dateRange);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.items).toHaveLength(0);
        expect(result.value.totalLoanCount).toBe(0);
      }
    });
  });

  describe('validateDateRange', () => {
    it('同日の開始日と終了日は有効', async () => {
      // Arrange
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01'),
      };
      mockRepository = createMockReportRepository({
        countLoans: () => Promise.resolve(10),
        countReturns: () => Promise.resolve(5),
        countOverdues: () => Promise.resolve(0),
      });
      service = createReportService(mockRepository);

      // Act
      const result = await service.getStatisticsSummary(dateRange);

      // Assert
      expect(isOk(result)).toBe(true);
    });
  });
});
