import { api, getApiBaseURL } from './api'
import { userFacingMessageFromFetchException, userFacingMessageFromFetchFailure } from './apiErrors'

function isInterruptedUploadError(error) {
  // Supports both raw Axios errors and normalized errors from api.js interceptors.
  const status = error?.response?.status ?? error?.status
  const payloadMessage = error?.response?.data?.message || error?.payload?.message || error?.payload?.detail
  const message = String(payloadMessage || error?.message || '').toLowerCase()
  const payloadCode = String(error?.response?.data?.error || error?.payload?.error || '').toLowerCase()
  const retryable = Boolean(error?.response?.data?.retryable || error?.payload?.retryable)

  if (payloadCode === 'upload_interrupted' || retryable) {
    return true
  }

  if (status === 408) {
    return true
  }

  const interruptedHint =
    message.includes('interrupted') ||
    message.includes('malformed') ||
    message.includes('tunnel') ||
    message.includes('upload')
  if ((status === 400 || status === 408) && interruptedHint) {
    return true
  }
  if (
    !status &&
    (message.includes('network') ||
      message.includes('failed to fetch') ||
      message.includes('timeout') ||
      message.includes('cannot reach the server') ||
      message.includes('internet connection') ||
      message.includes('confirm the service is running'))
  ) {
    return true
  }
  return false
}

function isNonRetryableVideoSubmitError(error) {
  const status = error?.response?.status ?? error?.status
  const payloadCode = String(error?.response?.data?.error || error?.payload?.error || '').toLowerCase()
  const payloadMessage = String(
    error?.response?.data?.message || error?.payload?.message || error?.payload?.detail || error?.message || '',
  ).toLowerCase()

  if (status === 401 || status === 403 || status === 404) {
    return true
  }

  // Explicit input validation should not be retried (unless it is upload interruption flavored).
  if (status === 400 && payloadCode === 'validation_error') {
    const interruptedLike =
      payloadMessage.includes('interrupted') ||
      payloadMessage.includes('malformed') ||
      payloadMessage.includes('tunnel') ||
      payloadMessage.includes('boundary') ||
      payloadMessage.includes('multipart')
    return !interruptedLike
  }

  return false
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function waitForApiReady(maxWaitMs = 18_000) {
  const started = Date.now()
  while (Date.now() - started < maxWaitMs) {
    const base = getApiBaseURL()
    const url = base ? `${base}/api/health` : '/api/health'
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 4500)
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: base && /ngrok/i.test(base) ? { 'ngrok-skip-browser-warning': 'true' } : undefined,
        signal: controller.signal,
      })
      window.clearTimeout(timer)
      if (res.ok) {
        return true
      }
    } catch {
      window.clearTimeout(timer)
      // transient tunnel/network error; retry until budget exhausted
    }
    await sleep(1500)
  }
  return false
}

export async function submitAssessment({
  imageFile,
  behavior,
  screeningAssessmentId,
  patientInfo = {},
  onPhase,
}) {
  const form = new FormData()
  if (imageFile) {
    form.append('image', imageFile)
  }
  if (behavior && Object.keys(behavior).length > 0) {
    form.append('behavior', JSON.stringify(behavior))
  }
  if (screeningAssessmentId) {
    form.append('screening_assessment_id', screeningAssessmentId)
  }
  if (patientInfo && Object.keys(patientInfo).length > 0) {
    form.append('patient_info', JSON.stringify(patientInfo))
  }

  const hasImage = Boolean(imageFile)
  if (!hasImage) {
    onPhase?.('analyzing')
  }

  const { data } = await api.post('/api/assessment/submit', form, {
    timeout: 120_000,
    onUploadProgress: hasImage
      ? (evt) => {
          if (evt.total != null && evt.total > 0 && evt.loaded >= evt.total) {
            onPhase?.('analyzing')
          }
        }
      : undefined,
  })
  return data
}

