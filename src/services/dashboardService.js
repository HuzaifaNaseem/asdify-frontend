import { api } from './api'

/**
 * Parent dashboard: summary stats and recent assessments (Module 3).
 * Requires Bearer token (parent role).
 */
export async function fetchParentDashboard() {
  const request = () => api.get('/api/parent/dashboard', { timeout: 45_000 })
  try {
    const { data } = await request()
    return data
  } catch (first) {
    const st = first?.status
    if (st === 502 || st === 503 || st === 504) {
      await new Promise((r) => setTimeout(r, 600))
      const { data } = await request()
      return data
    }
    throw first
  }
}
