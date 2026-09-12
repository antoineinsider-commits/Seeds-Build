// Minimal client-side token storage. This is intentionally simple —
// localStorage is fine for local development/testing, but note for later:
// storing JWTs in localStorage is readable by any JS running on the page
// (XSS risk). A production version should move to an httpOnly cookie set
// by the backend instead. Flagging this now so it doesn't get forgotten.

const ACCESS_TOKEN_KEY = 'seeds_access_token';
const REFRESH_TOKEN_KEY = 'seeds_refresh_token';

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

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}