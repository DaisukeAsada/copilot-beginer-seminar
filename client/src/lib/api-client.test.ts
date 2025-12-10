import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from './api-client';

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('get', () => {
    it('正常なレスポンスでデータを返す', async () => {
      const mockData = { id: '1', title: 'テスト書籍' };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await apiClient.get<typeof mockData>('/api/books/1');

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
        '/api/books/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('エラーレスポンスでApiErrorをスローする', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not Found' }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(apiClient.get('/api/books/999')).rejects.toThrow(ApiError);
      
      global.fetch = vi.fn().mockResolvedValue(mockResponse);
      await expect(apiClient.get('/api/books/999')).rejects.toMatchObject({
        status: 404,
        message: 'Not Found',
      });
    });
  });

  describe('post', () => {
    it('POSTリクエストでデータを送信する', async () => {
      const requestBody = { title: '新規書籍', author: '著者名', isbn: '1234567890' };
      const responseData = { id: '1', ...requestBody };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData),
      });

      const result = await apiClient.post<typeof responseData>('/api/books', requestBody);

      expect(result).toEqual(responseData);
      expect(fetch).toHaveBeenCalledWith(
        '/api/books',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestBody),
        })
      );
    });
  });

  describe('put', () => {
    it('PUTリクエストでデータを更新する', async () => {
      const requestBody = { title: '更新書籍' };
      const responseData = { id: '1', title: '更新書籍' };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData),
      });

      const result = await apiClient.put<typeof responseData>('/api/books/1', requestBody);

      expect(result).toEqual(responseData);
      expect(fetch).toHaveBeenCalledWith(
        '/api/books/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestBody),
        })
      );
    });
  });

  describe('delete', () => {
    it('DELETEリクエストを送信する', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(undefined),
      });

      await apiClient.delete('/api/books/1');

      expect(fetch).toHaveBeenCalledWith(
        '/api/books/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('認証ヘッダー', () => {
    it('認証トークンがあれば Authorization ヘッダーに追加する', async () => {
      const mockData = { id: '1' };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      await apiClient.get('/api/books/1', { token: 'test-token' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/books/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });
});
