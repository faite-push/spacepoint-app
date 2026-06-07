const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Lê o csrf_token do cookie (não-httpOnly, legível pelo JS).
 */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Wrapper de fetch para a API do SorteBux.
 *
 * - Sempre envia `credentials: 'include'` → o cookie access_token vai junto
 * - Em mutations (POST/PUT/PATCH/DELETE) adiciona o header X-CSRF-Token
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(isMutation ? { 'X-CSRF-Token': getCsrfToken() } : {}),
        ...options.headers,
      },
    });

    clearTimeout(id);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw Object.assign(new Error(error.error ?? 'Erro na API'), { status: response.status });
    }

    return response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Gera um UUID v4 para uso como Idempotency Key.
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export { API_URL };
