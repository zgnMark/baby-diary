import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Home, PlusCircle, Camera, MessageCircle, Mic, Send, ChevronLeft, Droplets, Moon } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

const SUPABASE_URL = 'https://cyiuaertydcyeelguhor.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aXVhZXJ0eWRjeWVlbGd1aG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTIyNTksImV4cCI6MjA4OTI4ODI1OX0.aFim4dRREA11Vbw1IXDt_TGgK6YeHvrSTs7tZ22Mv2U'
const QWEN_KEY = 'sk-d86d1775696748bfb3bd01d5d6f4afd2'

const DEFAULT_BABY = {
  id: 'b28b33ff-f8bf-46f1-afac-e3ec8d250724',
  name: 'OK',
  birth_date: '2025-11-27',
  avatar_url: 'https://cdn.hailuoai.com/cdn_upload/20260317/483599064122089474/377493510574432/123036_4a92/workspace/user_input_files/0fc91d9d65183260ce751b47fafc600f.png'
}

const getSupabase = () => createClient(SUPABASE_URL, SUPABASE_KEY)
const calcDays = (b) => Math.floor((new Date() - new Date(b)) / 86400000)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN', {month:'short', day:'numeric'}) : ''

// 首页
function HomePage({ baby, photos, records, onAddClick }) {
  const days = calcDays(baby?.birth_date)
  const today = new Date().toDateString()
  const stats = {
    f: records.filter(r => r.type === 'feeding' && new Date(r.created_at).toDateString() === today).length,
    s: records.filter(r => r.type === 'sleep' && new Date(r.created_at).toDateString() === today).length,
    p: records.filter(r => r.type === 'poop' && new Date(r.created_at).toDateString() === today).length,
  }
  return (
    <div className="page home">
      <div className="header">
        <img src={baby?.avatar_url} alt="" className="avatar"/>
        <h2>{baby?.name}</h2>
        <p className="days">{days} days</p>
      </div>
      <div className="quick-btns">
        <button className="btn pink" onClick={() => onAddClick('photo')}><Camera size={18}/><span>Photo</span></button>
        <button className="btn orange" onClick={() => onAddClick('feeding')}><Droplets size={18}/><span>Feed</span></button>
        <button className="btn purple" onClick={() => onAddClick('sleep')}><Moon size={18}/><span>Sleep</span></button>
        <button className="btn yellow" onClick={() => onAddClick('poop')}><Droplets size={18}/><span>Poop</span></button>
      </div>
      <div className="stats">
        <div><span className="n">{stats.f}</span><span className="l">Feed</span></div>
        <div><span className="n">{stats.s}</span><span className="l">Sleep</span></div>
        <div><span className="n">{stats.p}</span><span className="l">Poop</span></div>
      </div>
      <div className="timeline">
        <h3>Timeline</h3>
        {photos.map((p,i) => (
          <div key={i} className="item">
            <div className="date">{fmtDate(p.created_at)}</div>
            <div className="card"><img src={p.image_url} alt=""/><p>{p.description}</p></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 记录页
function RecordPage({ records, photos, onAddClick }) {
  const [tab, setTab] = useState('daily')
  const daily = records.filter(r => ['feeding','sleep','poop'].includes(r.type))
  const growth = records.filter(r => r.type === 'growth').sort((a,b) => new Date(b.data?.date) - new Date(a.data?.date))
  const grouped = daily.reduce((g,r) => { const d = fmtDate(r.created_at); if(!g[d]) g[d]=[]; g[d].push(r); return g },{})
  const chart = [...growth].reverse().map(r => ({date:r.data?.date?.slice(5), h:parseFloat(r.data?.height)||0, w:parseFloat(r.data?.weight)||0})).filter(x=>x.h||x.w)

  return (
    <div className="page record">
      <div className="tabs">
        <button className={tab==='daily'?'active':''} onClick={()=>setTab('daily')}>Daily</button>
        <button className={tab==='growth'?'active':''} onClick={()=>setTab('growth')}>Growth</button>
        <button className={tab==='album'?'active':''} onClick={()=>setTab('album')}>Album</button>
      </div>
      {tab==='daily' && <div className="list">{Object.entries(grouped).map(([d,items]) => (
        <div key={d} className="group"><div className="date-h">{d}</div>{items.map((r,i) => (
          <div key={i} className="row"><div className={`icon ${r.type}`}><Droplets size={14}/></div>
          <div className="info"><b>{r.type}</b><span>{JSON.stringify(r.data)}</span></div></div>
        ))}</div>))}</div>}
      {tab==='growth' && <div className="growth"><div className="chart">{chart.length<2?<p className="empty">Need 2+ records</p>:<ResponsiveContainer height={180}><LineChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" fontSize={10}/><YAxis fontSize={10}/><Tooltip/><Line type="monotone" dataKey="h" stroke="#FF6B9D" name="Height"/><Line type="monotone" dataKey="w" stroke="#7CDE54" name="Weight"/></LineChart></ResponsiveContainer>}</div><button className="add-btn" onClick={()=>onAddClick('growth')}>+ Add Growth</button></div>}
      {tab==='album' && <div className="album"><button className="add-p" onClick={()=>onAddClick('photo')}><Camera size={24}/><span>Add</span></button>{photos.map((p,i)=><div key={i} className="p-item"><img src={p.image_url} alt=""/></div>)}</div>}
    </div>
  )
}

// AI助手
function AIChat({ baby, records, onClose, onSaveRecord }) {
  const [msgs, setMsgs] = useState([{ role: 'assistant', content: 'Hello! I am AI assistant. Say "baby drank 100ml formula" to record.' }])
  const [input, setInput] = useState('')
  const [recording, setRecording] = useState(false)

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if(!SR) { alert('No speech support'); return }
    setRecording(true)
    const rec = new SR()
    rec.lang = 'en-US'
    rec.onresult = (e) => { setInput(e.results[0][0].transcript) }
    rec.onend = () => setRecording(false)
    rec.start()
  }

  const handleSend = async () => {
    if(!input.trim()) return
    setMsgs(m => [...m, { role: 'user', content: input }])
    const txt = input.toLowerCase()
    let reply = 'Got it!'

    if(txt.includes('ml') || txt.includes('formula')) {
      const m = input.match(/(\d+)\s*ml/i)
      if(m) { await onSaveRecord({ type: 'feeding', data: { method: 'formula', amount: m[1] } }); reply = 'Recorded: ' + m[1] + 'ml formula' }
    } else if(txt.includes('breast') || txt.includes('milk')) {
      const m = input.match(/(\d+)\s*min/i)
      if(m) { await onSaveRecord({ type: 'feeding', data: { method: 'breast', duration: m[1] } }); reply = 'Recorded: ' + m[1] + ' min breastfeed' }
    } else if(txt.includes('sleep')) {
      await onSaveRecord({ type: 'sleep', data: { startTime: new Date().toISOString() } })
      reply = 'Recorded: sleep started'
    }

    setMsgs(m => [...m, { role: 'assistant', content: reply }])
    setInput('')
  }

  return (
    <div className="ai-page">
      <div className="ai-header">
        <button onClick={onClose}><ChevronLeft size={20}/></button>
        <span>AI Assistant</span>
        <span></span>
      </div>
      <div className="ai-msgs">{msgs.map((m,i) => <div key={i} className={`msg ${m.role}`}>{m.content}</div>)}</div>
      <div className="ai-input">
        <button className={recording?'rec':''} onClick={startRec}><Mic size={20}/></button>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleSend()}/>
        <button onClick={handleSend}><Send size={20}/></button>
      </div>
    </div>
  )
}

// 弹窗
function Modal({ type, babyId, onClose, onSave }) {
  const [f, setF] = useState({})
  const save = () => {
    if(type==='photo'){
      const file = document.getElementById('file').files[0]
      if(!file) return
      const r = new FileReader()
      r.onload = () => { onSave({baby_id:babyId, image_url:r.result, description:f.desc||'Record', created_by:'Family'}); onClose() }
      r.readAsDataURL(file)
    }else if(type==='growth'){
      onSave({baby_id:babyId, type:'growth', data:f, created_by:'Family'}); onClose()
    }else{
      onSave({baby_id:babyId, type:type, data:f, created_by:'Family'}); onClose()
    }
  }
  return (
    <div className="modal-mask" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>
      <h3>{type} Form</h3>
      {type==='photo' && <><input type="file" id="file" accept="image/*"/><input placeholder="Description" value={f.desc||''} onChange={e=>setF({...f,desc:e.target.value})}/></>}
      {type==='growth' && <><input type="date" value={f.date||''} onChange={e=>setF({...f,date:e.target.value})}/><input placeholder="Height cm" value={f.height||''} onChange={e=>setF({...f,height:e.target.value})}/><input placeholder="Weight kg" value={f.weight||''} onChange={e=>setF({...f,weight:e.target.value})}/></>}
      {type==='feeding' && <><select value={f.method||''} onChange={e=>setF({...f,method:e.target.value})}><option value="">Select</option><option value="breast">Breast</option><option value="formula">Formula</option></select><input placeholder="Amount/Duration" value={f.amount||''} onChange={e=>setF({...f,amount:e.target.value})}/></>}
      {type==='sleep' && <><input type="datetime-local" value={f.startTime||''} onChange={e=>setF({...f,startTime:e.target.value})}/></>}
      <div className="btns"><button onClick={onClose}>Cancel</button><button className="pri" onClick={save}>Save</button></div>
    </div></div>
  )
}

// 主应用
function App() {
  const [page, setPage] = useState('home')
  const [showAI, setShowAI] = useState(false)
  const [baby] = useState(DEFAULT_BABY)
  const [records, setRecords] = useState([])
  const [photos, setPhotos] = useState([])
  const [addType, setAddType] = useState(null)

  const load = async () => {
    try{
      const sb = getSupabase()
      const {data:r} = await sb.from('records').select('*').eq('baby_id', baby.id).order('created_at',{ascending:false})
      if(r) setRecords(r)
      const {data:p} = await sb.from('photos').select('*').eq('baby_id', baby.id).order('created_at',{ascending:false})
      if(p) setPhotos(p)
    }catch(e){}
  }
  useEffect(()=>{load()},[])

  const saveRecord = async (item) => {
    try{
      const sb = getSupabase()
      item.type ? await sb.from('records').insert([{baby_id:item.baby_id||baby.id, type:item.type, data:item.data, created_by:item.created_by||'Family'}]) : await sb.from('photos').insert([item])
      load()
    }catch(e){}
  }

  return (
    <div className="app">
      {!showAI && <main>
        {page==='home' && <HomePage baby={baby} photos={photos} records={records} onAddClick={setAddType}/>}
        {page==='record' && <RecordPage records={records} photos={photos} onAddClick={setAddType}/>}
      </main>}
      {showAI && <AIChat baby={baby} records={records} onClose={()=>setShowAI(false)} onSaveRecord={saveRecord}/>}
      
      {!showAI && <nav>
        <button className={page==='home'?'active':''} onClick={()=>setPage('home')}><Home size={20}/><span>Home</span></button>
        <button className={page==='record'?'active':''} onClick={()=>setPage('record')}><PlusCircle size={20}/><span>Record</span></button>
        <button onClick={()=>setShowAI(true)}><MessageCircle size={20}/><span>AI</span></button>
      </nav>}
      
      {addType && <Modal type={addType} babyId={baby.id} onClose={()=>setAddType(null)} onSave={saveRecord}/>}
    </div>
  )
}
export default App
