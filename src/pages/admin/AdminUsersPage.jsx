import { useCallback, useEffect, useState } from 'react'

import { AdminPortalNav } from '../../components/admin/AdminPortalNav'
import { DocumentTitle } from '../../components/common/DocumentTitle'
import { Alert } from '../../components/ui/Alert'
import { Spinner } from '../../components/ui/Spinner'
import {
  createCareAssignment,
  deleteAdminUser,
  fetchAdminUsers,
  patchAdminUser,
} from '../../services/adminService'
import { useAuth } from '../../state/AuthContext'

const PAGE_SIZE = 15

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function AdminUsersPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState('')
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)

  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchDraft, setSearchDraft] = useState('')

  const [drafts, setDrafts] = useState(() => ({}))
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [assignDoctor, setAssignDoctor] = useState('')
  const [assignParent, setAssignParent] = useState('')
  const [assignBusy, setAssignBusy] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')

  const load = useCallback(async () => {
    const offset = page * PAGE_SIZE
    const data = await fetchAdminUsers({
      limit: PAGE_SIZE,
      offset,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      q: search || undefined,
    })
    setUsers(data.users ?? [])
    setTotal(data.total ?? 0)
    const next = {}
    for (const u of data.users ?? []) {
      next[u.id] = { role: u.role, status: u.status }
    }
    setDrafts(next)
  }, [page, roleFilter, statusFilter, search])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        await load()
      } catch (e) {
        if (!cancelled) setError(e.message ?? 'Could not load users.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  function updateDraft(id, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  async function saveRow(u) {
    const d = drafts[u.id]
    if (!d) return
    if (d.role === u.role && d.status === u.status) {
      setBanner('No changes for this user.')
      return
    }
    setSavingId(u.id)
    setBanner('')
    try {
      const body = {}
      if (d.role !== u.role) body.role = d.role
      if (d.status !== u.status) body.status = d.status
      await patchAdminUser(u.id, body)
      await load()
      setBanner('User updated.')
    } catch (e) {
      setError(e.message ?? 'Update failed.')
      await load()
    } finally {
      setSavingId(null)
    }
  }

  async function removeRow(u) {
    if (u.id === user?.id) {
      setError('You cannot delete your own account here.')
      return
    }
    if (!window.confirm(`Permanently delete ${u.full_name} (${u.email})? This cannot be undone.`)) return
    setDeletingId(u.id)
    setBanner('')
    try {
      await deleteAdminUser(u.id)
      await load()
      setBanner('User deleted.')
    } catch (e) {
      setError(e.message ?? 'Delete failed.')
    } finally {
      setDeletingId(null)
    }
  }

  async function submitAssignment(e) {
    e.preventDefault()
    setAssignMsg('')
    const dId = Number(assignDoctor, 10)
    const pId = Number(assignParent, 10)
    if (!Number.isFinite(dId) || !Number.isFinite(pId)) {
      setAssignMsg('Enter numeric user IDs for doctor and parent.')
      return
    }
    setAssignBusy(true)
    try {
      await createCareAssignment(dId, pId)
      setAssignMsg('Assignment saved (or already existed).')
      setAssignDoctor('')
      setAssignParent('')
    } catch (e) {
      setAssignMsg(e.message ?? 'Assignment failed.')
    } finally {
      setAssignBusy(false)
    }
  }

  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  return (
    <>
      <DocumentTitle title="User management — Asdify" />

      <div className="admin-portal">
        <section className="admin-portal__hero admin-portal__hero--compact">
          <div className="admin-portal__hero-inner lp-section">
            <AdminPortalNav />
            <p className="admin-portal__eyebrow">Module 12 · Admin portal</p>
            <h1 className="admin-portal__title">User management</h1>
            <p className="admin-portal__lead">
              Search accounts, adjust roles and activation state, or remove users. Safeguards block the last active admin from
              being demoted or deleted.
            </p>
          </div>
        </section>

        <div className="admin-portal__main lp-section">
          {error ? (
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          ) : null}
          {banner ? (
            <Alert variant="success" title="Done">
              {banner}
            </Alert>
          ) : null}

          <section className="admin-panel">
            <div className="admin-toolbar">
              <div className="admin-toolbar__filters">
                <label className="admin-field">
                  <span className="admin-field__label">Role</span>
                  <select
                    className="admin-select"
                    value={roleFilter}
                    onChange={(e) => {
                      setPage(0)
                      setRoleFilter(e.target.value)
                    }}
                  >
                    <option value="">All</option>
                    <option value="parent">Parent</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Status</span>
                  <select
                    className="admin-select"
                    value={statusFilter}
                    onChange={(e) => {
                      setPage(0)
                      setStatusFilter(e.target.value)
                    }}
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </label>
                <form
                  className="admin-search"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setPage(0)
                    setSearch(searchDraft.trim())
                  }}
                >
                  <label className="admin-field admin-field--grow">
                    <span className="admin-field__label">Search</span>
                    <input
                      className="admin-input"
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                      placeholder="Email, name, or child name"
                    />
                  </label>
                  <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm">
                    Apply
                  </button>
                </form>
              </div>
              <p className="muted small admin-toolbar__meta">
                {total} user{total === 1 ? '' : 's'} · page {page + 1} of {maxPage + 1 || 1}
              </p>
            </div>

            {loading ? (
              <div className="ui-card">
                <Spinner label="Loading users…" />
              </div>
            ) : (
              <div className="admin-table-wrap admin-table-wrap--wide">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const d = drafts[u.id] ?? { role: u.role, status: u.status }
                      const dirty = d.role !== u.role || d.status !== u.status
                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="admin-user-cell">
                              <span className="admin-user-cell__name">{u.full_name}</span>
                              <span className="admin-user-cell__email muted small">{u.email}</span>
                            </div>
                          </td>
                          <td>
                            <select
                              className="admin-select admin-select--table"
                              value={d.role}
                              onChange={(e) => updateDraft(u.id, 'role', e.target.value)}
                            >
                              <option value="parent">parent</option>
                              <option value="doctor">doctor</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="admin-select admin-select--table"
                              value={d.status}
                              onChange={(e) => updateDraft(u.id, 'status', e.target.value)}
                            >
                              <option value="active">active</option>
                              <option value="inactive">inactive</option>
                              <option value="pending">pending</option>
                            </select>
                          </td>
                          <td className="muted">{formatDateTime(u.created_at)}</td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                className="ui-btn ui-btn--ghost ui-btn--sm"
                                disabled={!dirty || savingId === u.id}
                                onClick={() => void saveRow(u)}
                              >
                                {savingId === u.id ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                type="button"
                                className="ui-btn ui-btn--ghost ui-btn--sm admin-btn--danger"
                                disabled={u.id === user?.id || deletingId === u.id}
                                onClick={() => void removeRow(u)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {users.length === 0 ? <p className="admin-empty-inline muted">No users match these filters.</p> : null}
              </div>
            )}

            <div className="admin-pagination">
              <button
                type="button"
                className="ui-btn ui-btn--ghost ui-btn--sm"
                disabled={page <= 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="ui-btn ui-btn--ghost ui-btn--sm"
                disabled={page >= maxPage || loading}
                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              >
                Next
              </button>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel__head">
              <h2 className="admin-panel__title">Care team assignment</h2>
              <p className="muted small">Link an active doctor to a parent account (IDs from this table or dashboard).</p>
            </div>
            <form className="admin-assign-form" onSubmit={(e) => void submitAssignment(e)}>
              <label className="admin-field">
                <span className="admin-field__label">Doctor user ID</span>
                <input
                  className="admin-input"
                  inputMode="numeric"
                  value={assignDoctor}
                  onChange={(e) => setAssignDoctor(e.target.value)}
                />
              </label>
              <label className="admin-field">
                <span className="admin-field__label">Parent user ID</span>
                <input
                  className="admin-input"
                  inputMode="numeric"
                  value={assignParent}
                  onChange={(e) => setAssignParent(e.target.value)}
                />
              </label>
              <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={assignBusy}>
                {assignBusy ? 'Saving…' : 'Create assignment'}
              </button>
            </form>
            {assignMsg ? <p className="admin-assign-msg muted small">{assignMsg}</p> : null}
          </section>
        </div>
      </div>
    </>
  )
}
