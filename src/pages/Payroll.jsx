import { useState, useEffect } from 'react'
import { useAuth } from '../App'

export default function Payroll() {
  const { supabase } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { loadPayroll() }, [])

  async function loadPayroll() {
    setLoading(true)
    const { data: emps } = await supabase.from('employees').select('*').eq('is_active', true).order('first_name')
    const { data: sessions } = await supabase.from('clock_sessions').select('employee_id, hours_worked').not('hours_worked', 'is', null)

    const hoursMap = {}
    sessions?.forEach(s => { hoursMap[s.employee_id] = (hoursMap[s.employee_id] || 0) + (s.hours_worked || 0) })

    const payrollRows = emps?.map(e => ({
      emp: e,
      hours: hoursMap[e.id] || 0,
      gross: (hoursMap[e.id] || 0) * e.pay_rate,
    })) || []

    setRows(payrollRows)
    setLoading(false)
  }

  async function exportCSV() {
    setExporting(true)
    const header = 'Name,Role,Hours Worked,Pay Rate (£/hr),Gross Pay (£)\n'
    const body = rows.map(r => `${r.emp.first_name} ${r.emp.last_name},${r.emp.role},${r.hours.toFixed(2)},${r.emp.pay_rate},${r.gross.toFixed(2)}`).join('\n')
    const blob = new Blob([header + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `rostify-payroll-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    await supabase.from('audit_log').insert([{ icon: '📥', action: 'Payroll exported to CSV', type: 'payroll' }])
    setExporting(false)
  }

  async function markAllPaid() {
    await supabase.from('audit_log').insert([{ icon: '✅', action: `Payroll marked as paid — £${totalGross.toFixed(2)}`, type: 'payroll' }])
    alert('Payroll marked as paid and recorded in audit log!')
  }

  const totalHours = rows.reduce((s, r) => s + r.hours, 0)
  const totalGross = rows.reduce((s, r) => s + r.gross, 0)
  const avgRate = rows.length ? rows.reduce((s, r) => s + r.emp.pay_rate, 0) / rows.length : 0

  if (loading) return <div className="content"><div className="loading-wrap"><div className="loading-spinner"></div></div></div>

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Payroll</div>
          <div className="page-sub">Based on all tracked hours</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-secondary" onClick={exportCSV} disabled={exporting}>📥 Export CSV</button>
          <button className="btn btn-success" onClick={markAllPaid}>✅ Mark All Paid</button>
        </div>
      </div>
      <div className="content">
        <div className="payroll-banner">
          <div>
            <div className="payroll-banner-title">Total Gross Payroll</div>
            <div className="payroll-banner-amount">£{totalGross.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right', opacity: 0.8 }}>
            <div style={{ fontSize: 13, marginBottom: 4 }}>{rows.length} employees</div>
            <div style={{ fontSize: 13 }}>{totalHours.toFixed(1)} total hours</div>
          </div>
        </div>

        <div className="payroll-stats">
          <div className="payroll-stat">
            <div className="payroll-stat-val">{totalHours.toFixed(1)}h</div>
            <div className="payroll-stat-label">Total Hours Tracked</div>
          </div>
          <div className="payroll-stat">
            <div className="payroll-stat-val">£{avgRate.toFixed(2)}</div>
            <div className="payroll-stat-label">Average Pay Rate</div>
          </div>
          <div className="payroll-stat">
            <div className="payroll-stat-val">{rows.filter(r => r.hours > 0).length}</div>
            <div className="payroll-stat-label">Employees With Hours</div>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {rows.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">💰</div>
              <div className="empty-title">No payroll data yet</div>
              <div className="empty-sub">Clock in employees to start tracking hours and generating payroll</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Employee</th><th>Role</th><th>Hours Worked</th><th>Pay Rate</th><th>Gross Pay</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar">{r.emp.first_name[0]}</div>
                          <strong>{r.emp.first_name} {r.emp.last_name}</strong>
                        </div>
                      </td>
                      <td>{r.emp.role}</td>
                      <td><strong>{r.hours.toFixed(1)}h</strong></td>
                      <td>£{parseFloat(r.emp.pay_rate).toFixed(2)}/hr</td>
                      <td><strong style={{ color: 'var(--primary)', fontSize: 15 }}>£{r.gross.toFixed(2)}</strong></td>
                      <td><span className={`badge ${r.hours > 0 ? 'badge-amber' : 'badge-gray'}`}>{r.hours > 0 ? '⏳ Pending' : 'No Hours'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
