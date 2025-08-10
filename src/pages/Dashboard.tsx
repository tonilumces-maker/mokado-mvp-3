
import React from 'react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

type Profile = { id: string; display_name: string|null; role: 'customer'|'owner' }

export default function Dashboard() {
  const [profile, setProfile] = React.useState<Profile|null>(null)
  const [cafes, setCafes] = React.useState<any[]>([])

  React.useEffect(() => {
    (async () => {
      const { data: { user } }: any = await (supabase as any).auth.getUser()
      if (!user) return
      const { data: p }: any = await (supabase as any).from('profiles').select('*').eq('id', user.id).single()
      setProfile(p as any)
      const { data: c }: any = await (supabase as any).from('cafes').select('id,name').order('name', { ascending: true })
      setCafes(c || [])
    })()
  }, [])

  return (
    <div className="container">
      <div className="header">
        <h2>Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}</h2>
      </div>
      <Nav role={profile?.role ?? null} />
      <div className="row">
        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <h3>Your balance</h3>
          <p className="small">Pick a café to see your points and redeem.</p>
          <Balances cafes={cafes} />
        </div>
        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <h3>Scan after a coffee</h3>
          <p className="small">Ask the barista to enter their 4-digit PIN to validate.</p>
          <a className="button" href="/scan">Open scan page</a>
        </div>
      </div>
    </div>
  )
}

function Balances({ cafes }: { cafes: {id:string;name:string}[] }) {
  const [selected, setSelected] = React.useState<string>('')
  const [balance, setBalance] = React.useState<number|null>(null)
  const [threshold, setThreshold] = React.useState<number|null>(null)

  async function load() {
    if (!selected) return
    const { data: cs }: any = await (supabase as any).from('cafe_settings').select('redeem_threshold').eq('cafe_id', selected).single()
    setThreshold(cs?.redeem_threshold ?? null)
    const { data, error }: any = await (supabase as any).rpc('balance_for', { cafe: selected })
    if (!error) setBalance(data as number)
  }

  React.useEffect(() => { load() }, [selected])

  return (
    <div>
      <select value={selected} onChange={e=>setSelected(e.target.value)}>
        <option value="">Choose a café</option>
        {cafes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {balance !== null && (
        <p>Balance at this café: <strong>{balance}</strong> / {threshold ?? '—'} points</p>
      )}
      {threshold !== null && balance !== null && balance >= threshold && (
        <button className="button" onClick={async () => {
          const { error }: any = await (supabase as any).rpc('redeem_reward', { cafe: selected })
          if (error) alert(error.message); else { alert('Redeemed! Enjoy your free coffee ☕'); load() }
        }}>Redeem free coffee</button>
      )}
    </div>
  )
}
