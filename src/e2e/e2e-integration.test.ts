/**
 * エンドツーエンド統合テスト
 *
 * Task 13.2: エンドツーエンド統合テスト
 * Requirements: 1.1, 2.1, 3.1, 4.1, 6.1, 7.1
 *
 * 以下のフローをテストします:
 * - 図書館員フロー: 蔵書登録 → 検索 → 貸出 → 返却
 * - 利用者フロー: 検索 → 詳細表示 → 予約
 * - 管理者フロー: レポート表示 → CSV 出力
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';

// サービスインポート
import { createBookService, type BookService } from '../domains/book/book-service.js';
import { createSearchService, type SearchService } from '../domains/book/search-service.js';
import { createLoanService, type LoanService } from '../domains/loan/loan-service.js';
import { createUserService, type UserService } from '../domains/user/user-service.js';
import {
  createReservationService,
  type ReservationService,
} from '../domains/reservation/reservation-service.js';
import { createReportService, type ReportService } from '../domains/report/report-service.js';

// コントローラーインポート
import { createBookController } from '../domains/book/book-controller.js';
import { createSearchController } from '../domains/book/search-controller.js';
import { createLoanController } from '../domains/loan/loan-controller.js';
import { createUserController } from '../domains/user/user-controller.js';
import { createReservationController } from '../domains/reservation/reservation-controller.js';
import { createReportController } from '../domains/report/report-controller.js';

// リポジトリ型インポート
import type { BookRepository } from '../domains/book/book-repository.js';
import type { SearchRepository } from '../domains/book/search-repository.js';
import type { LoanRepository } from '../domains/loan/loan-repository.js';
import type { UserRepository } from '../domains/user/user-repository.js';
import type { ReservationRepository } from '../domains/reservation/reservation-repository.js';
import type { ReportRepository } from '../domains/report/report-repository.js';
import type { OverdueRecordRepository } from '../domains/loan/overdue-record-repository.js';

// 型インポート
import type { Book, BookCopy } from '../domains/book/types.js';
import type { User } from '../domains/user/types.js';
import type { Loan } from '../domains/loan/types.js';
import type { Reservation } from '../domains/reservation/types.js';
import type { BookId, CopyId, UserId, LoanId, ReservationId } from '../shared/branded-types.js';
import type { OverdueRecordId } from '../shared/branded-types.js';
import { ok } from '../shared/result.js';

// ============================================
// モックリポジトリファクトリ
// ============================================

function createMockBookRepository(): BookRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByIsbn: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createCopy: vi.fn(),
    findCopyById: vi.fn(),
    updateCopy: vi.fn(),
    findCopiesByBookId: vi.fn(),
  };
}

function createMockSearchRepository(): SearchRepository {
  return {
    search: vi.fn(),
  };
}

function createMockLoanRepository(): LoanRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    countActiveLoans: vi.fn(),
    findActiveByUserId: vi.fn(),
    findActiveByCopyId: vi.fn(),
    findActiveByMultipleCopyIds: vi.fn(),
    updateReturnedAt: vi.fn(),
  };
}

function createMockUserRepository(): UserRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    search: vi.fn(),
    findUserLoans: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

function createMockReservationRepository(): ReservationRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findActiveByBookId: vi.fn(),
    countActiveByBookId: vi.fn(),
    hasActiveReservation: vi.fn(),
    updateStatus: vi.fn(),
    findByUserId: vi.fn(),
    findExpiredReservations: vi.fn(),
  };
}

function createMockReportRepository(): ReportRepository {
  return {
    countLoans: vi.fn(),
    countReturns: vi.fn(),
    countOverdues: vi.fn(),
    getPopularBooks: vi.fn(),
    getCategoryStatistics: vi.fn(),
  };
}

function createMockOverdueRecordRepository(): OverdueRecordRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByLoanId: vi.fn(),
    findByUserId: vi.fn(),
  };
}

// ============================================
// テストデータファクトリ
// ============================================

let bookIdCounter = 0;
let copyIdCounter = 0;
let userIdCounter = 0;
let loanIdCounter = 0;
let reservationIdCounter = 0;

function resetCounters(): void {
  bookIdCounter = 0;
  copyIdCounter = 0;
  userIdCounter = 0;
  loanIdCounter = 0;
  reservationIdCounter = 0;
}

function generateBookId(): BookId {
  bookIdCounter++;
  return `book-${String(bookIdCounter)}` as BookId;
}

function generateCopyId(): CopyId {
  copyIdCounter++;
  return `copy-${String(copyIdCounter)}` as CopyId;
}

function generateUserId(): UserId {
  userIdCounter++;
  return `user-${String(userIdCounter)}` as UserId;
}

function generateLoanId(): LoanId {
  loanIdCounter++;
  return `loan-${String(loanIdCounter)}` as LoanId;
}

function generateReservationId(): ReservationId {
  reservationIdCounter++;
  return `reservation-${String(reservationIdCounter)}` as ReservationId;
}

function createTestBook(overrides?: Partial<Book>): Book {
  const id = generateBookId();
  return {
    id,
    title: 'テスト書籍',
    author: 'テスト著者',
    publisher: 'テスト出版社',
    publicationYear: 2024,
    isbn: '9784101010014', // 有効なISBN-13
    category: 'プログラミング',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createTestBookCopy(bookId: BookId, overrides?: Partial<BookCopy>): BookCopy {
  const id = generateCopyId();
  return {
    id,
    bookId,
    location: '書架A-1',
    status: 'AVAILABLE',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createTestUser(overrides?: Partial<User>): User {
  const id = generateUserId();
  return {
    id,
    name: 'テスト利用者',
    address: '東京都渋谷区',
    email: `test-${id}@example.com`,
    phone: '03-1234-5678',
    registeredAt: new Date('2024-01-01'),
    loanLimit: 5,
    ...overrides,
  };
}

function createTestLoan(userId: UserId, bookCopyId: CopyId, overrides?: Partial<Loan>): Loan {
  const id = generateLoanId();
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 14);

  return {
    id,
    userId,
    bookCopyId,
    borrowedAt: now,
    dueDate,
    returnedAt: null,
    ...overrides,
  };
}

function createTestReservation(
  userId: UserId,
  bookId: BookId,
  overrides?: Partial<Reservation>
): Reservation {
  const id = generateReservationId();
  return {
    id,
    userId,
    bookId,
    reservedAt: new Date(),
    notifiedAt: null,
    expiresAt: null,
    status: 'PENDING',
    queuePosition: 1,
    ...overrides,
  };
}

// ============================================
// テストアプリ設定
// ============================================

interface TestAppDependencies {
  bookRepository: BookRepository;
  searchRepository: SearchRepository;
  loanRepository: LoanRepository;
  userRepository: UserRepository;
  reservationRepository: ReservationRepository;
  reportRepository: ReportRepository;
  overdueRecordRepository: OverdueRecordRepository;
}

interface TestAppServices {
  bookService: BookService;
  searchService: SearchService;
  loanService: LoanService;
  userService: UserService;
  reservationService: ReservationService;
  reportService: ReportService;
}

function createTestApp(deps: TestAppDependencies): { app: Express; services: TestAppServices } {
  // サービス作成
  const bookService = createBookService(deps.bookRepository);
  const searchService = createSearchService(deps.searchRepository);
  const loanService = createLoanService(
    deps.loanRepository,
    deps.bookRepository,
    deps.userRepository,
    deps.overdueRecordRepository
  );
  const userService = createUserService(deps.userRepository);
  const reservationService = createReservationService(
    deps.reservationRepository,
    deps.bookRepository,
    deps.userRepository
  );
  const reportService = createReportService(deps.reportRepository);

  // Expressアプリ作成
  const app = express();
  app.use(express.json());

  // ルーター設定
  const bookRouter = createBookController(bookService);
  const searchRouter = createSearchController(searchService);
  const loanRouter = createLoanController(loanService);
  const userRouter = createUserController(userService);
  const reservationRouter = createReservationController(
    reservationService,
    deps.reservationRepository
  );
  const reportRouter = createReportController(reportService);

  // 注意: searchRouterを先にマウントして、/searchが/:idパラメータとして解釈されないようにする
  app.use('/api/books', searchRouter);
  app.use('/api/books', bookRouter);
  app.use('/api/loans', loanRouter);
  app.use('/api/users', userRouter);
  app.use('/api', reservationRouter);
  app.use('/api/reports', reportRouter);

  return {
    app,
    services: {
      bookService,
      searchService,
      loanService,
      userService,
      reservationService,
      reportService,
    },
  };
}

// ============================================
// 図書館員フローテスト
// ============================================

describe('E2E統合テスト: 図書館員フロー', () => {
  let deps: TestAppDependencies;
  let app: Express;

  beforeEach(() => {
    resetCounters();
    deps = {
      bookRepository: createMockBookRepository(),
      searchRepository: createMockSearchRepository(),
      loanRepository: createMockLoanRepository(),
      userRepository: createMockUserRepository(),
      reservationRepository: createMockReservationRepository(),
      reportRepository: createMockReportRepository(),
      overdueRecordRepository: createMockOverdueRecordRepository(),
    };
    const testApp = createTestApp(deps);
    app = testApp.app;
  });

  describe('蔵書登録 → 検索 → 貸出 → 返却 フロー', () => {
    it('完全なワークフロー: 書籍登録から返却まで', async () => {
      // ========================================
      // Step 1: 書籍を登録
      // ========================================
      const book = createTestBook({ isbn: '9784101010014' });
      vi.mocked(deps.bookRepository.findByIsbn).mockResolvedValue(null);
      vi.mocked(deps.bookRepository.create).mockResolvedValue(ok(book));

      const createBookResponse = await request(app).post('/api/books').send({
        title: 'テスト書籍',
        author: 'テスト著者',
        publisher: 'テスト出版社',
        publicationYear: 2024,
        isbn: '9784101010014',
        category: 'プログラミング',
      });

      expect(createBookResponse.status).toBe(201);
      expect(createBookResponse.body.title).toBe('テスト書籍');
      expect(createBookResponse.body.isbn).toBe('9784101010014');

      // ========================================
      // Step 2: 蔵書コピーを登録
      // ========================================
      const bookCopy = createTestBookCopy(book.id);
      vi.mocked(deps.bookRepository.findById).mockResolvedValue(ok(book));
      vi.mocked(deps.bookRepository.createCopy).mockResolvedValue(ok(bookCopy));

      const createCopyResponse = await request(app).post(`/api/books/${book.id}/copies`).send({
        location: '書架A-1',
        status: 'AVAILABLE',
      });

      expect(createCopyResponse.status).toBe(201);
      expect(createCopyResponse.body.location).toBe('書架A-1');
      expect(createCopyResponse.body.status).toBe('AVAILABLE');

      // ========================================
      // Step 3: 書籍を検索
      // ========================================
      vi.mocked(deps.searchRepository.search).mockResolvedValue({
        books: [book],
        total: 1,
      });

      const searchResponse = await request(app)
        .get('/api/books/search')
        .query({ keyword: 'テスト書籍' });

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.books).toHaveLength(1);
      expect(searchResponse.body.books[0].title).toBe('テスト書籍');

      // ========================================
      // Step 4: 利用者を登録
      // ========================================
      const user = createTestUser();
      vi.mocked(deps.userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(deps.userRepository.create).mockResolvedValue(ok(user));

      const createUserResponse = await request(app).post('/api/users').send({
        name: 'テスト利用者',
        email: user.email,
        address: '東京都渋谷区',
        phone: '03-1234-5678',
      });

      expect(createUserResponse.status).toBe(201);
      expect(createUserResponse.body.name).toBe('テスト利用者');

      // ========================================
      // Step 5: 貸出処理
      // ========================================
      const loan = createTestLoan(user.id, bookCopy.id);
      vi.mocked(deps.userRepository.findById).mockResolvedValue(ok(user));
      vi.mocked(deps.bookRepository.findCopyById).mockResolvedValue(ok(bookCopy));
      vi.mocked(deps.loanRepository.countActiveLoans).mockResolvedValue(0);
      vi.mocked(deps.loanRepository.create).mockResolvedValue(ok(loan));
      vi.mocked(deps.bookRepository.findById).mockResolvedValue(ok(book));

      const borrowedCopy: BookCopy = { ...bookCopy, status: 'BORROWED' };
      vi.mocked(deps.bookRepository.updateCopy).mockResolvedValue(ok(borrowedCopy));

      const createLoanResponse = await request(app).post('/api/loans').send({
        userId: user.id,
        bookCopyId: bookCopy.id,
      });

      expect(createLoanResponse.status).toBe(201);
      // LoanReceiptには loan プロパティがある
      expect(createLoanResponse.body.loan.userId).toBe(user.id);
      expect(createLoanResponse.body.loan.bookCopyId).toBe(bookCopy.id);
      expect(createLoanResponse.body.loan.returnedAt).toBeNull();
      expect(createLoanResponse.body.bookTitle).toBe(book.title);
      expect(createLoanResponse.body.userName).toBe(user.name);

      // ========================================
      // Step 6: 返却処理
      // ========================================
      const returnedLoan: Loan = {
        ...loan,
        returnedAt: new Date(),
      };
      vi.mocked(deps.loanRepository.findById).mockResolvedValue(ok(loan));
      vi.mocked(deps.loanRepository.updateReturnedAt).mockResolvedValue(ok(returnedLoan));

      const returnedCopy: BookCopy = { ...bookCopy, status: 'AVAILABLE' };
      vi.mocked(deps.bookRepository.updateCopy).mockResolvedValue(ok(returnedCopy));

      // 予約通知処理のモック
      vi.mocked(deps.reservationRepository.findActiveByBookId).mockResolvedValue([]);

      const returnResponse = await request(app).post(`/api/loans/${loan.id}/return`);

      expect(returnResponse.status).toBe(200);
      expect(returnResponse.body.loan.returnedAt).not.toBeNull();
      expect(returnResponse.body.isOverdue).toBe(false);
    });

    it('延滞返却の場合、延滞情報が記録される', async () => {
      // 準備: 利用者、書籍コピー、延滞している貸出を作成
      const user = createTestUser();
      const book = createTestBook();
      const bookCopy = createTestBookCopy(book.id);

      // 延滞している貸出（返却期限が3日前）
      const now = new Date();
      now.setHours(0, 0, 0, 0); // 時間を正規化
      const borrowedAt = new Date(now);
      borrowedAt.setDate(borrowedAt.getDate() - 17);
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() - 3);

      const overdueLoan = createTestLoan(user.id, bookCopy.id, {
        borrowedAt,
        dueDate,
      });

      const returnedLoan: Loan = {
        ...overdueLoan,
        returnedAt: now,
      };

      vi.mocked(deps.loanRepository.findById).mockResolvedValue(ok(overdueLoan));
      vi.mocked(deps.loanRepository.updateReturnedAt).mockResolvedValue(ok(returnedLoan));
      vi.mocked(deps.bookRepository.findCopyById).mockResolvedValue(ok(bookCopy));
      vi.mocked(deps.bookRepository.updateCopy).mockResolvedValue(
        ok({ ...bookCopy, status: 'AVAILABLE' })
      );
      vi.mocked(deps.overdueRecordRepository.create).mockResolvedValue(
        ok({
          id: 'overdue-1' as OverdueRecordId,
          loanId: overdueLoan.id,
          overdueDays: 3,
          recordedAt: now,
        })
      );
      vi.mocked(deps.reservationRepository.findActiveByBookId).mockResolvedValue([]);

      const returnResponse = await request(app).post(`/api/loans/${overdueLoan.id}/return`);

      expect(returnResponse.status).toBe(200);
      expect(returnResponse.body.isOverdue).toBe(true);
      // 延滞日数は3日以上（タイムゾーン差で1日ずれる可能性があるため範囲でチェック）
      expect(returnResponse.body.overdueDays).toBeGreaterThanOrEqual(3);
    });
  });
});

// ============================================
// 利用者フローテスト
// ============================================

describe('E2E統合テスト: 利用者フロー', () => {
  let deps: TestAppDependencies;
  let app: Express;

  beforeEach(() => {
    resetCounters();
    deps = {
      bookRepository: createMockBookRepository(),
      searchRepository: createMockSearchRepository(),
      loanRepository: createMockLoanRepository(),
      userRepository: createMockUserRepository(),
      reservationRepository: createMockReservationRepository(),
      reportRepository: createMockReportRepository(),
      overdueRecordRepository: createMockOverdueRecordRepository(),
    };
    const testApp = createTestApp(deps);
    app = testApp.app;
  });

  describe('検索 → 詳細表示 → 予約 フロー', () => {
    it('完全なワークフロー: 検索から予約まで', async () => {
      const user = createTestUser();
      const book = createTestBook({ title: '人気書籍' });
      const bookCopy = createTestBookCopy(book.id, { status: 'BORROWED' });

      // ========================================
      // Step 1: 書籍を検索
      // ========================================
      vi.mocked(deps.searchRepository.search).mockResolvedValue({
        books: [book],
        total: 1,
      });

      const searchResponse = await request(app)
        .get('/api/books/search')
        .query({ keyword: '人気書籍' });

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.books).toHaveLength(1);
      expect(searchResponse.body.books[0].title).toBe('人気書籍');

      // ========================================
      // Step 2: 書籍詳細を表示
      // ========================================
      vi.mocked(deps.bookRepository.findById).mockResolvedValue(ok(book));

      const detailResponse = await request(app).get(`/api/books/${book.id}`);

      expect(detailResponse.status).toBe(200);
      expect(detailResponse.body.title).toBe('人気書籍');

      // ========================================
      // Step 3: 貸出中書籍を予約
      // ========================================
      const reservation = createTestReservation(user.id, book.id);

      vi.mocked(deps.userRepository.findById).mockResolvedValue(ok(user));
      vi.mocked(deps.bookRepository.findById).mockResolvedValue(ok(book));
      vi.mocked(deps.bookRepository.findCopiesByBookId).mockResolvedValue(ok([bookCopy]));
      vi.mocked(deps.reservationRepository.hasActiveReservation).mockResolvedValue(false);
      vi.mocked(deps.reservationRepository.countActiveByBookId).mockResolvedValue(0);
      vi.mocked(deps.reservationRepository.create).mockResolvedValue(ok(reservation));

      const reservationResponse = await request(app).post('/api/reservations').send({
        userId: user.id,
        bookId: book.id,
      });

      expect(reservationResponse.status).toBe(201);
      expect(reservationResponse.body.userId).toBe(user.id);
      expect(reservationResponse.body.bookId).toBe(book.id);
      expect(reservationResponse.body.status).toBe('PENDING');
      expect(reservationResponse.body.queuePosition).toBe(1);
    });

    it('既に予約済みの場合はエラーを返す', async () => {
      const user = createTestUser();
      const book = createTestBook({ title: '人気書籍' });
      const bookCopy = createTestBookCopy(book.id, { status: 'BORROWED' });

      vi.mocked(deps.userRepository.findById).mockResolvedValue(ok(user));
      vi.mocked(deps.bookRepository.findById).mockResolvedValue(ok(book));
      vi.mocked(deps.bookRepository.findCopiesByBookId).mockResolvedValue(ok([bookCopy]));
      vi.mocked(deps.reservationRepository.hasActiveReservation).mockResolvedValue(true);

      const reservationResponse = await request(app).post('/api/reservations').send({
        userId: user.id,
        bookId: book.id,
      });

      expect(reservationResponse.status).toBe(409);
      expect(reservationResponse.body.error.type).toBe('ALREADY_RESERVED');
    });

    it('貸出可能な書籍への予約はエラーを返す', async () => {
      const user = createTestUser();
      const book = createTestBook({ title: '利用可能書籍' });
      const bookCopy = createTestBookCopy(book.id, { status: 'AVAILABLE' });

      vi.mocked(deps.userRepository.findById).mockResolvedValue(ok(user));
      vi.mocked(deps.bookRepository.findById).mockResolvedValue(ok(book));
      vi.mocked(deps.bookRepository.findCopiesByBookId).mockResolvedValue(ok([bookCopy]));
      vi.mocked(deps.reservationRepository.hasActiveReservation).mockResolvedValue(false);

      const reservationResponse = await request(app).post('/api/reservations').send({
        userId: user.id,
        bookId: book.id,
      });

      expect(reservationResponse.status).toBe(409);
      expect(reservationResponse.body.error.type).toBe('BOOK_AVAILABLE');
    });
  });
});

// ============================================
// 管理者フローテスト
// ============================================

describe('E2E統合テスト: 管理者フロー', () => {
  let deps: TestAppDependencies;
  let app: Express;

  beforeEach(() => {
    resetCounters();
    deps = {
      bookRepository: createMockBookRepository(),
      searchRepository: createMockSearchRepository(),
      loanRepository: createMockLoanRepository(),
      userRepository: createMockUserRepository(),
      reservationRepository: createMockReservationRepository(),
      reportRepository: createMockReportRepository(),
      overdueRecordRepository: createMockOverdueRecordRepository(),
    };
    const testApp = createTestApp(deps);
    app = testApp.app;
  });

  describe('レポート表示 → CSV出力 フロー', () => {
    it('完全なワークフロー: 統計サマリーからCSVエクスポートまで', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      // ========================================
      // Step 1: 統計サマリーを取得
      // ========================================
      vi.mocked(deps.reportRepository.countLoans).mockResolvedValue(100);
      vi.mocked(deps.reportRepository.countReturns).mockResolvedValue(95);
      vi.mocked(deps.reportRepository.countOverdues).mockResolvedValue(5);

      const summaryResponse = await request(app)
        .get('/api/reports/summary')
        .query({ startDate, endDate });

      expect(summaryResponse.status).toBe(200);
      expect(summaryResponse.body.loanCount).toBe(100);
      expect(summaryResponse.body.returnCount).toBe(95);
      expect(summaryResponse.body.overdueCount).toBe(5);

      // ========================================
      // Step 2: 人気書籍ランキングを取得
      // ========================================
      const book1 = createTestBook({ title: '人気書籍1' });
      const book2 = createTestBook({ title: '人気書籍2' });

      vi.mocked(deps.reportRepository.getPopularBooks).mockResolvedValue([
        { bookId: book1.id, title: book1.title, author: book1.author, loanCount: 50, rank: 1 },
        { bookId: book2.id, title: book2.title, author: book2.author, loanCount: 30, rank: 2 },
      ]);

      const popularResponse = await request(app)
        .get('/api/reports/popular')
        .query({ startDate, endDate, limit: '10' });

      expect(popularResponse.status).toBe(200);
      expect(popularResponse.body.items).toHaveLength(2);
      expect(popularResponse.body.items[0].rank).toBe(1);
      expect(popularResponse.body.items[0].title).toBe('人気書籍1');
      expect(popularResponse.body.items[0].loanCount).toBe(50);
      expect(popularResponse.body.items[1].rank).toBe(2);

      // ========================================
      // Step 3: カテゴリ別統計を取得
      // ========================================
      vi.mocked(deps.reportRepository.getCategoryStatistics).mockResolvedValue([
        { category: 'プログラミング', loanCount: 40, percentage: 40 },
        { category: '小説', loanCount: 30, percentage: 30 },
        { category: 'ビジネス', loanCount: 30, percentage: 30 },
      ]);

      const categoryResponse = await request(app)
        .get('/api/reports/category')
        .query({ startDate, endDate });

      expect(categoryResponse.status).toBe(200);
      expect(categoryResponse.body.items).toHaveLength(3);

      // ========================================
      // Step 4: CSV エクスポート（人気書籍ランキング）
      // ========================================
      const csvExportResponse = await request(app).get('/api/reports/export').query({
        startDate,
        endDate,
        type: 'popular',
        limit: '10',
      });

      expect(csvExportResponse.status).toBe(200);
      expect(csvExportResponse.headers['content-type']).toContain('text/csv');
      expect(csvExportResponse.text).toContain('順位');
      expect(csvExportResponse.text).toContain('人気書籍1');
    });

    it('無効な日付範囲の場合はエラーを返す', async () => {
      const summaryResponse = await request(app)
        .get('/api/reports/summary')
        .query({ startDate: 'invalid', endDate: '2024-01-31' });

      expect(summaryResponse.status).toBe(400);
      expect(summaryResponse.body.error.type).toBe('VALIDATION_ERROR');
    });

    it('終了日が開始日より前の場合はエラーを返す', async () => {
      vi.mocked(deps.reportRepository.countLoans).mockResolvedValue(0);
      vi.mocked(deps.reportRepository.countReturns).mockResolvedValue(0);
      vi.mocked(deps.reportRepository.countOverdues).mockResolvedValue(0);

      const summaryResponse = await request(app)
        .get('/api/reports/summary')
        .query({ startDate: '2024-01-31', endDate: '2024-01-01' });

      expect(summaryResponse.status).toBe(400);
      expect(summaryResponse.body.error.type).toBe('INVALID_DATE_RANGE');
    });
  });
});
