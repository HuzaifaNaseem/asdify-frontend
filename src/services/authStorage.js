export const STORAGE_ACCESS = 'asdify_access_token'
export const STORAGE_REFRESH = 'asdify_refresh_token'

export function readAccessToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_ACCESS)
}

export function readRefreshToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_REFRESH)
}

export function writeTokens(access, refresh) {
  localStorage.setItem(STORAGE_ACCESS, access)
  localStorage.setItem(STORAGE_REFRESH, refresh)
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_ACCESS)
  localStorage.removeItem(STORAGE_REFRESH)
}
