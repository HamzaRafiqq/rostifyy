import { useState, useEffect } from 'react'
import { useAuth } from '../App'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const SHIFT_LABELS = { am: '8am–4pm', pm: '2pm–10pm', night: '10pm–6am', off: 'Off' }
const SHIFT_HOURS = { am: 8, pm: 8, night: 8, off: 0 }

export default function Roster() {
  const { supabase } = useAuth()
  const [employees, setEmployees] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ employee_id: '', day: 'Monday', shift_type: 'am' })
  const [weekStart, setWeekStart] = useState(getMonday())

  function getMonday(date = new Date()) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff); d.setHours(0,0,0,0)
    return d
  }

  useEffect(() => { loadData() }, [weekStart])

  async function loadData() {
    setLoading(true)
    const [{ data: emps }, { data: sh }] = await Promise.all([
      supabase.from('employees').select('*').eq('is_active', true).order('first_name'),
      supabase.from('shifts').select('*').eq('week_start', weekStart.toISOString().split('T')[0]),
    ])
    setEmployees(emps || [])
    setShifts(sh || [])
    setLoading(false)
  }

  function getShift(empId, day) {
    return shifts.find(s => s.employee_id === empId && s.day === day)
  }

  async function generateRoster() {
    if (employees.length === 0) return
    setGenerating(true)
    const shiftTypes = ['am', 'pm', 'off']
    const newShifts = []
    for (const emp of employees) {
      for (const day of DAYS) {
        let type = 'off'
        if (day === 'Sunday') { type = 'off' }
        else if (day === 'Saturday') { type = Math.random() > 0.5 ? 'off' : (Math.random() > 0.5 ? 'am' : 'pm') }
        else { type = shiftTypes[Math.floor(Math.random() * shiftTypes.length)] }
        newShifts.push({ employee_id: emp.id, day, shift_type: type, week_start: weekStart.toISOString().split('T')[0] })
      }
    }
    await supabase.from('shifts').delete().eq('week_start', weekStart.toISOString().split('T')[0])
    await supabase.from('shifts').insert(newShifts)
    await supabase.from('audit_log').insert([{ icon: '🤖', action: 'AI auto-generated weekly roster', type: 'roster' }])
    loadData(); setGenerating(false)
  }

  async function assignShift() {
    if (!form.employee_id) return
    const existing = getShift(form.employee_id, form.day)
    if (existing) {
      await supabase.from('shifts').update({ shift_type: form.shift_type }).eq('id', existing.id)
    } else {
      await supabase.from('shifts').insert([{ ...form, week_start: weekStart.toISOString().split('T')[0] }])
    }
    const emp = employees.find(e => e.id === form.employee_id)
    await supabase.from('audit_log').insert([{ icon: '📅', action: `${emp?.first_name} assigned ${SHIFT_LABELS[form.shift_type]} on ${form.day}`, type: 'roster' }])
    setShowModal(false); loadData()
  }

  function getTotalHours(empId) {
    return DAYS.reduce((sum, d) => {
      const s = getShift(empId, d)
      return sum + (s ? SHIFT_HOURS[s.shift_type] || 0 : 0)
    }, 0)
  }

  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Roster</div>
          <div className="page-sub">
            Week of {weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-secondary" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }}>← Prev</button>
          <button className="btn btn-secondary" onClick={() => setWeekStart(getMonday())}>Today</button>
          <button className="btn btn-secondary" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }}>Next →</button>
          <button className="btn btn-secondary" onClick={() => { setForm({ ...form, employee_id: employees[0]?.id || '' }); setShowModal(true) }}>+ Assign Shift</button>
          <button className="btn btn-primary" onClick={generateRoster} disabled={generating}>
            {generating ? '⏳ Generating...' : '🤖 Auto-Generate'}
          </button>
        </div>
      </div>
      <div className="content">
        {loading ? (
          <div className="loading-wrap"><div className="loading-spinner"></div></div>
        ) : employees.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">📅</div>
              <div className="empty-title">No employees yet</div>
              <div className="empty-sub">Add employees first to build a roster</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    {DAYS.map(d => <th key={d}>{d.slice(0, 3)}</th>)}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{emp.first_name[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.first_name} {emp.last_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{emp.role}</div>
                          </div>
                        </div>
                      </td>
                      {DAYS.map(day => {
                        const shift = getShift(emp.id, day)
                        const type = shift?.shift_type || 'off'
                        return (
                          <td key={day}>
                            <span className={`shift-pill shift-${type}`}>
                              {type === 'off' ? 'Off' : type.toUpperCase()}
                            </span>
                          </td>
                        )
                      })}
                      <td><strong>{getTotalHours(emp.id)}h</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Assign Shift</div>
            <div className="form-group">
              <label className="form-label">Employee</label>
              <select className="form-select" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Day</label>
                <select className="form-select" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Shift</label>
                <select className="form-select" value={form.shift_type} onChange={e => setForm({ ...form, shift_type: e.target.value })}>
                  <option value="am">Morning (8am–4pm)</option>
                  <option value="pm">Afternoon (2pm–10pm)</option>
                  <option value="night">Night (10pm–6am)</option>
                  <option value="off">Day Off</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={assignShift}>Assign Shift</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
