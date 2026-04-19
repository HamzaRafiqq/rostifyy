import { useState, useEffect } from 'react'
import { useAuth } from '../App'

export default function TimeTracking() {
  const { supabase } = useAuth()
  const [employees, setEmployees] = useState([])
  const [sessions, setSessions] = useState({})
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  useEffect(() => { loadData() }, [])
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  async function loadData() {
    setLoading(true)
    const { data: emps } = await supabase.from('employees').select('*').eq('is_active', true).order('first_name')
    const { data: openSessions } = await supabase.from('clock_sessions').select('*').is('clock_out', null)
    const sessionMap = {}
    openSessions?.forEach(s => { sessionMap[s.employee_id] = s })
    setEmployees(emps || [])
    setSessions(sessionMap)
    setLoading(false)
  }

  async function clockIn(emp) {
    const { data } = await supabase.from('clock_sessions').insert([{
      employee_id: emp.id,
      clock_in: new Date().toISOString(),
    }]).select().single()
    await supabase.from('audit_log').insert([{ icon: '🟢', action: `${emp.first_name} ${emp.last_name} clocked in`, type: 'clock' }])
    setSessions(prev => ({ ...prev, [emp.id]: data }))
  }

  async function clockOut(emp) {
    const session = sessions[emp.id]
    if (!session) return
    const clockOut = new Date().toISOString()
    const hoursWorked = (new Date(clockOut) - new Date(session.clock_in)) / 3600000
    await supabase.from('clock_sessions').update({ clock_out: clockOut, hours_worked: parseFloat(hoursWorked.toFixed(2)) }).eq('id', session.id)
    await supabase.from('audit_log').insert([{ icon: '🔴', action: `${emp.first_name} ${emp.last_name} clocked out (${hoursWorked.toFixed(1)}h)`, type: 'clock' }])
    setSessions(prev => { const n = { ...prev }; delete n[emp.id]; return n })
  }

  function getElapsed(session) {
    if (!session?.clock_in) return '0h 0m'
    const ms = now - new Date(session.clock_in)
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  function getClockInTime(session) {
    if (!session?.clock_in) return ''
    return new Date(session.clock_in).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <div className="content"><div className="loading-wrap"><div className="loading-spinner"></div></div></div>

  const onShift = employees.filter(e => sessions[e.id])
  const offShift = employees.filter(e => !sessions[e.id])

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Time Tracking</div>
          <div className="page-sub">{onShift.length} on shift · {offShift.length} off shift</div>
        </div>
        <div className="topbar-right">
          <div style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>
      <div className="content">
        {employees.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">⏱</div>
              <div className="empty-title">No employees yet</div>
              <div className="empty-sub">Add employees to start tracking time</div>
            </div>
          </div>
        ) : (
          <>
            {onShift.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🟢 Currently On Shift</div>
                <div className="clock-grid" style={{ marginBottom: 24 }}>
                  {onShift.map(emp => (
                    <div className="clock-card on-shift" key={emp.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div className="avatar">{emp.first_name[0]}</div>
                        <div>
                          <div className="clock-emp-name">{emp.first_name} {emp.last_name}</div>
                          <div className="clock-emp-role">{emp.role} · £{emp.pay_rate}/hr</div>
                        </div>
                      </div>
                      <div className="clock-status">
                        <div className="status-dot in"></div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>On Shift</span>
                      </div>
                      <div className="clock-big-time">{getElapsed(sessions[emp.id])}</div>
                      <div className="clock-label">Since {getClockInTime(sessions[emp.id])}</div>
                      <button className="btn btn-danger btn-sm" onClick={() => clockOut(emp)}>🔴 Clock Out</button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {offShift.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>⚫ Off Shift</div>
                <div className="clock-grid">
                  {offShift.map(emp => (
                    <div className="clock-card" key={emp.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div className="avatar">{emp.first_name[0]}</div>
                        <div>
                          <div className="clock-emp-name">{emp.first_name} {emp.last_name}</div>
                          <div className="clock-emp-role">{emp.role} · £{emp.pay_rate}/hr</div>
                        </div>
                      </div>
                      <div className="clock-status">
                        <div className="status-dot out"></div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>Off Shift</span>
                      </div>
                      <div className="clock-big-time" style={{ color: 'var(--muted)', fontSize: 20 }}>—</div>
                      <div className="clock-label">Not clocked in</div>
                      <button className="btn btn-success btn-sm" onClick={() => clockIn(emp)}>🟢 Clock In</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
