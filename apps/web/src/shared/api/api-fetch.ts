const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Эндпоинты, на которых 401 — это ответ по существу, а не истёкший access-токен. */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`API request failed with status ${status}`);
  }
}

export function isApiError(error: unknown, status?: number): error is ApiError {
  return error instanceof ApiError && (status === undefined || error.status === status);
}

/** Сообщение из тела ошибки Nest (`message` — строка или массив строк). */
export function getApiErrorMessage(error: unknown, fallback = 'Что-то пошло не так'): string {
  if (!(error instanceof ApiError)) return fallback;
  const message = (error.body as { message?: unknown } | undefined)?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    // httpOnly-cookie с JWT отправляются только с credentials: 'include'
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  const body = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(response.status, body);
  }
  return body as T;
}

/** Общий промис, чтобы параллельные запросы с истёкшим токеном делали один refresh. */
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= request<void>('/auth/refresh', { method: 'POST' })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** HTTP-клиент API: при 401 один раз обновляет сессию по refresh-cookie и повторяет запрос. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await request<T>(path, init);
  } catch (error) {
    if (!isApiError(error, 401) || NO_REFRESH_PATHS.includes(path)) throw error;
    if (!(await refreshSession())) throw error;
    return request<T>(path, init);
  }
}
