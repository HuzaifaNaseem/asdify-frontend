import { api } from './api'

export async function fetchHealth() {
  const { data } = await api.get('/api/health')
  return data
}
