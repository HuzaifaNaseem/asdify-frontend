import { api } from './api'

/** In-flight dedupe only; each new page action can POST again to refresh session cookie. */
let sessionInFlight = null

const STORAGE_KEY = 'asdify_session_id'

export function readGuestSessionId() {
  try {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function writeGuestSessionId(id) {
  try {
    if (typeof window === 'undefined') return
    if (!id) return
    window.localStorage.setItem(STORAGE_KEY, String(id))
  } catch {
    // ignore storage failures
  }
}

export async function ensureGuestSession() {
  if (sessionInFlight) {
    await sessionInFlight
    return
  }
  const existing = readGuestSessionId()
  sessionInFlight = api
    .post('/api/session', undefined, {
      headers: existing ? { 'X-Asdify-Session': existing } : undefined,
    })
    .then((res) => {
      const sid = res?.data?.session_id
      if (sid) writeGuestSessionId(sid)
      return undefined
    })
    .finally(() => {
      sessionInFlight = null
    })
  await sessionInFlight
}
