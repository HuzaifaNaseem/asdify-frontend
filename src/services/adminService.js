import { api } from './api'

export async function fetchAdminDashboard() {
  const { data } = await api.get('/api/admin/dashboard', { timeout: 60_000 })
  return data
}

export async function fetchAdminAudit(params = {}) {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.offset != null) sp.set('offset', String(params.offset))
  const qs = sp.toString()
  const { data } = await api.get(`/api/admin/audit${qs ? `?${qs}` : ''}`, { timeout: 60_000 })
  return data
}

export async function fetchAdminAnalytics(days = 30) {
  const { data } = await api.get('/api/admin/analytics', {
    params: { days },
    timeout: 60_000,
  })
  return data
}

export async function fetchAdminUsers(params = {}) {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.offset != null) sp.set('offset', String(params.offset))
  if (params.role) sp.set('role', params.role)
  if (params.status) sp.set('status', params.status)
  if (params.q) sp.set('q', params.q)
  const qs = sp.toString()
  const { data } = await api.get(`/api/admin/users${qs ? `?${qs}` : ''}`, { timeout: 60_000 })
  return data
}

export async function patchAdminUser(userId, body) {
  const { data } = await api.patch(`/api/admin/users/${userId}`, body, { timeout: 60_000 })
  return data
}

export async function deleteAdminUser(userId) {
  const { data } = await api.delete(`/api/admin/users/${userId}`, { timeout: 60_000 })
  return data
}

export async function approveDoctor(userId) {
  const { data } = await api.post(`/api/admin/doctors/${userId}/approve`, {}, { timeout: 60_000 })
  return data
}

export async function rejectDoctor(userId) {
  const { data } = await api.post(`/api/admin/doctors/${userId}/reject`, {}, { timeout: 60_000 })
  return data
}

export async function createCareAssignment(doctorUserId, parentUserId) {
  const { data } = await api.post(
    '/api/admin/care-assignments',
    { doctor_user_id: doctorUserId, parent_user_id: parentUserId },
    { timeout: 60_000 },
  )
  return data
}

/**
 * Downloads anonymized assessment CSV (no raw user identifiers).
 */
export async function downloadAnonymizedAssessmentsCsv() {
  const res = await api.get('/api/admin/export/assessments.csv', {
    responseType: 'blob',
    timeout: 120_000,
  })
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = 'asdify-anonymous-assessments.csv'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}
