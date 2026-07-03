import axios from 'axios'

import { isApiUnreachableError, userFacingMessageFromAxiosError } from './apiErrors'
import { clearTokens, readAccessToken, readRefreshToken, writeTokens } from './authStorage'

let onAuthFailure = () => {}

/** Called when refresh fails so the UI can redirect to login. */
export function setOnAuthFailure(fn) {
  onAuthFailure = fn
}

/** Set at startup by apiConfig (env, Firestore, or dev proxy). */
let resolvedApiOrigin = undefined

export function setApiBaseURL(origin) {
  const normalized = typeof origin === 'string' ? origin.trim().replace(/\/$/, '') : ''
  resolvedApiOrigin = normalized
  api.defaults.baseURL = normalized || undefined
}

export function getApiBaseURL() {
  if (resolvedApiOrigin !== undefined) {
    return resolvedApiOrigin
  }
  const raw = import.meta.env.VITE_API_URL
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.replace(/\/$/, '')
  }
  if (import.meta.env.DEV) {
    return ''
  }
  // Production without a baked-in VITE_API_URL: use the known backend so a fresh
  // client still reaches the API before apiConfig discovery resolves.
  return 'https://asdify-api.duckdns.org'
}

export const api = axios.create({
  baseURL: getApiBaseURL() || undefined,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

function readGuestSessionId() {
  try {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem('asdify_session_id') || ''
  } catch {
    return ''
  }
}

function isNgrokBaseUrl(url) {
  return typeof url === 'string' && /ngrok/i.test(url)
}

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  const token = readAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const guestSession = readGuestSessionId()
  if (guestSession && !config.headers['X-Asdify-Session']) {
    config.headers['X-Asdify-Session'] = guestSession
  }
  const base = config.baseURL || getApiBaseURL()
  if (isNgrokBaseUrl(base)) {
    config.headers['ngrok-skip-browser-warning'] = 'true'
  }
  return config
})

function buildError(error) {
  const payload = error.response?.data
  return {
    message: userFacingMessageFromAxiosError(error),
    status: error.response?.status,
    payload,
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const original = error.config

    const isAuthPath =
      original?.url &&
      (String(original.url).includes('/api/auth/login') ||
        String(original.url).includes('/api/auth/register') ||
        String(original.url).includes('/api/auth/refresh'))

    if (status === 401 && original && !original._retry && !isAuthPath) {
      original._retry = true
      try {
        const refresh = readRefreshToken()
        if (!refresh) {
          throw new Error('no refresh')
        }
        const base = getApiBaseURL()
        const url = base ? `${base}/api/auth/refresh` : '/api/auth/refresh'
        const { data } = await axios.post(
          url,
          { refresh_token: refresh },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(isNgrokBaseUrl(base) ? { 'ngrok-skip-browser-warning': 'true' } : {}),
            },
            timeout: 15_000,
          },
        )
        writeTokens(data.access_token, refresh)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        clearTokens()
        onAuthFailure()
        return Promise.reject({ message: 'Session expired. Please sign in again.', status: 401 })
      }
    }

    if (original && !original._firestoreRefresh && isApiUnreachableError(error)) {
      const { canRefreshApiOriginFromFirestore, refreshApiOriginFromFirestore } =
        await import('./apiConfig')
      if (canRefreshApiOriginFromFirestore()) {
        original._firestoreRefresh = true
        const refreshed = await refreshApiOriginFromFirestore()
        if (refreshed) {
          return api(original)
        }
      }
    }

    return Promise.reject(buildError(error))
  },
)
