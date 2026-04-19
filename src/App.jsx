import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Roster from './pages/Roster'
import TimeTracking from './pages/TimeTracking'
import Payroll from './pages/Payroll'
import Sites from './pages/Sites'
import Incidents from './pages/Incidents'
import AuditLog from './pages/AuditLog'
import './styles.css'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="splash">
      <div className="splash-logo">Rosti<span>fy</span></div>
      <div className="splash-sub">Loading your workspace...</div>
      <div className="spinner"></div>
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, supabase }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="roster" element={<Roster />} />
            <Route path="timetracking" element={<TimeTracking />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="sites" element={<Sites />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="auditlog" element={<AuditLog />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
