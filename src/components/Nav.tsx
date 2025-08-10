
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Nav({ role }: { role?: 'customer'|'owner'|null }) {
  return (
    <div className="nav">
      <Link to="/app">Home</Link>
      <Link to="/rewards">Rewards</Link>
      {role === 'owner' && <Link to="/owner">Owner</Link>}
      <a href="#" onClick={async (e) => { e.preventDefault(); await (supabase as any).auth.signOut(); location.href='/'; }}>Logout</a>
    </div>
  )
}
