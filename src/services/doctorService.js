import { api } from './api'

export async function fetchDoctorDashboard() {
  const { data } = await api.get('/api/doctor/dashboard', { timeout: 60_000 })
  return data
}

export async function fetchDoctorPatients(params = {}) {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.risk) sp.set('risk', params.risk)
  const qs = sp.toString()
  const { data } = await api.get(`/api/doctor/patients${qs ? `?${qs}` : ''}`, { timeout: 60_000 })
  return data
}

export async function fetchDoctorPatient(parentId) {
  const { data } = await api.get(`/api/doctor/patients/${parentId}`, { timeout: 60_000 })
  return data
}

export async function fetchDoctorAssessment(assessmentId) {
  const { data } = await api.get(`/api/doctor/assessments/${assessmentId}`, { timeout: 60_000 })
  return data
}

export async function patchDoctorClinicalNotes(assessmentId, notes) {
  const { data } = await api.patch(
    `/api/doctor/assessments/${assessmentId}/clinical-notes`,
    { notes },
    { timeout: 60_000 },
  )
  return data
}
