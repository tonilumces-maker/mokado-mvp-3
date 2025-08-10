
// In-browser demo client (no backend). Stores data in localStorage.
type Session = { user: { id: string, email: string } } | null

const storeKey = 'mokado_demo_store_v1'
const initData = { profiles: [], cafes: [], settings: [], transactions: [], redemptions: [] }

function load() {
  try { return JSON.parse(localStorage.getItem(storeKey) || 'null') || structuredClone(initData) } catch { return structuredClone(initData) }
}
function save(db:any) { localStorage.setItem(storeKey, JSON.stringify(db)) }
function uid() { return crypto.randomUUID() }

let current: Session = null

export const demoAuth = {
  async getSession(){ return { data: { session: current } } },
  async getUser(){ return { data: { user: current?.user || null } } },
  onAuthStateChange(cb: any){ return { data: { subscription: { unsubscribe(){} } } } },
  async signInWithPassword({ email, password }:{email:string,password:string}){
    const db = load()
    let p = db.profiles.find((x:any)=>x.email===email)
    if (!p) { return { data: null, error: { message: 'User not found. Try Create account.' } } }
    current = { user: { id: p.id, email } }
    return { data: { session: current }, error: null }
  },
  async signUp({ email, password }:{email:string,password:string}){
    const db = load()
    if (db.profiles.find((x:any)=>x.email===email)) return { data:null, error:{ message:'Email already registered' } }
    const id = uid()
    db.profiles.push({ id, email, display_name: email.split('@')[0], role: 'customer' })
    save(db)
    current = { user: { id, email } }
    return { data: { user: current.user }, error: null }
  },
  async signOut(){ current = null; return { error: null } }
}

function table(name:string){
  return {
    select(){ 
      const db = load()
      return { eq(field:string, value:any){ 
        const rows = db[name].filter((r:any)=>r[field]===value)
        return { single(){ return { data: rows[0]||null, error: rows[0]?null:{message:'Not found'} } }, order(){ return { data: rows } }, limit(){ return { data: rows } } }
      }, order(_f:string, _o:any){ const db = load(); return { data: db[name] } } }
    },
    insert(row:any){
      const db = load()
      if (Array.isArray(row)) row.forEach(r=>db[name].push(r)); else db[name].push(row)
      save(db)
      return { select(_s?:string){ return { single(){ return { data: row, error: null } } } } }
    }
  }
}

export const demoRpc = async (fn:string, args:any) => {
  const db = load()
  const user = current?.user
  if (!user) return { data: null, error: { message:'Not signed in' } }
  if (fn==='balance_for'){
    const { cafe } = args
    const earned = db.transactions.filter((t:any)=>t.user_id===user.id && t.cafe_id===cafe).reduce((a:number,b:any)=>a+(b.points_awarded||1),0)
    const spent = db.redemptions.filter((r:any)=>r.user_id===user.id && r.cafe_id===cafe).reduce((a:number,b:any)=>a+(b.points_spent||0),0)
    return { data: earned - spent, error: null }
  }
  if (fn==='redeem_reward'){
    const { cafe } = args
    const s = db.settings.find((s:any)=>s.cafe_id===cafe) || { redeem_threshold: 10 }
    const bal = (await demoRpc('balance_for', { cafe })).data as number
    if (bal < s.redeem_threshold) return { data: null, error: { message: 'Not enough points to redeem' } }
    db.redemptions.push({ id: uid(), user_id: user.id, cafe_id: cafe, points_spent: s.redeem_threshold, created_at: new Date().toISOString() })
    save(db)
    return { data: { ok:true, new_balance: bal - s.redeem_threshold }, error: null }
  }
  if (fn==='award_point'){
    const { cafe, pin } = args
    const s = db.settings.find((x:any)=>x.cafe_id===cafe)
    if (!s) return { data: null, error: { message:'Cafe not found' } }
    if ((s.pin||'') !== pin) return { data: null, error: { message:'Invalid PIN' } }
    const now = Date.now()
    const last = db.transactions.filter((t:any)=>t.user_id===user.id && t.cafe_id===cafe).map((t:any)=>new Date(t.created_at).getTime()).sort((a:number,b:number)=>b-a)[0]
    if (last && now - last < 3*60*1000) return { data:null, error:{ message:'Too soon; try again in a few minutes' } }
    db.transactions.push({ id: uid(), user_id: user.id, cafe_id: cafe, points_awarded: 1, created_at: new Date().toISOString() })
    save(db)
    const bal = (await demoRpc('balance_for', { cafe })).data as number
    return { data: { ok:true, new_balance: bal, threshold: s.redeem_threshold||10 }, error: null }
  }
  if (fn==='count_tx'){
    const { cafe, win } = args
    const ms = win==='day'? 24*3600e3 : win==='week'? 7*24*3600e3 : 30*24*3600e3
    const cut = Date.now() - ms
    const count = db.transactions.filter((t:any)=>t.cafe_id===cafe && new Date(t.created_at).getTime() > cut).length
    return { data: count, error: null }
  }
  return { data: null, error: { message:`Unknown function ${fn}` } }
}

export const demoClient = {
  auth: demoAuth,
  from: (name:string)=>table(name),
  rpc: demoRpc
}

export function seedDemo(){
  const db = load()
  if (db.cafes.length===0){
    const cafe_id = crypto.randomUUID()
    db.cafes.push({ id: cafe_id, name: 'Mokado Espresso Bar', owner_id: 'owner-1', created_at: new Date().toISOString() })
    db.settings.push({ cafe_id, pin: '1234', points_per_purchase: 1, redeem_threshold: 5 })
    save(db)
  }
}
