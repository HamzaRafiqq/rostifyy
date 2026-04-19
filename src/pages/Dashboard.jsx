import { useState, useEffect } from 'react'
import { useAuth } from '../App'

export default function Dashboard() {
  const { supabase } = useAuth()
  const [stats, setStats] = useState({ employees: 0, onShift: 0, hoursThisWeek: 0, payrollDue: 0 })
  const [recentLogs, setRecentLogs] = useState([])
  const [todayShifts, setTodayShifts] = useState([])
  const [loading, setLoading] = useState(true)

  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const today = DAYS[new Date().getDay()]

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    setLoading(true)
    const [{ data: emps }, { data: sessions }, { data: shifts }, { data: logs }] = await Promise.all([
      supabase.from('employees').select('*').eq('is_active', true),
      supabase.from('clock_sessions').select('*').is('clock_out', null),
      supabase.from('shifts').select('*, employees(first_name, last_name, role)').eq('day', today),
      supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(8),
    ])

    const allSessions = await supabase.from('clock_sessions').select('hours_worked').not('hours_worked', 'is', null)
    const totalHours = allSessions.data?.reduce((s, r) => s + (r.hours_worked || 0), 0) || 0
    const payroll = emps?.reduce((s, e) => s + (totalHours / (emps?.length || 1)) * e.pay_rate, 0) || 0

    setStats({
      employees: emps?.length || 0,
      onShift: sessions?.length || 0,
      hoursThisWeek: totalHours.toFixed(1),
      payrollDue: payroll.toFixed(2),
    })
    setTodayShifts(shifts || [])
    setRecentLogs(logs || [])
    setLoading(false)
  }

  const SHIFT_LABELS = { am: '8am–4pm', pm: '2pm–10pm', night: '10pm–6am', off: 'Off' }

  if (loading) return <div className="content"><div className="loading-wrap"><div className="loading-spinner"></div></div></div>

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Welcome back — here's your workforce overview</div>
        </div>
        <div className="topbar-right">
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>
      <div className="content">
        <div className="stats-grid">
          {[
            { icon: '👥', label: 'Total Employees', value: stats.employees, cls: 'blue', sub: 'Active team members' },
            { icon: '🟢', label: 'On Shift Now', value: stats.onShift, cls: 'green', sub: 'Clocked in right now' },
            { icon: '⏱', label: 'Hours This Week', value: `${stats.hoursThisWeek}h`, cls: 'amber', sub: 'Across all employees' },
            { icon: '💰', label: 'Payroll Due', value: `£${stats.payrollDue}`, cls: 'red', sub: 'Based on hours tracked' },
          ].map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.cls}`}>{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Today's Shifts</div>
                <div className="card-sub">{today} — who's scheduled</div>
              </div>
            </div>
            {todayShifts.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📅</div>
                <div className="empty-sub">No shifts scheduled for today</div>
              </div>
            ) : todayShifts.filter(s => s.shift_type !== 'off').map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar">{s.employees?.first_name?.[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.employees?.first_name} {s.employees?.last_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.employees?.role}</div>
                  </div>
                </div>
                <span className={`shift-pill shift-${s.shift_type}`}>{SHIFT_LABELS[s.shift_type]}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent Activity</div>
                <div className="card-sub">Latest actions across your team</div>
              </div>
            </div>
            {recentLogs.length === 0 ? (
              <div className="empty"><div className="empty-sub">No recent activity</div></div>
            ) : recentLogs.map(l => (
              <div className="log-item" key={l.id}>
                <div className="log-icon">{l.icon || '📋'}</div>
                <div>
                  <div className="log-text">{l.action}</div>
                  <div className="log-time">{new Date(l.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
