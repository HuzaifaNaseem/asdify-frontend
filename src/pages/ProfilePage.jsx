import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { DocumentTitle } from '../components/common/DocumentTitle'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import * as authService from '../services/authService'
import { clearTokens } from '../services/authStorage'
import { useAuth } from '../state/AuthContext'

function roleLabel(role) {
  if (role === 'admin') return 'Administrator'
  if (role === 'doctor') return 'Doctor'
  if (role === 'parent') return 'Parent'
  return role
}

function statusBadgeClass(status) {
  if (status === 'active') return 'profile-badge profile-badge--active'
  if (status === 'pending') return 'profile-badge profile-badge--pending'
  if (status === 'inactive') return 'profile-badge profile-badge--inactive'
  return 'profile-badge'
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, refreshUser, ready } = useAuth()

  const [fullName, setFullName] = useState('')
  const [childName, setChildName] = useState('')
  const [childDob, setChildDob] = useState('')
  const [personalSaved, setPersonalSaved] = useState('')
  const [personalError, setPersonalError] = useState('')
  const [childSaved, setChildSaved] = useState('')
  const [childError, setChildError] = useState('')
  const [saving, setSaving] = useState(null)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePw, setDeletePw] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setFullName(user.full_name ?? '')
    setChildName(user.child_name ?? '')
    setChildDob(user.child_dob ?? '')
  }, [user])

  async function onSavePersonal(e) {
    e.preventDefault()
    if (!user) return
    setPersonalSaved('')
    setPersonalError('')
    setSaving('personal')
    try {
      await authService.updateProfile({ full_name: fullName.trim() })
      await refreshUser()
      setPersonalSaved('Your personal details were updated.')
    } catch (err) {
      setPersonalError(err.message ?? 'Could not save profile.')
    } finally {
      setSaving(null)
    }
  }

  async function onSaveChild(e) {
    e.preventDefault()
    if (!user || user.role !== 'parent') return
    setChildSaved('')
    setChildError('')
    setSaving('child')
    try {
      await authService.updateProfile({
        child_name: childName.trim(),
        child_dob: childDob.trim(),
      })
      await refreshUser()
      setChildSaved('Child details saved. They will pre-fill new flows when those fields are empty.')
    } catch (err) {
      setChildError(err.message ?? 'Could not save child details.')
    } finally {
      setSaving(null)
    }
  }

  async function onChangePassword(e) {
    e.preventDefault()
    setPwError('')
    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (newPw !== confirmPw) {
      setPwError('New password and confirmation do not match.')
      return
    }
    setPwLoading(true)
    try {
      const data = await authService.changePassword(currentPw, newPw)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      clearTokens()
      await refreshUser()
      navigate('/login', {
        replace: true,
        state: { message: data.message ?? 'Please sign in with your new password.' },
      })
    } catch (err) {
      setPwError(err.message ?? 'Could not change password.')
    } finally {
      setPwLoading(false)
    }
  }

  async function onDeleteAccount(e) {
    e.preventDefault()
    setDeleteError('')
    if (!deleteConfirm) {
      setDeleteError('Please confirm that you understand this action is permanent.')
      return
    }
    setDeleteLoading(true)
    try {
      await authService.deleteAccount(deletePw)
      clearTokens()
      await refreshUser()
      setDeleteOpen(false)
      navigate('/', { replace: true })
    } catch (err) {
      setDeleteError(err.message ?? 'Could not delete account.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!ready || !user) {
    return (
      <div className="profile-page lp-section">
        <DocumentTitle title="Asdify — Profile" />
        <div className="ui-card profile-page__loading">
          <Spinner label="Loading profile…" />
        </div>
      </div>
    )
  }

  return (
    <>
      <DocumentTitle title="Asdify — Profile" />

      <div className="profile-page">
        <header className="profile-page__header lp-section">
          <p className="profile-page__eyebrow">Account</p>
          <h1 className="profile-page__title">Your profile</h1>
          <p className="profile-page__lead muted">
            {user.role === 'parent'
              ? 'Keep your details current. Child information can pre-fill new assessments and screenings.'
              : 'Manage your name, password, and account security.'}
          </p>
        </header>

        <div className="profile-page__grid lp-section">
          <section className="ui-card profile-card anim-fade-up">
            <h2 className="profile-card__heading">Personal information</h2>
            <p className="profile-card__sub muted">Name and email as they appear across Asdify.</p>

            <div className="profile-row profile-row--read">
              <span className="profile-row__label">Role</span>
              <span className="profile-role-text">{roleLabel(user.role)}</span>
            </div>
            <div className="profile-row profile-row--read">
              <span className="profile-row__label">Account status</span>
              <span className={statusBadgeClass(user.status)} style={{ textTransform: 'capitalize' }}>
                {user.status}
              </span>
            </div>
            {user.status !== 'active' ? (
              <p className="muted small profile-card__status-note">
                Status: <strong>{user.status}</strong>
                {user.role === 'doctor' && user.status === 'pending'
                  ? ' — an administrator must approve your account before you can use clinical tools.'
                  : null}
              </p>
            ) : null}

            <form className="profile-form" onSubmit={onSavePersonal}>
              <Input
                label="Full name"
                name="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(ev) => setFullName(ev.target.value)}
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={user.email ?? ''}
                disabled
                hint="Email cannot be changed here. Contact support if you need to update it."
              />

              {personalSaved ? (
                <Alert variant="success" title="Saved">
                  {personalSaved}
                </Alert>
              ) : null}
              {personalError ? (
                <Alert variant="error" title="Could not save">
                  {personalError}
                </Alert>
              ) : null}

              <div className="profile-form__actions">
                <Button type="submit" disabled={saving === 'personal'}>
                  {saving === 'personal' ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </section>

          {user.role === 'parent' ? (
            <section className="ui-card profile-card anim-fade-up anim-delay-1">
              <h2 className="profile-card__heading">Child information</h2>
              <p className="profile-card__sub muted">
                Optional — used to pre-fill patient details on <strong>New assessment</strong> and{' '}
                <strong>Screening</strong> when those fields are empty.
              </p>
              <form className="profile-form" onSubmit={onSaveChild}>
                <Input
                  label="Child’s name"
                  name="childName"
                  autoComplete="off"
                  value={childName}
                  onChange={(ev) => setChildName(ev.target.value)}
                  placeholder="e.g. Alex"
                />
                <Input
                  label="Child’s date of birth"
                  name="childDob"
                  type="date"
                  value={childDob}
                  onChange={(ev) => setChildDob(ev.target.value)}
                />
                <p className="muted small" style={{ margin: 0 }}>
                  Clearing both fields and saving will remove stored child details from your account.
                </p>
                {childSaved ? (
                  <Alert variant="success" title="Saved">
                    {childSaved}
                  </Alert>
                ) : null}
                {childError ? (
                  <Alert variant="error" title="Could not save">
                    {childError}
                  </Alert>
                ) : null}
                <div className="profile-form__actions">
                  <Button type="submit" disabled={saving === 'child'}>
                    {saving === 'child' ? 'Saving…' : 'Save child details'}
                  </Button>
                </div>
              </form>
            </section>
          ) : (
            <section className="ui-card profile-card profile-card--note anim-fade-up anim-delay-1">
              <h2 className="profile-card__heading">Child information</h2>
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                Saved child name and date of birth are a <strong>parent</strong> feature for faster
                report pre-fill. As a {roleLabel(user.role)}, your professional details belong in
                your forthcoming clinician profile modules.
              </p>
            </section>
          )}

          <section className="ui-card profile-card anim-fade-up anim-delay-2">
            <h2 className="profile-card__heading">Change password</h2>
            <p className="profile-card__sub muted">You will be asked to sign in again after a successful change.</p>
            <form className="profile-form" onSubmit={onChangePassword}>
              <Input
                label="Current password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPw}
                onChange={(ev) => setCurrentPw(ev.target.value)}
                required
              />
              <Input
                label="New password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPw}
                onChange={(ev) => setNewPw(ev.target.value)}
                required
                hint="Minimum 8 characters; production may require stronger passwords."
              />
              <Input
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPw}
                onChange={(ev) => setConfirmPw(ev.target.value)}
                required
              />
              {pwError ? (
                <Alert variant="error" title="Could not update password">
                  {pwError}
                </Alert>
              ) : null}
              <div className="profile-form__actions">
                <Button type="submit" variant="secondary" disabled={pwLoading}>
                  {pwLoading ? 'Updating…' : 'Update password'}
                </Button>
              </div>
            </form>
          </section>

          <section className="ui-card profile-card profile-card--danger anim-fade-up anim-delay-3">
            <h2 className="profile-card__heading">Delete account</h2>
            <p className="profile-card__sub muted">
              Permanently remove your account. Assessments linked to your account remain stored for
              clinical records with personal identifiers removed where applicable.
            </p>
            <Button type="button" variant="secondary" className="profile-danger-btn" onClick={() => setDeleteOpen(true)}>
              Delete my account…
            </Button>
          </section>
        </div>
      </div>

      {deleteOpen ? (
        <div
          className="profile-modal-backdrop"
          role="presentation"
          onClick={() => (deleteLoading ? null : setDeleteOpen(false))}
        >
          <div
            className="profile-modal ui-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2 id="delete-dialog-title" className="profile-modal__title">
              Delete your account?
            </h2>
            <p className="muted" style={{ marginTop: 0, lineHeight: 1.55 }}>
              This cannot be undone. You will lose access to dashboards, assessments linked to this login, and stored profile
              details.
            </p>
            <form className="profile-form" onSubmit={onDeleteAccount}>
              <Input
                label="Confirm with your password"
                name="deletePassword"
                type="password"
                autoComplete="current-password"
                value={deletePw}
                onChange={(ev) => setDeletePw(ev.target.value)}
                required
              />
              <label className="profile-checkbox">
                <input
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={(ev) => setDeleteConfirm(ev.target.checked)}
                />
                <span>I understand this action is permanent.</span>
              </label>
              {deleteError ? (
                <Alert variant="error" title="Could not delete">
                  {deleteError}
                </Alert>
              ) : null}
              <div className="profile-modal__actions">
                <Button type="button" variant="secondary" disabled={deleteLoading} onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={deleteLoading} className="profile-delete-confirm">
                  {deleteLoading ? 'Deleting…' : 'Delete account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
