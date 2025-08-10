
import React from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = React.useState('')
  const [pass, setPass] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string|null>(null)

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error }: any = await (supabase as any).auth.signInWithPassword({ email, password: pass })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error }: any = await (supabase as any).auth.signUp({ email, password: pass })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: '40px auto' }}>
        <h1>Mokado</h1>
        <p className="small">Sign up or sign in with email & password.</p>
        <form onSubmit={signIn} className="row">
          <div style={{ width: '100%' }}>
            <label>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div style={{ width: '100%' }}>
            <label>Password</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="row" style={{ width: '100%' }}>
            <button className="button" onClick={signIn} disabled={loading}>Sign in</button>
            <button className="button" onClick={signUp} disabled={loading}>Create account</button>
          </div>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  )
}
