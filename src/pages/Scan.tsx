
import React from 'react'
import { supabase } from '../lib/supabase'

export default function Scan() {
  const params = new URLSearchParams(location.search)
  const [cafe, setCafe] = React.useState<string>(params.get('cafe') || '')
  const [pin, setPin] = React.useState('')
  const [status, setStatus] = React.useState<string>('')

  async function award(e: React.FormEvent) {
    e.preventDefault()
    setStatus('')
    if (!cafe || !pin) { setStatus('Missing café or PIN'); return }
    const { data, error }: any = await (supabase as any).rpc('award_point', { cafe, pin })
    if (error) setStatus(error.message)
    else setStatus(`Stamped! New balance: ${data.new_balance}/${data.threshold}`)
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: '40px auto' }}>
        <h3>Validate your coffee</h3>
        <form onSubmit={award} className="row">
          <div style={{ width: '100%' }}>
            <label>Café ID</label>
            <input value={cafe} onChange={e=>setCafe(e.target.value)} placeholder="uuid-from-QR" />
          </div>
          <div style={{ width: '100%' }}>
            <label>Barista PIN</label>
            <input value={pin} onChange={e=>setPin(e.target.value)} placeholder="4-digit PIN" />
          </div>
          <button className="button">Add stamp</button>
          {status && <div style={{width:'100%'}} className={status.startsWith('Stamped') ? 'success' : 'error'}>{status}</div>}
        </form>
        <p className="small">Tip: The QR code should link to <code>/scan?cafe=&lt;cafe_id&gt;</code></p>
      </div>
    </div>
  )
}
