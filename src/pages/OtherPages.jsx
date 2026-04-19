// Sites.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../App'

export function Sites() {
  const { supabase } = useAuth()
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ site_name: '', address: '', client_name: '', required_guards: 1, contact_phone: '' })

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    const { data } = await supabase.from('sites').select('*').order('site_name')
    setSites(data || []); setLoading(false)
  }
  async function addSite() {
    if (!form.site_name) return
    await supabase.from('sites').insert([{ ...form, required_guards: parseInt(form.required_guards) }])
    await supabase.from('audit_log').insert([{ icon: '🏢', action: `Site added: ${form.site_name}`, type: 'site' }])
    setShowModal(false); setForm({ site_name: '', address: '', client_name: '', required_guards: 1, contact_phone: '' }); load()
  }
  async function removeSite(site) {
    if (!confirm(`Remove ${site.site_name}?`)) return
    await supabase.from('sites').delete().eq('id', site.id)
    load()
  }

  return (
    <>
      <div className="topbar">
        <div><div className="page-title">Sites</div><div className="page-sub">Manage your security locations</div></div>
        <div className="topbar-right"><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Site</button></div>
      </div>
      <div className="content">
        {loading ? <div className="loading-wrap"><div className="loading-spinner"></div></div> : (
          <div className="card" style={{ padding: 0 }}>
            {sites.length === 0 ? (
              <div className="empty"><div className="empty-icon">🏢</div><div className="empty-title">No sites yet</div><div className="empty-sub">Add your security locations to assign staff to them</div></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Site Name</th><th>Client</th><th>Address</th><th>Required Guards</th><th>Contact</th><th>Actions</th></tr></thead>
                  <tbody>
                    {sites.map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.site_name}</strong></td>
                        <td>{s.client_name || '—'}</td>
                        <td>{s.address || '—'}</td>
                        <td><span className="badge badge-blue">{s.required_guards} guards</span></td>
                        <td>{s.contact_phone || '—'}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => removeSite(s)}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Add Site</div>
            <div className="form-group"><label className="form-label">Site Name *</label><input className="form-input" placeholder="Westfield Shopping Centre" value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Client Name</label><input className="form-input" placeholder="Westfield Group" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Address</label><input className="form-input" placeholder="123 Main St, London" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Required Guards</label><input className="form-input" type="number" min="1" value={form.required_guards} onChange={e => setForm({ ...form, required_guards: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Contact Phone</label><input className="form-input" placeholder="+44 20 1234 5678" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addSite}>Add Site</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Incidents.jsx
export function Incidents() {
  const { supabase } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [employees, setEmployees] = useState([])
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ employee_id: '', site_id: '', description: '', severity: 'low' })

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    const [{ data: inc }, { data: emps }, { data: s }] = await Promise.all([
      supabase.from('incidents').select('*, employees(first_name, last_name), sites(site_name)').order('created_at', { ascending: false }),
      supabase.from('employees').select('id, first_name, last_name').eq('is_active', true),
      supabase.from('sites').select('id, site_name'),
    ])
    setIncidents(inc || []); setEmployees(emps || []); setSites(s || []); setLoading(false)
  }
  async function addIncident() {
    if (!form.description || !form.employee_id) return
    await supabase.from('incidents').insert([{ ...form, reported_at: new Date().toISOString() }])
    const emp = employees.find(e => e.id === form.employee_id)
    await supabase.from('audit_log').insert([{ icon: '🚨', action: `Incident reported by ${emp?.first_name} — ${form.severity} severity`, type: 'incident' }])
    setShowModal(false); setForm({ employee_id: '', site_id: '', description: '', severity: 'low' }); load()
  }

  const SEVERITY_COLORS = { high: 'badge-red', medium: 'badge-amber', low: 'badge-green' }

  return (
    <>
      <div className="topbar">
        <div><div className="page-title">Incidents</div><div className="page-sub">Security incident reports</div></div>
        <div className="topbar-right"><button className="btn btn-primary" onClick={() => { setForm({ ...form, employee_id: employees[0]?.id || '' }); setShowModal(true) }}>+ Report Incident</button></div>
      </div>
      <div className="content">
        {loading ? <div className="loading-wrap"><div className="loading-spinner"></div></div> : incidents.length === 0 ? (
          <div className="card"><div className="empty"><div className="empty-icon">🚨</div><div className="empty-title">No incidents reported</div><div className="empty-sub">All clear — no incidents on record</div></div></div>
        ) : incidents.map(inc => (
          <div key={inc.id} className={`incident-card ${inc.severity}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <span className={`badge ${SEVERITY_COLORS[inc.severity]}`} style={{ marginRight: 8 }}>{inc.severity.toUpperCase()}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{inc.sites?.site_name || 'Unknown site'}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(inc.reported_at || inc.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div style={{ fontSize: 14, marginBottom: 6 }}>{inc.description}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Reported by: {inc.employees?.first_name} {inc.employees?.last_name}</div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Report Incident</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Reported By</label>
                <select className="form-select" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Site</label>
                <select className="form-select" value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })}>
                  <option value="">No site</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select className="form-select" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-textarea" placeholder="Describe what happened..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={addIncident}>Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// AuditLog.jsx
export function AuditLog() {
  const { supabase } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200)
    setLogs(data || []); setLoading(false)
  }

  const types = ['all', 'employee', 'roster', 'clock', 'payroll', 'incident', 'site']
  const filtered = filter === 'all' ? logs : logs.filter(l => l.type === filter)

  return (
    <>
      <div className="topbar">
        <div><div className="page-title">Audit Log</div><div className="page-sub">Complete record of all actions</div></div>
        <div className="topbar-right">
          <select className="form-select" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
            {types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="content">
        <div className="card">
          {loading ? <div className="loading-wrap"><div className="loading-spinner"></div></div> : filtered.length === 0 ? (
            <div className="empty"><div className="empty-icon">📋</div><div className="empty-title">No activity yet</div></div>
          ) : filtered.map(l => (
            <div className="log-item" key={l.id}>
              <div className="log-icon">{l.icon || '📋'}</div>
              <div style={{ flex: 1 }}>
                <div className="log-text">{l.action}</div>
                <div className="log-time">{new Date(l.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <span className="badge badge-gray">{l.type}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Sites
