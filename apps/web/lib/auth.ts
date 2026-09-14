// Minimal client-side token storage. This is intentionally simple —
// localStorage is fine for local development/testing, but note for later:
// storing JWTs in localStorage is readable by any JS running on the page
// (XSS risk). A production version should move to an httpOnly cookie set
// by the backend instead. Flagging this now so it doesn't get forgotten.

const ACCESS_TOKEN_KEY = 'seeds_access_token';
const REFRESH_TOKEN_KEY = 'seeds_refresh_token';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface StoredUser {
  id: string;
  email: string;
  role: string;
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

// Prevents multiple simultaneous refresh calls if several requests 401 at
// the same time (e.g. a page firing off 3 fetches at once right after the
// token expired) — they all await this same in-flight promise instead of
// each independently hitting /auth/refresh and racing to rotate the token.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearTokens();
        return false;
      }
      const data = await res.json();
      saveTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Drop-in replacement for fetch() on authenticated endpoints. Attaches the
// current access token, and if the server says it's expired (401),
// transparently refreshes and retries once before giving up. Callers get
// a normal Response back either way — no special handling needed unless
// both the original request AND the refresh attempt fail, in which case
// the 401 Response is returned as-is (session is genuinely dead; the
// caller should redirect to /login).
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const doFetch = () =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

  let res = await doFetch();

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch();
    }
  }

  return res;
}
