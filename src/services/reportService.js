import { api } from './api'
import { getApiBaseURL } from './api'

export async function generateScreeningReport(screeningId) {
  const { data } = await api.post(`/api/reports/screening/${screeningId}/generate`)
  return data
}

export async function createReportShare(reportId, expiresInHours = 72) {
  const { data } = await api.post(`/api/reports/${reportId}/share`, {
    expires_in_hours: expiresInHours,
  })
  return data
}

export function absoluteApiUrl(relativeUrl) {
  if (!relativeUrl) return ''
  if (/^https?:\/\//i.test(relativeUrl)) return relativeUrl
  const base = getApiBaseURL()
  if (!base) return relativeUrl
  return `${base}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`
}

