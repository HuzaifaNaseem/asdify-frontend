/** Maps HTTP / network failures to copy suitable for end users (no raw status lines or stack traces). */

const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT'])

const AXIOS_STATUS_MESSAGE = /^Request failed with status code \d+$/i

const LEAKY_MESSAGE = /traceback|file "|sqlite3\.|integrityerror|operationalerror|internal server error|keyerror|attributeerror|typeerror|valueerror|syntaxerror|errno|exception:/i

function defaultMessageForStatus(status) {
  switch (status) {
    case 400:
      return 'Something in the request was not valid. Please check your input and try again.'
    case 401:
      return 'Please sign in to continue.'
    case 403:
      return 'You do not have permission to do that.'
    case 404:
      return 'We could not find what you are looking for. It may have been removed or the link may be incorrect.'
    case 409:
      return 'This action could not be completed because something changed. Please refresh the page and try again.'
    case 422:
      return 'We could not process that information. Please check the form and try again.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 502:
    case 503:
    case 504:
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        return (
          'Could not reach the API (bad gateway or upstream timeout). For local dev: start the Flask backend ' +
          '(e.g. python run_local.py) and ensure Vite proxies to the same port as your backend (frontend .env ' +
          'VITE_API_PROXY_TARGET, default http://127.0.0.1:5000).'
        )
      }
      return 'The service is temporarily unavailable. Please try again in a few minutes.'
    default:
      if (status >= 500) {
        return 'Something went wrong on our side. Please try again later.'
      }
      return 'Something went wrong. Please try again.'
  }
}

export function extractPayloadMessage(payload) {
  if (payload == null) return null
  if (typeof payload === 'string') return payload
  if (typeof payload === 'object') {
    if (typeof payload.message === 'string') return payload.message
    if (typeof payload.detail === 'string') return payload.detail
  }
  return null
}

function isSafeServerMessage(raw, status) {
  if (typeof raw !== 'string') return null
  const s = raw.trim()
  if (!s) return null
  if (s.length > 400) return null
  if (/\n/.test(s)) return null
  if (LEAKY_MESSAGE.test(s)) return null
  if (status >= 500) return null
  return s
}

function isTimeoutError(error) {
  if (!error || typeof error !== 'object') return false
  if (error.code && TIMEOUT_CODES.has(error.code)) return true
  const msg = typeof error.message === 'string' ? error.message.toLowerCase() : ''
  return msg.includes('timeout')
}

function isNetworkError(error) {
  if (!error || typeof error !== 'object') return false
  if (error.response != null) return false
  if (error.code === 'ERR_NETWORK') return true
  if (typeof error.message === 'string' && error.message === 'Network Error') return true
  return false
}

export function isApiUnreachableError(error) {
  if (error == null || typeof error !== 'object') {
    return false
  }
  const status = error.response?.status
  if (typeof status === 'number' && status >= 500) {
    return true
  }
  return isNetworkError(error) || isTimeoutError(error)
}

/**
 * When fetch() itself throws (offline, CORS, DNS), not an HTTP 4xx/5xx response.
 */
export function userFacingMessageFromFetchException(error) {
  if (error == null || typeof error !== 'object') {
    return 'We could not download the file. Check your connection and try again.'
  }
  const msg = typeof error.message === 'string' ? error.message : ''
  if (/failed to fetch|networkerror|load failed|aborted/i.test(msg) || error.name === 'TypeError') {
    return 'We cannot reach the server to download this file. Check your connection and try again.'
  }
  return 'We could not download the file. Please try again.'
}

/**
 * For failed fetch() calls where we have status + optional JSON body.
 */
export function userFacingMessageFromFetchFailure(status, payload) {
  const serverMsg = isSafeServerMessage(extractPayloadMessage(payload), status)
  if (serverMsg) return serverMsg
  if (typeof status === 'number' && status > 0) {
    return defaultMessageForStatus(status)
  }
  return 'Something went wrong. Please try again.'
}

/**
 * Axios error (before or after normalization), or a plain { message, status } from our interceptors.
 */
export function userFacingMessageFromAxiosError(error) {
  if (error == null || typeof error !== 'object') {
    return 'Something went wrong. Please try again.'
  }

  if (typeof error.message === 'string' && error.message.includes('Session expired')) {
    return error.message
  }

  if (isTimeoutError(error)) {
    return 'The request took too long. Check your connection and try again.'
  }

  if (isNetworkError(error)) {
    return 'We cannot reach the server right now. Check your internet connection, confirm the service is running, and try again.'
  }

  const status = error.response?.status
  const payload = error.response?.data

  if (typeof error.message === 'string' && AXIOS_STATUS_MESSAGE.test(error.message) && typeof status === 'number') {
    const serverMsg = isSafeServerMessage(extractPayloadMessage(payload), status)
    if (serverMsg) return serverMsg
    return defaultMessageForStatus(status)
  }

  const serverMsg = isSafeServerMessage(extractPayloadMessage(payload), status)
  if (serverMsg) return serverMsg

  if (typeof status === 'number' && status > 0) {
    return defaultMessageForStatus(status)
  }

  if (typeof error.message === 'string' && error.message && !AXIOS_STATUS_MESSAGE.test(error.message)) {
    const fallback = isSafeServerMessage(error.message, 400)
    if (fallback) return fallback
  }

  return 'Something went wrong. Please try again.'
}
