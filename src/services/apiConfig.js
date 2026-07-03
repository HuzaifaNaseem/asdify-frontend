import { fetchApiOriginFromFirestore, isFirestoreApiDiscoveryConfigured } from './firestoreApiDiscovery'
import { getApiBaseURL, setApiBaseURL } from './api'

const STORAGE_KEY = 'asdify_api_origin'
const STORAGE_UPDATED_KEY = 'asdify_api_origin_updated_at'

let configSource = 'unset'
let initPromise = null

const SOURCE_LABELS = {
  env: 'Environment variable (VITE_API_URL)',
  loopback: 'Loopback backend (local machine)',
  firestore: 'Firestore (ngrok registry)',
  cache: 'Cached URL (localStorage)',
  proxy: 'Vite dev proxy (same origin)',
  none: 'Not configured',
  unset: 'Initializing…',
}

function readCachedOrigin() {
  try {
    if (typeof window === 'undefined') {
      return null
    }
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value && value.trim() ? value.trim().replace(/\/$/, '') : null
  } catch {
    return null
  }
}

function writeCachedOrigin(origin, updatedAt) {
  try {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(STORAGE_KEY, origin)
    if (updatedAt) {
      window.localStorage.setItem(STORAGE_UPDATED_KEY, String(updatedAt))
    }
  } catch {
    // ignore quota / private mode
  }
}

function envApiOrigin() {
  const raw = import.meta.env.VITE_API_URL
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.trim().replace(/\/$/, '')
  }
  return null
}

function loopbackCandidates() {
  const fromEnv = String(import.meta.env.VITE_LOCAL_API_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)
  if (fromEnv.length > 0) {
    return fromEnv
  }
  return ['http://127.0.0.1:5000', 'http://localhost:5000']
}

async function probeHealth(origin, timeoutMs = 1800) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${origin}/api/health`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
    return Boolean(res?.ok)
  } catch {
    return false
  } finally {
    window.clearTimeout(timer)
  }
}

async function resolveLoopbackOrigin() {
  if (typeof window === 'undefined') {
    return null
  }
  const candidates = loopbackCandidates()
  for (const origin of candidates) {
    // Try each candidate quickly; first healthy endpoint wins.
    // eslint-disable-next-line no-await-in-loop
    const ok = await probeHealth(origin)
    if (ok) {
      return origin
    }
  }
  return null
}

async function resolveApiOrigin() {
  // Production: always same-origin. vercel.json rewrites /api/* to the backend,
  // so this needs no CORS and uses a valid cert. We ignore VITE_API_URL and any
  // cached discovery origin here — a stale/misconfigured value must not break
  // the live site — and clear old cache left by earlier builds.
  if (!import.meta.env.DEV) {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
      window.localStorage.removeItem(STORAGE_UPDATED_KEY)
    } catch {
      // ignore
    }
    setApiBaseURL('')
    configSource = 'proxy'
    return ''
  }

  const fromEnv = envApiOrigin()
  if (fromEnv) {
    setApiBaseURL(fromEnv)
    configSource = 'env'
    return fromEnv
  }

  const localLoopback = await resolveLoopbackOrigin()
  if (localLoopback) {
    setApiBaseURL(localLoopback)
    configSource = 'loopback'
    return localLoopback
  }

  if (isFirestoreApiDiscoveryConfigured()) {
    try {
      const { origin, updatedAt } = await fetchApiOriginFromFirestore()
      setApiBaseURL(origin)
      writeCachedOrigin(origin, updatedAt)
      configSource = 'firestore'
      return origin
    } catch (err) {
      console.warn('[Asdify] Firestore API discovery failed:', err)
      const cached = readCachedOrigin()
      if (cached) {
        setApiBaseURL(cached)
        configSource = 'cache'
        return cached
      }
    }
  }

  // Dev fallback: same-origin (Vite proxy).
  setApiBaseURL('')
  configSource = 'proxy'
  return ''
}

/** Resolve and apply API base URL once before the app makes network calls. */
export function initializeApiConfig() {
  if (!initPromise) {
    initPromise = resolveApiOrigin()
  }
  return initPromise
}

let refreshPromise = null

/** True when Firestore discovery is active (not overridden by VITE_API_URL). */
export function canRefreshApiOriginFromFirestore() {
  return isFirestoreApiDiscoveryConfigured() && !envApiOrigin()
}

/** Re-fetch ngrok URL from Firestore and apply it (deduped if called concurrently). */
export async function refreshApiOriginFromFirestore() {
  if (!canRefreshApiOriginFromFirestore()) {
    return null
  }
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { origin, updatedAt } = await fetchApiOriginFromFirestore()
        setApiBaseURL(origin)
        writeCachedOrigin(origin, updatedAt)
        configSource = 'firestore'
        console.info('[Asdify] Refreshed API base URL from Firestore:', origin)
        return origin
      } catch (err) {
        console.warn('[Asdify] Firestore API refresh failed:', err)
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

export function getApiConfigSource() {
  return configSource
}

export function getApiConfigSourceLabel(source) {
  return SOURCE_LABELS[source] ?? source
}

/** Origin used for axios (empty string = same-origin / Vite proxy). */
export function getResolvedApiOrigin() {
  return getApiBaseURL()
}

/** Full URL used for GET /api/health. */
export function getApiHealthUrl() {
  const origin = getResolvedApiOrigin()
  return origin ? `${origin}/api/health` : '/api/health'
}

/** Human-readable API base for display. */
export function getDisplayApiBaseUrl() {
  const origin = getResolvedApiOrigin()
  if (origin) {
    return origin
  }
  if (import.meta.env.DEV) {
    return `${window.location.origin} (proxied to backend)`
  }
  return 'Same origin (relative /api/*)'
}
