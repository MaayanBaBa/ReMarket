import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getMe } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    getMe()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo(() => {
    const login = (token, userData) => {
      localStorage.setItem('token', token)
      setUser(userData)
    }

    const logout = () => {
      localStorage.removeItem('token')
      setUser(null)
    }

    const refreshUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setUser(null)
        return null
      }
      const res = await getMe()
      setUser(res.data)
      return res.data
    }

    return { user, login, logout, loading, refreshUser }
  }, [user, loading])

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

