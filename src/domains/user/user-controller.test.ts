/**
 * UserController テスト
 *
 * 利用者管理REST APIエンドポイントのテスト。
 * TDDアプローチ: RED -> GREEN -> REFACTOR
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { createUserController } from './user-controller.js';
import type { UserService } from './user-service.js';
import type { User, UserWithLoans, LoanSummary } from './types.js';
import type { UserId } from '../../shared/branded-types.js';
import { ok, err } from '../../shared/result.js';

// ============================================
// モックヘルパー
// ============================================

function createMockUserService(): UserService {
  return {
    createUser: vi.fn(),
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    searchUsers: vi.fn(),
    getUserWithLoans: vi.fn(),
  };
}

function createTestApp(userService: UserService): Express {
  const app = express();
  app.use(express.json());
  const router = createUserController(userService);
  app.use('/api/users', router);
  return app;
}

function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 'user-1' as UserId,
    name: '山田 太郎',
    address: '東京都渋谷区1-2-3',
    email: 'yamada@example.com',
    phone: '03-1234-5678',
    registeredAt: new Date('2024-01-01'),
    loanLimit: 5,
    ...overrides,
  };
}

function createTestLoanSummary(overrides?: Partial<LoanSummary>): LoanSummary {
  return {
    id: 'loan-1',
    bookCopyId: 'copy-1',
    bookTitle: 'Test Book',
    borrowedAt: new Date('2024-01-15'),
    dueDate: new Date('2024-01-29'),
    returnedAt: null,
    isOverdue: false,
    ...overrides,
  };
}

// ============================================
// テスト
// ============================================

describe('UserController', () => {
  let mockService: UserService;
  let app: Express;

  beforeEach(() => {
    mockService = createMockUserService();
    app = createTestApp(mockService);
  });

  // ============================================
  // POST /api/users - 利用者登録
  // ============================================

  describe('POST /api/users - 利用者登録', () => {
    it('正常系: 利用者を登録して201を返す', async () => {
      const user = createTestUser();
      vi.mocked(mockService.createUser).mockResolvedValue(ok(user));

      const response = await request(app).post('/api/users').send({
        name: '山田 太郎',
        address: '東京都渋谷区1-2-3',
        email: 'yamada@example.com',
        phone: '03-1234-5678',
      });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('user-1');
      expect(response.body.name).toBe('山田 太郎');
      expect(mockService.createUser).toHaveBeenCalledTimes(1);
    });

    it('異常系: バリデーションエラーで400を返す', async () => {
      vi.mocked(mockService.createUser).mockResolvedValue(
        err({ type: 'VALIDATION_ERROR', field: 'name', message: 'name is required' })
      );

      const response = await request(app).post('/api/users').send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('VALIDATION_ERROR');
      expect(response.body.error.field).toBe('name');
    });

    it('異常系: メール重複で409を返す', async () => {
      vi.mocked(mockService.createUser).mockResolvedValue(
        err({ type: 'DUPLICATE_EMAIL', email: 'yamada@example.com' })
      );

      const response = await request(app).post('/api/users').send({
        name: '山田 太郎',
        email: 'yamada@example.com',
      });

      expect(response.status).toBe(409);
      expect(response.body.error.type).toBe('DUPLICATE_EMAIL');
    });
  });

  // ============================================
  // GET /api/users/:id - 利用者詳細取得
  // ============================================

  describe('GET /api/users/:id - 利用者詳細取得', () => {
    it('正常系: 利用者詳細を取得して200を返す', async () => {
      const user = createTestUser();
      vi.mocked(mockService.getUserById).mockResolvedValue(ok(user));

      const response = await request(app).get('/api/users/user-1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('user-1');
      expect(response.body.name).toBe('山田 太郎');
      expect(mockService.getUserById).toHaveBeenCalledWith('user-1');
    });

    it('異常系: 存在しない利用者で404を返す', async () => {
      vi.mocked(mockService.getUserById).mockResolvedValue(
        err({ type: 'NOT_FOUND', id: 'user-999' })
      );

      const response = await request(app).get('/api/users/user-999');

      expect(response.status).toBe(404);
      expect(response.body.error.type).toBe('NOT_FOUND');
    });
  });

  // ============================================
  // GET /api/users/search - 利用者検索
  // ============================================

  describe('GET /api/users/search - 利用者検索', () => {
    it('正常系: 氏名で検索して結果を返す', async () => {
      const users = [createTestUser()];
      vi.mocked(mockService.searchUsers).mockResolvedValue(ok(users));

      const response = await request(app).get('/api/users/search').query({ name: '山田' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('山田 太郎');
      expect(mockService.searchUsers).toHaveBeenCalledWith({ name: '山田' });
    });

    it('正常系: 利用者IDで検索して結果を返す', async () => {
      const users = [createTestUser()];
      vi.mocked(mockService.searchUsers).mockResolvedValue(ok(users));

      const response = await request(app).get('/api/users/search').query({ userId: 'user-1' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(mockService.searchUsers).toHaveBeenCalledWith({ userId: 'user-1' });
    });

    it('正常系: メールアドレスで検索して結果を返す', async () => {
      const users = [createTestUser()];
      vi.mocked(mockService.searchUsers).mockResolvedValue(ok(users));

      const response = await request(app)
        .get('/api/users/search')
        .query({ email: 'yamada@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(mockService.searchUsers).toHaveBeenCalledWith({ email: 'yamada@example.com' });
    });

    it('正常系: 複合条件で検索して結果を返す', async () => {
      const users = [createTestUser()];
      vi.mocked(mockService.searchUsers).mockResolvedValue(ok(users));

      const response = await request(app)
        .get('/api/users/search')
        .query({ name: '山田', email: 'yamada@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(mockService.searchUsers).toHaveBeenCalledWith({
        name: '山田',
        email: 'yamada@example.com',
      });
    });

    it('正常系: 検索結果が0件の場合は空配列を返す', async () => {
      vi.mocked(mockService.searchUsers).mockResolvedValue(ok([]));

      const response = await request(app).get('/api/users/search').query({ name: '存在しない' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it('異常系: 検索条件なしで400を返す', async () => {
      vi.mocked(mockService.searchUsers).mockResolvedValue(
        err({
          type: 'VALIDATION_ERROR',
          field: 'criteria',
          message: '検索条件を1つ以上指定してください',
        })
      );

      const response = await request(app).get('/api/users/search');

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================
  // GET /api/users/:id/loans - 利用者の貸出履歴
  // ============================================

  describe('GET /api/users/:id/loans - 利用者の貸出履歴', () => {
    it('正常系: 利用者の貸出履歴を取得して200を返す', async () => {
      const user = createTestUser();
      const currentLoan = createTestLoanSummary();
      const historyLoan = createTestLoanSummary({
        id: 'loan-2',
        bookCopyId: 'copy-2',
        bookTitle: 'Another Book',
        returnedAt: new Date('2024-01-20'),
      });

      const userWithLoans: UserWithLoans = {
        user,
        currentLoans: [currentLoan],
        loanHistory: [historyLoan],
      };
      vi.mocked(mockService.getUserWithLoans).mockResolvedValue(ok(userWithLoans));

      const response = await request(app).get('/api/users/user-1/loans');

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe('user-1');
      expect(response.body.currentLoans).toHaveLength(1);
      expect(response.body.loanHistory).toHaveLength(1);
      expect(mockService.getUserWithLoans).toHaveBeenCalledWith('user-1');
    });

    it('正常系: 貸出履歴がない場合は空配列を返す', async () => {
      const user = createTestUser();
      const userWithLoans: UserWithLoans = {
        user,
        currentLoans: [],
        loanHistory: [],
      };
      vi.mocked(mockService.getUserWithLoans).mockResolvedValue(ok(userWithLoans));

      const response = await request(app).get('/api/users/user-1/loans');

      expect(response.status).toBe(200);
      expect(response.body.currentLoans).toHaveLength(0);
      expect(response.body.loanHistory).toHaveLength(0);
    });

    it('異常系: 存在しない利用者で404を返す', async () => {
      vi.mocked(mockService.getUserWithLoans).mockResolvedValue(
        err({ type: 'NOT_FOUND', id: 'user-999' })
      );

      const response = await request(app).get('/api/users/user-999/loans');

      expect(response.status).toBe(404);
      expect(response.body.error.type).toBe('NOT_FOUND');
    });
  });
});
