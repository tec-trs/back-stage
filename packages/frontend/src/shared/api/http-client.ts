import { useAuthStore } from '../../features/auth/auth.store';

// Chamadas relativas: o proxy do Vite (dev) e o servidor de produção encaminham para o backend
const API_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  public constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

interface ApiErrorPayload {
  error?: { code?: string; message?: string };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      throw new ApiError(401, 'UNAUTHORIZED', 'Sessão expirada. Faca login novamente.');
    }
    const errorPayload = payload as ApiErrorPayload | null;
    throw new ApiError(
      response.status,
      errorPayload?.error?.code ?? 'UNKNOWN_ERROR',
      errorPayload?.error?.message ?? 'Erro ao comunicar com o servidor',
    );
  }

  return payload as T;
}
