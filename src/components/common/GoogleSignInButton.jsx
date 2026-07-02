import { useEffect, useRef } from 'react'
import { useTheme } from '../../state/ThemeContext'

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
    if (window.google?.accounts?.id) {
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

/**
 * Renders Google's official "Continue with Google" button. Calls
 * `onCredential(idToken)` on success and `onError(err)` on failure.
 */
export function GoogleSignInButton({ onCredential, onError, text = 'continue_with' }) {
  const { theme } = useTheme()
  const containerRef = useRef(null)
  // Keep the latest callbacks in refs so re-renders don't re-init the button.
  const onCredentialRef = useRef(onCredential)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onCredentialRef.current = onCredential
    onErrorRef.current = onError
  })

  useEffect(() => {
    let cancelled = false
    loadGsi()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) return
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => {
            if (resp?.credential) onCredentialRef.current?.(resp.credential)
            else onErrorRef.current?.(new Error('No credential returned by Google.'))
          },
        })
        containerRef.current.innerHTML = ''
        const measured = containerRef.current.offsetWidth || 320
        const width = Math.min(Math.max(measured, 220), 400)
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text,
          shape: 'pill',
          logo_alignment: 'center',
          width,
        })
      })
      .catch((err) => {
        if (!cancelled) onErrorRef.current?.(err)
      })
    return () => {
      cancelled = true
    }
  }, [theme, text])

  return <div className="google-signin" ref={containerRef} />
}
