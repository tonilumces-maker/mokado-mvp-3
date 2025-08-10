
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Scan from './pages/Scan'
import OwnerDashboard from './pages/OwnerDashboard'
import OwnerQR from './pages/OwnerQR'
import Rewards from './pages/Rewards'
import './styles.css'

function App() {
  const [session, setSession] = React.useState<any>(null)
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event: any, s: any) => setSession(s))
    return () => { listener.subscription.unsubscribe() }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={session ? <Navigate to="/app" /> : <Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={session ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/scan" element={session ? <Scan /> : <Navigate to="/login" />} />
        <Route path="/owner" element={session ? <OwnerDashboard /> : <Navigate to="/login" />} />
        <Route path="/owner/qr" element={session ? <OwnerQR /> : <Navigate to="/login" />} />
        <Route path="/rewards" element={session ? <Rewards /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
