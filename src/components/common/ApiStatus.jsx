import { useCallback, useEffect, useState } from 'react'

import { fetchHealth } from '../../services/healthService'
import {
  getApiConfigSource,
  getApiConfigSourceLabel,
  getApiHealthUrl,
  getDisplayApiBaseUrl,
} from '../../services/apiConfig'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Spinner } from '../ui/Spinner'

function evaluateHealth(data) {
  if (data && typeof data === 'object' && data.status === 'ok') {
    return {
      ok: true,
      text: 'Connected — the backend health check responded successfully.',
    }
  }
  if (data && typeof data === 'object' && data.name === 'Asdify API' && data.app_status === 'running') {
    return {
      ok: false,
      text: 'Wrong endpoint — received the API root (/) instead of /api/health. Check the API base URL configuration.',
    }
  }
  return {
    ok: false,
    text: 'Unexpected response from the server. Check the browser network tab for details.',
  }
}

export function ApiStatus() {
  const apiBase = getDisplayApiBaseUrl()
  const healthUrl = getApiHealthUrl()
  const configSource = getApiConfigSource()
  const configLabel = getApiConfigSourceLabel(configSource)

  const [state, setState] = useState({
    loading: true,
    ok: null,
    message: '',
    payload: null,
    latencyMs: null,
    checkedAt: null,
  })

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, ok: null, message: '' }))
    const started = performance.now()
    try {
      const data = await fetchHealth()
      const latencyMs = Math.round(performance.now() - started)
      const { ok, text } = evaluateHealth(data)
      setState({
        loading: false,
        ok,
        message: text,
        payload: data,
        latencyMs,
        checkedAt: new Date(),
      })
    } catch (e) {
      setState({
        loading: false,
        ok: false,
        message: e.message ?? 'Could not reach the API.',
        payload: null,
        latencyMs: null,
        checkedAt: new Date(),
      })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="api-status">
      <Card className="api-status__card">
        <h2 className="api-status__title">Connection details</h2>
        <dl className="api-status__meta">
          <div className="api-status__row">
            <dt>API base URL</dt>
            <dd>
              <code className="inline-code api-status__url">{apiBase}</code>
            </dd>
          </div>
          <div className="api-status__row">
            <dt>Health check URL</dt>
            <dd>
              <code className="inline-code api-status__url">{healthUrl}</code>
            </dd>
          </div>
          <div className="api-status__row">
            <dt>URL source</dt>
            <dd>{configLabel}</dd>
          </div>
        </dl>
      </Card>

      {state.loading ? (
        <div className="api-status api-status--loading" role="status">
          <Spinner label="Pinging server…" />
        </div>
      ) : (
        <>
          {state.ok ? (
            <Alert variant="success" title="Server status">
              {state.message}
              {state.latencyMs != null && (
                <span className="api-status__latency"> Response time: {state.latencyMs} ms.</span>
              )}
            </Alert>
          ) : (
            <Alert variant="error" title="Server status">
              {state.message} Ensure the Flask backend is running and the API URL is correct.
            </Alert>
          )}

          {state.payload && (
            <Card className="api-status__card api-status__card--response">
              <h3 className="api-status__subtitle">Health response</h3>
              <pre className="api-status__json">{JSON.stringify(state.payload, null, 2)}</pre>
            </Card>
          )}

          {state.checkedAt && (
            <p className="api-status__checked">
              Last checked: {state.checkedAt.toLocaleString()}
            </p>
          )}

          <Button type="button" variant="secondary" className="api-status__retry" onClick={() => void load()}>
            Ping again
          </Button>
        </>
      )}
    </div>
  )
}
