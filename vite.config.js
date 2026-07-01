import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (command === 'build' && mode === 'production') {
    const viteApiUrl = (process.env.VITE_API_URL || env.VITE_API_URL || '').trim()
    const firestoreDiscovery = (process.env.VITE_FIREBASE_API_DISCOVERY || env.VITE_FIREBASE_API_DISCOVERY || '').trim() === '1'
    const firebaseProjectId = (process.env.VITE_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || '').trim()
    const firebaseApiKey = (process.env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || '').trim()
    if (!viteApiUrl && !(firestoreDiscovery && firebaseProjectId && firebaseApiKey)) {
      throw new Error(
        'VITE_API_URL is required for production builds unless Firestore API discovery is enabled. Locally, Vite proxies /api to Flask; on Vercel the SPA has no proxy, ' +
          'so axios would call the wrong host (this site) and assessments/sessions break. ' +
          'Set VITE_API_URL to your API origin in the frontend Vercel project (e.g. https://asdify-api.vercel.app, no trailing slash), ' +
          'or set VITE_FIREBASE_API_DISCOVERY=1 with VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY, then redeploy.',
      )
    }
  }

  // Dev: match Asdify-backend PORT (default: run_local.py / .env PORT=5000)
  const apiProxyTarget = (env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000').replace(/\/$/, '')

  return {
    plugins: [react()],
    server: {
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
