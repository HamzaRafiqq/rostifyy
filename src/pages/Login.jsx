import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Account created! Check your email to verify, then log in.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-logo">Rosti<span>fy</span></div>
        <div className="login-tagline">The all-in-one workforce platform for shift-based businesses</div>
        <div className="login-features">
          {[
            { icon: '🤖', text: 'AI-powered roster generation' },
            { icon: '⏱', text: 'Real-time clock in & out tracking' },
            { icon: '💰', text: 'Automatic payroll calculation' },
            { icon: '🔐', text: 'SIA licence tracking for security teams' },
            { icon: '📋', text: 'Full audit log of every action' },
          ].map((f, i) => (
            <div className="login-feature" key={i}>
              <div className="login-feature-icon">{f.icon}</div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div className="login-form-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
          <div className="login-form-sub">{mode === 'login' ? 'Sign in to your Rostify workspace' : 'Set up your Rostify workspace'}</div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}
          {success && <div className="alert alert-success">✅ {success}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
              {loading ? '...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <div className="login-toggle">
            {mode === 'login' ? (
              <>Don't have an account? <button onClick={() => { setMode('signup'); setError(''); }}>Sign up free</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
