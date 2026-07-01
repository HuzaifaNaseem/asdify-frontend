import { api } from './api'

export async function fetchScreeningQuestions() {
  const { data } = await api.get('/api/screening/questions')
  return data
}

export async function submitScreeningAnswers({ answers, saveResult = false, patientInfo = {} }) {
  const { data } = await api.post('/api/screening/submit', {
    answers,
    save_result: saveResult,
    patient_info: patientInfo,
  })
  return data
}

export async function fetchMyScreenings() {
  const { data } = await api.get('/api/screening/mine')
  return data
}

