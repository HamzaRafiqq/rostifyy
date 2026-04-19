import { useState, useEffect } from 'react'
import { useAuth } from '../App'

export default function Employees() {
  const { supabase } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ first_name: '', last_name: '', role: '', pay_rate: '', contract_type: 'Full-time', site: '', license_number: '', license_expiry: '', clearance_level: 'None' })

  useEffect(() => { loadEmployees() }, [])

  async function loadEmployees() {
    setLoading(true)
    const { data } = await supabase.from('employees').select('*').order('first_name')
    setEmployees(data || [])
    setLoading(false)
  }

  async function addEmployee() {
    if (!form.first_name || !form.last_name || !form.role || !form.pay_rate) { setError('Please fill in all required fields'); return }
    setSaving(true); setError('')
    const { error } = await supabase.from('employees').insert([{ ...form, pay_rate: parseFloat(form.pay_rate), is_active: true }])
    if (error) { setError(error.message); setSaving(false); return }
    await supabase.from('audit_log').insert([{ icon: '👤', action: `${form.first_name} ${form.last_name} added as ${form.role}`, type: 'employee' }])
    setShowModal(false)
    setForm({ first_name: '', last_name: '', role: '', pay_rate: '', contract_type: 'Full-time', site: '', license_number: '', license_expiry: '', clearance_level: 'None' })
    loadEmployees()
    setSaving(false)
  }

  async function toggleActive(emp) {
    await supabase.from('employees').update({ is_active: !emp.is_active }).eq('id', emp.id)
    await supabase.from('audit_log').insert([{ icon: emp.is_active ? '🔴' : '🟢', action: `${emp.first_name} ${emp.last_name} marked ${emp.is_active ? 'inactive' : 'active'}`, type: 'employee' }])
    loadEmployees()
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Employees</div>
          <div className="page-sub">{employees.length} team members</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setError('') }}>+ Add Employee</button>
        </div>
      </div>
      <div className="content">
        {loading ? (
          <div className="loading-wrap"><div className="loading-spinner"></div></div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {employees.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">👥</div>
                <div className="empty-title">No employees yet</div>
                <div className="empty-sub">Add your first team member to get started</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th><th>Role</th><th>Pay Rate</th><th>Contract</th>
                      <th>SIA Licence</th><th>Licence Expiry</th><th>Site</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(e => {
                      const expired = e.license_expiry && new Date(e.license_expiry) < new Date()
                      const expiringSoon = e.license_expiry && new Date(e.license_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && !expired
                      return (
                        <tr key={e.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="avatar">{e.first_name[0]}</div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{e.first_name} {e.last_name}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{e.clearance_level !== 'None' ? `🔒 ${e.clearance_level}` : ''}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-blue">{e.role}</span></td>
                          <td>£{parseFloat(e.pay_rate).toFixed(2)}/hr</td>
                          <td>{e.contract_type}</td>
                          <td>{e.license_number || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                          <td>
                            {e.license_expiry ? (
                              <span className={`badge ${expired ? 'badge-red' : expiringSoon ? 'badge-amber' : 'badge-green'}`}>
                                {expired ? '⚠️ Expired' : expiringSoon ? '⏰ Soon' : '✓ Valid'}: {new Date(e.license_expiry).toLocaleDateString('en-GB')}
                              </span>
                            ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                          </td>
                          <td>{e.site || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                          <td><span className={`badge ${e.is_active ? 'badge-green' : 'badge-gray'}`}>{e.is_active ? 'Active' : 'Inactive'}</span></td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(e)}>
                              {e.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-title">Add New Employee</div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-input" placeholder="Sarah" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-input" placeholder="Mitchell" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role / Position *</label>
                <input className="form-input" placeholder="Security Guard, Barista..." value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Pay Rate (£/hr) *</label>
                <input className="form-input" type="number" placeholder="12.50" step="0.01" value={form.pay_rate} onChange={e => setForm({ ...form, pay_rate: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contract Type</label>
                <select className="form-select" value={form.contract_type} onChange={e => setForm({ ...form, contract_type: e.target.value })}>
                  <option>Full-time</option><option>Part-time</option><option>Zero hours</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Site / Location</label>
                <input className="form-input" placeholder="Westfield, City Centre..." value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} />
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔐 Security Details (optional)</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SIA Licence Number</label>
                  <input className="form-input" placeholder="1234-5678-9012-3456" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Licence Expiry Date</label>
                  <input className="form-input" type="date" value={form.license_expiry} onChange={e => setForm({ ...form, license_expiry: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Clearance Level</label>
                <select className="form-select" value={form.clearance_level} onChange={e => setForm({ ...form, clearance_level: e.target.value })}>
                  <option>None</option><option>Basic</option><option>Enhanced</option><option>SC</option><option>DV</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addEmployee} disabled={saving}>{saving ? 'Saving...' : 'Add Employee'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
