import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = 'http://localhost:3100/api'

function Login({ onLogin }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.post(`${API}/auth/login`, { username, password })
      onLogin(data)
    } catch (err) {
      setError(err?.response?.data?.error || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{display:'grid',placeItems:'center',minHeight:'100vh',padding:24}}>
      <form onSubmit={submit} style={{width:'100%',maxWidth:380,background:'#111827',padding:24,borderRadius:16,border:'1px solid #1f2937'}}>
        <h1 style={{marginTop:0}}>DENTANET Help Desk</h1>
        <p style={{opacity:.8}}>Login CS staff</p>
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" style={inputStyle} />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={inputStyle} />
        {error && <div style={{color:'#fca5a5',marginBottom:12}}>{error}</div>}
        <button disabled={loading} style={buttonStyle}>{loading ? 'Masuk...' : 'Masuk'}</button>
      </form>
    </div>
  )
}

export default function App() {
  const [auth, setAuth] = useState(null)
  const [customers, setCustomers] = useState([])
  const [activeCustomer, setActiveCustomer] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')

  const socket = useMemo(() => io('http://localhost:3100', { autoConnect: !!auth }), [auth])

  useEffect(() => {
    if (!auth) return
    loadCustomers(auth.token)
  }, [auth])

  useEffect(() => {
    if (!auth) return
    socket.connect()
    socket.on('message:new', (msg) => {
      setCustomers(prev => [...prev])
      if (activeCustomer && msg.customer_id === activeCustomer.id) {
        setMessages(prev => [...prev, msg])
      }
    })
    return () => socket.disconnect()
  }, [auth, activeCustomer])

  const loadCustomers = async (token) => {
    const { data } = await axios.get(`${API}/chat/customers`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setCustomers(data.customers || [])
  }

  const openCustomer = async (customer) => {
    setActiveCustomer(customer)
    const { data } = await axios.get(`${API}/chat/customers/${customer.id}/messages`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    setMessages(data.messages || [])
  }

  const sendMessage = async () => {
    if (!text.trim() || !activeCustomer) return
    const payload = { customerId: activeCustomer.id, message: text }
    const { data } = await axios.post(`${API}/chat/send`, payload, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    if (data?.message) setMessages(prev => [...prev, data.message])
    setText('')
  }

  if (!auth) return <Login onLogin={setAuth} />

  return (
    <div style={{display:'grid',gridTemplateColumns:'340px 1fr',height:'100vh'}}>
      <aside style={{borderRight:'1px solid #1f2937',padding:16,overflow:'auto',background:'#0b1220'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <div style={{fontWeight:700}}>Inbox</div>
            <div style={{opacity:.7,fontSize:13}}>{auth.staff.displayName}</div>
          </div>
        </div>
        {customers.map(c => (
          <button key={c.id} onClick={() => openCustomer(c)} style={{display:'block',width:'100%',textAlign:'left',padding:12,marginBottom:8,borderRadius:12,border:'1px solid #1f2937',background:activeCustomer?.id===c.id?'#1d4ed8':'#111827',color:'#fff'}}>
            <div style={{fontWeight:600}}>{c.name || c.wa_id}</div>
            <div style={{opacity:.7,fontSize:12,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.last_message || 'Belum ada pesan'}</div>
          </button>
        ))}
      </aside>
      <main style={{display:'grid',gridTemplateRows:'1fr auto',background:'#0f172a'}}>
        <div style={{padding:16,overflow:'auto'}}>
          {!activeCustomer && <div style={{opacity:.7}}>Pilih customer di kiri untuk buka chat.</div>}
          {activeCustomer && (
            <>
              <div style={{marginBottom:16,fontWeight:700}}>{activeCustomer.name || activeCustomer.wa_id}</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {messages.map(m => (
                  <div key={m.id} style={{alignSelf:m.direction==='outbound'?'flex-end':'flex-start',maxWidth:'75%',background:m.direction==='outbound'?'#1d4ed8':'#111827',padding:'10px 12px',borderRadius:14}}>
                    <div>{m.content}</div>
                    <div style={{fontSize:11,opacity:.7,marginTop:6}}>{m.staff_display_name || (m.direction==='inbound' ? 'Pelanggan' : 'CS')}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{padding:16,borderTop:'1px solid #1f2937',display:'flex',gap:12}}>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Tulis balasan..." style={{flex:1,minHeight:60,maxHeight:120,padding:12,borderRadius:12,border:'1px solid #334155',background:'#111827',color:'#fff'}} />
          <button onClick={sendMessage} style={{...buttonStyle,width:120}}>Kirim</button>
        </div>
      </main>
    </div>
  )
}

const inputStyle = {
  width:'100%', padding:'12px 14px', marginBottom:12, borderRadius:12, border:'1px solid #374151', background:'#0f172a', color:'#fff'
}
const buttonStyle = {
  width:'100%', padding:'12px 14px', borderRadius:12, border:'none', background:'#2563eb', color:'#fff', cursor:'pointer'
}
