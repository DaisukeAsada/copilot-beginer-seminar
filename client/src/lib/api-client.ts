/**
 * API クライアントエラークラス
 */
export class ApiError extends Error {
  readonly status: number;
  readonly data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * API クライアントオプション
 */
interface ApiClientOptions {
  token?: string;
}

/**
 * HTTPリクエストを実行する共通関数
 */
async function request<T>(
  url: string,
  method: string,
  body?: unknown,
  options?: ApiClientOptions
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json() as T | { message: string };

  if (!response.ok) {
    const errorData = data as { message?: string };
    throw new ApiError(
      response.status,
      errorData.message ?? 'An error occurred',
      data
    );
  }

  return data as T;
}

/**
 * API クライアント
 * RESTful API との通信を行うための基盤
 */
export const apiClient = {
  /**
   * GETリクエスト
   */
  get: <T>(url: string, options?: ApiClientOptions): Promise<T> => {
    return request<T>(url, 'GET', undefined, options);
  },

  /**
   * POSTリクエスト
   */
  post: <T>(url: string, body: unknown, options?: ApiClientOptions): Promise<T> => {
    return request<T>(url, 'POST', body, options);
  },

  /**
   * PUTリクエスト
   */
  put: <T>(url: string, body: unknown, options?: ApiClientOptions): Promise<T> => {
    return request<T>(url, 'PUT', body, options);
  },

  /**
   * DELETEリクエスト
   */
  delete: <T = void>(url: string, options?: ApiClientOptions): Promise<T> => {
    return request<T>(url, 'DELETE', undefined, options);
  },
};
