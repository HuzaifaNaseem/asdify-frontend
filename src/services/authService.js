import { api } from './api'
import { clearTokens, writeTokens } from './authStorage'

export async function login(email, password) {
  const { data } = await api.post('/api/auth/login', { email, password })
  writeTokens(data.access_token, data.refresh_token)
  return data.user
}

/** POST /api/auth/google — exchange a Google OAuth access token for a session. */
export async function googleLogin(accessToken) {
  const { data } = await api.post('/api/auth/google', { access_token: accessToken })
  writeTokens(data.access_token, data.refresh_token)
  return data.user
}

export async function register(payload) {
  const { data } = await api.post('/api/auth/register', payload)
  if (data.access_token && data.refresh_token) {
    writeTokens(data.access_token, data.refresh_token)
  }
  return data
}

export async function logout() {
  try {
    await api.post('/api/auth/logout')
  } finally {
    clearTokens()
  }
}

export async function fetchMe() {
  const { data } = await api.get('/api/auth/me')
  return data.user
}

export async function forgotPassword(email) {
  const { data } = await api.post('/api/auth/forgot-password', { email }, { timeout: 45_000 })
  return data
}

export async function resetPasswordWithOtp(email, otp, newPassword) {
  const { data } = await api.post(
    '/api/auth/reset-password',
    {
      email,
      otp,
      new_password: newPassword,
    },
    { timeout: 45_000 },
  )
  return data
}

export async function resetPassword(token, newPassword) {
  const { data } = await api.post('/api/auth/reset-password', {
    token,
    new_password: newPassword,
  })
  return data
}

/** PATCH /api/auth/me — full_name, child_name, child_dob (child fields are parent-only on server). */
export async function updateProfile(patch) {
  const { data } = await api.patch('/api/auth/me', patch)
  return data.user
}

/** POST /api/auth/change-password — invalidates refresh token server-side. */
export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post('/api/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
  return data
}

/** DELETE /api/auth/me — requires current password in body. */
export async function deleteAccount(password) {
  const { data } = await api.delete('/api/auth/me', { data: { password } })
  return data
}