export async function submitVideoAssessment({ videoFile, durationSeconds, patientInfo = {}, onProgress, onPhase }) {
  onPhase?.('uploading')
  const totalBytes = Number(videoFile?.size || 0)
  const maxRetries = 8
  let uploadId = ''
  let chunkSize = 1024 * 1024
  let offset = 0
  let lastErr = null

  async function refreshOriginAndWait() {
    try {
      const { refreshApiOriginFromFirestore } = await import('./apiConfig')
      await refreshApiOriginFromFirestore()
    } catch {
      // best-effort refresh only
    }
    await waitForApiReady(20_000)
  }

  async function startOrResumeUpload() {
    const payload = {
      upload_id: uploadId || undefined,
      filename: videoFile?.name || 'upload.mp4',
      size: totalBytes,
      mime_type: videoFile?.type || '',
    }
    const { data } = await api.post('/api/assessment/video/upload/start', payload, {
      timeout: 45_000,
    })
    uploadId = data?.upload_id
    chunkSize = Math.max(256 * 1024, Number(data?.chunk_size || chunkSize))
    offset = Math.max(0, Number(data?.offset || 0))
  }

  async function fetchServerOffset() {
    if (!uploadId) return 0
    try {
      const { data } = await api.get('/api/assessment/video/upload/status', {
        params: { upload_id: uploadId },
        timeout: 30_000,
      })
      return Math.max(0, Number(data?.offset || 0))
    } catch {
      return offset
    }
  }

  async function uploadChunkRange(start) {
    const end = Math.min(totalBytes, start + chunkSize)
    const blob = videoFile.slice(start, end)
    const form = new FormData()
    form.append('upload_id', uploadId)
    form.append('offset', String(start))
    form.append('chunk', blob, `chunk-${start}`)

    const { data } = await api.post('/api/assessment/video/upload/chunk', form, {
      timeout: 120_000,
      onUploadProgress: (evt) => {
        const loadedInChunk = evt && typeof evt.loaded === 'number' ? evt.loaded : 0
        const uploaded = Math.min(totalBytes, start + loadedInChunk)
        const ratio = totalBytes > 0 ? uploaded / totalBytes : 0
        onProgress?.({
          loaded: uploaded,
          total: totalBytes,
          ratio,
          percent: Math.round(Math.min(1, Math.max(0, ratio)) * 100),
        })
      },
    })
    return Math.max(start, Number(data?.offset || start))
  }

  async function completeUpload() {
    onPhase?.('server_processing')
    const { data } = await api.post(
      '/api/assessment/video/upload/complete',
      {
        upload_id: uploadId,
        duration_seconds: durationSeconds,
        patient_info: patientInfo,
        mode: 'high_sensitivity',
      },
      { timeout: 300_000 },
    )
    return data
  }

  for (let retry = 0; retry < maxRetries; retry += 1) {
    if (retry > 0) {
      onPhase?.('reconnecting')
      await sleep(Math.min(25_000, 2000 + retry * 2500))
      await refreshOriginAndWait()
      onPhase?.('uploading')
    }
    try {
      if (!uploadId) {
        await startOrResumeUpload()
      } else {
        offset = await fetchServerOffset()
      }

      while (offset < totalBytes) {
        try {
          offset = await uploadChunkRange(offset)
        } catch (chunkErr) {
          lastErr = chunkErr
          const expectedOffset = Number(chunkErr?.payload?.expected_offset ?? chunkErr?.response?.data?.expected_offset)
          if (Number.isFinite(expectedOffset) && expectedOffset >= 0) {
            offset = expectedOffset
            continue
          }
          const retryableChunk =
            chunkErr?.status === 408 ||
            chunkErr?.payload?.retryable === true ||
            chunkErr?.response?.data?.retryable === true
          if (retryableChunk) {
            offset = await fetchServerOffset()
            continue
          }
          offset = await fetchServerOffset()
          throw chunkErr
        }
      }

      const data = await completeUpload()
      onPhase?.('completed')
      return data
    } catch (error) {
      lastErr = error
      if (isNonRetryableVideoSubmitError(error) || retry === maxRetries - 1) {
        break
      }
      // Continue loop and resume from server offset with same upload_id.
    }
  }

  if (!isNonRetryableVideoSubmitError(lastErr) || isInterruptedUploadError(lastErr)) {
    throw new Error(
      'Upload was interrupted by unstable tunnel/network multiple times. We resumed automatically but could not finish this time. Please retry once.',
    )
  }
  throw lastErr
}


export async function fetchAssessments({
  limit = 50,
  offset = 0,
  type,
  riskLevel,
  status,
  dateFrom,
  dateTo,
  sort,
} = {}) {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  if (type) params.set('type', type)
  if (riskLevel) params.set('risk_level', riskLevel)
  if (status) params.set('status', status)
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)
  if (sort) params.set('sort', sort)
  const { data } = await api.get(`/api/assessments?${params.toString()}`, { timeout: 60_000 })
  return data
}

export async function createAssessmentReportShare(assessmentId, { expiresInHours = 72 } = {}) {
  const { data } = await api.post(
    `/api/assessments/${assessmentId}/report/share`,
    { expires_in_hours: expiresInHours },
    { timeout: 60_000 },
  )
  return data
}

export async function fetchAssessmentById(id) {
  const { data } = await api.get(`/api/assessments/${id}`, { timeout: 60_000 })
  return data
}

export function getAssessmentReportUrl(id) {
  const relative = `/api/assessments/${id}/report.pdf`
  const base = getApiBaseURL()
  return base ? `${base}${relative}` : relative
}

function readGuestSessionId() {
  try {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem('asdify_session_id') || ''
  } catch {
    return ''
  }
}

/**
 * Fetch the PDF with credentials (same session as submit / result).
 * Prefer this over <a href> to the API on a separate host — plain navigation can omit cross-site cookies.
 */
export async function downloadAssessmentReport(id) {
  const url = getAssessmentReportUrl(id)
  const guestSession = readGuestSessionId()
  let res
  try {
    res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: guestSession ? { 'X-Asdify-Session': guestSession } : undefined,
    })
  } catch (e) {
    throw new Error(userFacingMessageFromFetchException(e))
  }
  const contentType = res.headers.get('content-type') || ''

  if (!res.ok) {
    let payload = null
    if (contentType.includes('application/json')) {
      try {
        payload = await res.json()
      } catch {
        /* ignore */
      }
    }
    throw new Error(userFacingMessageFromFetchFailure(res.status, payload))
  }

  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `assessment-${id}.pdf`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

