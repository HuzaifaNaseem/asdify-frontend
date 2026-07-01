import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { setOnAuthFailure } from '../services/api'
import { clearTokens, readAccessToken } from '../services/authStorage'
import * as auth from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null)
      navigate('/login', { replace: true })
    })
    return () => setOnAuthFailure(() => {})
  }, [navigate])

  const refreshUser = useCallback(async () => {
    const token = readAccessToken()
    if (!token) {
      setUser(null)
      return
    }
    try {
      const me = await auth.fetchMe()
      setUser(me)
    } catch {
      clearTokens()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await refreshUser()
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [refreshUser])

  const login = useCallback(
    async (email, password, redirectTo) => {
      const me = await auth.login(email, password)
      setUser(me)
      const safe =
        typeof redirectTo === 'string' &&
        redirectTo.startsWith('/') &&
        !redirectTo.startsWith('//') &&
        redirectTo !== '/login'
          ? redirectTo
          : null
      if (safe) {
        navigate(safe, { replace: true })
        return
      }
      if (me.role === 'admin') navigate('/admin/dashboard', { replace: true })
      else if (me.role === 'doctor') navigate('/doctor/dashboard', { replace: true })
      else navigate('/dashboard', { replace: true })
    },
    [navigate],
  )

  const register = useCallback(async (payload) => {
    const data = await auth.register(payload)
    if (data.access_token && data.refresh_token && data.user) {
      flushSync(() => {
        setUser(data.user)
      })
    }
    return data
  }, [])

  const logout = useCallback(async () => {
    await auth.logout()
    setUser(null)
    navigate('/', { replace: true })
  }, [navigate])

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      logout,
      register,
      refreshUser,
    }),
    [user, ready, login, logout, register, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* eslint-disable react-refresh/only-export-components -- hook paired with provider in this module */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
