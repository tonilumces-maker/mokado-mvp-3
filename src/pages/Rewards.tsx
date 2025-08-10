
import React from 'react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

export default function Rewards() {
  const [rows, setRows] = React.useState<any[]>([])

  React.useEffect(() => {
    (async () => {
      const { data: me }: any = await (supabase as any).auth.getUser()
      const { data }: any = await (supabase as any).from('transactions').select('created_at, cafe_id, points_awarded').eq('user_id', me.user?.id).order('created_at', { ascending: false }).limit(20)
      setRows(data || [])
    })()
  }, [])

  return (
    <div className="container">
      <Nav />
      <div className="card">
        <h3>Recent stamps</h3>
        <table>
          <thead><tr><th>Date</th><th>Café</th><th>Points</th></tr></thead>
          <tbody>
            {rows.map((r, i) => <tr key={i}><td>{new Date(r.created_at).toLocaleString()}</td><td>{r.cafe_id}</td><td>{r.points_awarded}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
