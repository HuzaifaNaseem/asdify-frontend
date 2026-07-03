import { useEffect, useRef, useState } from 'react'

// Client IDs are public identifiers, so a baked-in default keeps production
// working without a Vercel env var; override with VITE_GOOGLE_CLIENT_ID if needed.
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '610907083663-ckm7qt7plfaufikginr4p9pkjkgh6uko.apps.googleusercontent.com'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

let gsiPromise = null

/** Load Google Identity Services once, shared across all button instances. */
function loadGsi() {
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('No window'))
      return
    }
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')))
      return
    }
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(s)
  })
  return gsiPromise
}

/** Google's four-colour "G" mark. */
function GoogleGlyph() {
  return (
    <svg className="google-btn__glyph" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/**
 * Custom, fully-styled "Continue with Google" button. On click it opens
 * Google's OAuth popup and returns an access token to `onToken(token)`.
 * Errors go to `onError(err)`.
 */
export function GoogleSignInButton({ onToken, onError, label = 'Continue with Google' }) {
  const clientRef = useRef(null)
  const [ready, setReady] = useState(false)
  const onTokenRef = useRef(onToken)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onTokenRef.current = onToken
    onErrorRef.current = onError
  })

  useEffect(() => {
    let cancelled = false
    loadGsi()
      .then(() => {
        if (cancelled || !window.google?.accounts?.oauth2) return
        clientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: (resp) => {
            if (resp?.error) {
              onErrorRef.current?.(new Error(resp.error))
              return
            }
            if (resp?.access_token) onTokenRef.current?.(resp.access_token)
            else onErrorRef.current?.(new Error('No access token returned by Google.'))
          },
        })
        setReady(true)
      })
      .catch((err) => {
        if (!cancelled) onErrorRef.current?.(err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleClick() {
    if (!clientRef.current) {
      onErrorRef.current?.(new Error('Google sign-in is still loading. Please try again.'))
      return
    }
    // Called inside a user gesture, so the popup is not blocked.
    clientRef.current.requestAccessToken()
  }

  return (
    <button
      type="button"
      className="google-btn"
      onClick={handleClick}
      disabled={!ready}
    >
      <GoogleGlyph />
      <span>{label}</span>
    </button>
  )
}
