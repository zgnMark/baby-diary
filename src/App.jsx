import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Home, PlusCircle, Camera, MessageCircle, Droplets, Moon, Play, Pause, RotateCcw, X, Share2, Package } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

const SUPABASE_URL = 'https://cyiuaertydcyeelguhor.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aXVhZXJ0eWRjeWVlbGd1aG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTIyNTksImV4cCI6MjA4OTI4ODI1OX0.aFim4dRREA11Vbw1IXDt_TGgK6YeHvrSTs7tZ22Mv2U'

const DEFAULT_BABY = {
  id: 'b28b33ff-f8bf-46f1-afac-e3ec8d250724',
  name: 'OK',
  birth_date: '2025-11-27',
  avatar_url: 'https://cdn.hailuoai.com/cdn_upload/20260317/483599064122089474/377493510574432/123036_4a92/workspace/user_input_files/0fc91d9d65183260ce751b47fafc600f.png'
}

const getSupabase = () => createClient(SUPABASE_URL, SUPABASE_KEY)
const calcDays = (b) => Math.floor((new Date() - new Date(b)) / 86400000)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN', {month:'short', day:'numeric'}) : ''
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'}) : ''
const fmtDur = (s) => `${Math.floor(s/60)}分${s%60}秒`

function useTimer(initial) {
  const [sec, setSec] = useState(initial || 0)
  const [running, setRunning] = useState(false)
  const iv = useRef(null)
  const start = () => { setRunning(true); iv.current = setInterval(()=>setSec(s=>s+1), 1000) }
  const pause = () => { setRunning(false); clearInterval(iv.current) }
  const reset = () => { setRunning(false); clearInterval(iv.current); setSec(0) }
  useEffect(()=>()=>clearInterval(iv.current),[])
  return { sec, running, start, pause, reset }
}

// ========== AI助手（全屏） ==========
function AIChat({ onClose, onSaveRecord }) {
  const [msgs, setMsgs] = useState([{ role: 'assistant', content: '你好！我是AI助手，说"宝宝吃了100ml奶粉"即可记录' }])
  const [input, setInput] = useState('')
  const boxRef = useRef(null)

  const handleSend = async () => {
    if(!input.trim()) return
    setMsgs(m => [...m, { role: 'user', content: input }])
    const txt = input
    let reply = '收到！'
    let saved = false

    if(txt.includes('奶粉') || txt.match(/\d+\s*ml/i)) {
      const m = txt.match(/(\d+)\s*ml/i)
      if(m) { await onSaveRecord({ type:'feeding', data:{ method:'奶粉', amount:parseInt(m[1]) } }); reply = '已记录：' + m[1] + 'ml奶粉'; saved=true }
    } else if(txt.includes('母乳') || txt.includes('吃奶')) {
      const min = txt.match(/(\d+)\s*分钟/i)
      if(min) { await onSaveRecord({ type:'feeding', data:{ method:'母乳', duration:parseInt(min[1])*60 } }); reply = '已记录：' + min[1] + '分钟母乳'; saved=true }
      else reply = '可以说"母乳20分钟"来记录'
    } else if(txt.includes('睡觉') || txt.includes('睡眠')) {
      await onSaveRecord({ type:'sleep', data:{ startTime:new Date().toISOString(), note:'AI记录' } })
      reply = '已记录：睡眠开始'; saved=true
    } else if(txt.includes('小便')) {
      await onSaveRecord({ type:'poop', data:{ poopType:'小便' } })
      reply = '已记录：小便'; saved=true
    } else if(txt.includes('大便') || txt.includes('排便')) {
      await onSaveRecord({ type:'poop', data:{ poopType:'大便' } })
      reply = '已记录：大便'; saved=true
    } else {
      reply = '可以说："宝宝吃了100ml奶粉"、"母乳15分钟"、"记录睡眠"'
    }

    setMsgs(m => [...m, { role: 'assistant', content: reply }])
    setInput('')
    setTimeout(()=>boxRef.current?.scrollTo(0,9999), 100)
  }

  return (
    <div className="ai-page">
      <div className="ai-header"><button onClick={onClose}><X size={20}/></button><span>🤖 AI助手</span><span></span></div>
      <div className="ai-msgs" ref={boxRef}>{msgs.map((m,i) => <div key={i} className={'msg '+m.role}>{m.content}</div>)}</div>
      <div className="ai-input">
        <div className="mic-icon">🎤</div>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleSend()} placeholder="输入消息让AI帮你记录..."/>
        <button onClick={handleSend}><Droplets size={18}/></button>
      </div>
    </div>
  )
}

// ========== 母乳弹窗（计时器） ==========
function FeedingModal({ onClose, onSave }) {
  const [mode, setMode] = useState('timer')
  const left = useTimer(0)
  const right = useTimer(0)
  const [side, setSide] = useState('left')
  const [manualL, setManualL] = useState('')
  const [manualR, setManualR] = useState('')
  const total = left.sec + right.sec

  const save = () => {
    if(mode==='timer' && total<10) return
    const dur = mode==='timer' ? total : ((parseInt(manualL||0) + parseInt(manualR||0)) * 60)
    if(dur < 10) return
    onSave({ type:'feeding', data:{ method:'母乳', left:mode==='timer'?left.sec:parseInt(manualL||0)*60, right:mode==='timer'?right.sec:parseInt(manualR||0)*60, total:dur }})
    onClose()
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/><h3>🍼 母乳喂养</h3>
        <div className="mode-toggle">
          <button className={mode==='timer'?'active':''} onClick={()=>setMode('timer')}>计时</button>
          <button className={mode==='manual'?'active':''} onClick={()=>setMode('manual')}>手动</button>
        </div>

        {mode==='timer' ? (
          <>
            <p className="tip">💡 点击卡片选择吸乳侧，再按开始</p>
            <div className="breast-row">
              <div className={`breast-card ${side==='left'?'active':''}`} onClick={()=>setSide('left')}>
                <span className="breast-label">左侧</span>
                <span className="timer-display">{fmtDur(left.sec)}</span>
                {side==='left' && (
                  <div className="timer-btns">
                    {!left.running
                      ? <button className="play-btn" onClick={e=>{e.stopPropagation();left.start()}}><Play size={16}/></button>
                      : <button className="pause-btn" onClick={e=>{e.stopPropagation();left.pause()}}><Pause size={16}/></button>}
                    <button className="rst-btn" onClick={e=>{e.stopPropagation();left.reset()}}><RotateCcw size={14}/></button>
                  </div>
                )}
              </div>
              <div className={`breast-card ${side==='right'?'active':''}`} onClick={()=>setSide('right')}>
                <span className="breast-label">右侧</span>
                <span className="timer-display">{fmtDur(right.sec)}</span>
                {side==='right' && (
                  <div className="timer-btns">
                    {!right.running
                      ? <button className="play-btn" onClick={e=>{e.stopPropagation();right.start()}}><Play size={16}/></button>
                      : <button className="pause-btn" onClick={e=>{e.stopPropagation();right.pause()}}><Pause size={16}/></button>}
                    <button className="rst-btn" onClick={e=>{e.stopPropagation();right.reset()}}><RotateCcw size={14}/></button>
                  </div>
                )}
              </div>
            </div>
            <div className="total-row">合计：<strong>{fmtDur(total)}</strong></div>
          </>
        ) : (
          <div className="manual-page">
            <div className="manual-row"><span>左侧（分）</span><input type="number" value={manualL} onChange={e=>setManualL(e.target.value)} placeholder="0"/></div>
            <div className="manual-row"><span>右侧（分）</span><input type="number" value={manualR} onChange={e=>setManualR(e.target.value)} placeholder="0"/></div>
          </div>
        )}

        <div className="sheet-btns"><button className="cancel-btn" onClick={onClose}>取消</button><button className="save-btn" onClick={save} disabled={mode==='timer'?total<10:true}>保存</button></div>
      </div>
    </div>
  )
}

// ========== 睡眠弹窗 ==========
function SleepModal({ onClose, onSave }) {
  const [mode, setMode] = useState('timer')
  const timer = useTimer(0)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const save = () => {
    if(mode==='timer') {
      if(timer.sec < 60) return
      onSave({ type:'sleep', data:{ startTime:new Date().toISOString(), duration:timer.sec }})
    } else {
      if(!startTime || !endTime) return
      const dur = Math.floor((new Date(endTime)-new Date(startTime))/1000)
      if(dur < 60) return
      onSave({ type:'sleep', data:{ startTime, endTime, duration:dur }})
    }
    onClose()
  }

  const manualDur = startTime && endTime ? Math.floor((new Date(endTime)-new Date(startTime))/1000) : 0

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/><h3>😴 睡眠记录</h3>
        <div className="mode-toggle">
          <button className={mode==='timer'?'active':''} onClick={()=>setMode('timer')}>计时</button>
          <button className={mode==='manual'?'active':''} onClick={()=>setMode('manual')}>手动</button>
        </div>

        {mode==='timer' ? (
          <div className="sleep-timer">
            <div className="big-timer">{fmtDur(timer.sec)}</div>
            <div className="timer-btns center">
              {!timer.running ? <button className="play-btn big" onClick={timer.start}><Play size={24}/></button>
              : <button className="pause-btn big" onClick={timer.pause}><Pause size={24}/></button>}
              <button className="rst-btn" onClick={timer.reset}><RotateCcw size={18}/></button>
            </div>
          </div>
        ) : (
          <div className="manual-page">
            <div className="manual-row"><span>开始</span><input type="datetime-local" value={startTime} onChange={e=>setStartTime(e.target.value)}/></div>
            <div className="manual-row"><span>结束</span><input type="datetime-local" value={endTime} onChange={e=>setEndTime(e.target.value)}/></div>
            {manualDur>0 && <div className="total-row">时长：<strong>{fmtDur(manualDur)}</strong></div>}
          </div>
        )}

        <div className="sheet-btns"><button className="cancel-btn" onClick={onClose}>取消</button><button className="save-btn" onClick={save} disabled={mode==='timer'?timer.sec<60:manualDur<60}>保存</button></div>
      </div>
    </div>
  )
}

// ========== 排便弹窗 ==========
function PoopModal({ onClose, onSave }) {
  const [type, setType] = useState('pee')
  const [poopType, setPoopType] = useState('')
  const [note, setNote] = useState('')

  const save = () => {
    onSave({ type:'poop', data:{ poopType: type==='pee'?'小便':'大便', detail:poopType, note }})
    onClose()
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/><h3>💩 排便记录</h3>
        <div className="poop-types">
          <button className={type==='pee'?'active':''} onClick={()=>setType('pee')}>💧 小便</button>
          <button className={type==='poop'?'active':''} onClick={()=>setType('poop')}>💩 大便</button>
        </div>
        {type==='poop' && (
          <div className="poop-chips">
            {['正常','稀便','便秘','绿色','泡沫','奶瓣'].map(t=><button key={t} className={poopType===t?'active':''} onClick={()=>setPoopType(t)}>{t}</button>)}
          </div>
        )}
        <div className="note-row"><span>备注</span><input placeholder="可选" value={note} onChange={e=>setNote(e.target.value)}/></div>
        <div className="sheet-btns"><button className="cancel-btn" onClick={onClose}>取消</button><button className="save-btn" onClick={save}>保存</button></div>
      </div>
    </div>
  )
}

// ========== 奶粉弹窗 ==========
function FormulaModal({ onClose, onSave }) {
  const [amount, setAmount] = useState('')
  const save = () => {
    if(!amount) return
    onSave({ type:'feeding', data:{ method:'奶粉', amount:parseInt(amount) }})
    onClose()
  }
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/><h3>🍼 奶粉喂养</h3>
        <div className="amount-input">
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/>
          <span>ml</span>
        </div>
        <div className="amount-chips">
          {[30,60,90,120,150,180].map(v=><button key={v} className={amount==String(v)?'active':''} onClick={()=>setAmount(String(v))}>{v}ml</button>)}
        </div>
        <div className="sheet-btns"><button className="cancel-btn" onClick={onClose}>取消</button><button className="save-btn" onClick={save} disabled={!amount}>保存</button></div>
      </div>
    </div>
  )
}

// ========== 生长弹窗 ==========
function GrowthModal({ onClose, onSave }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const save = () => {
    if(!height && !weight) return
    onSave({ type:'growth', data:{ date, height:parseFloat(height)||null, weight:parseFloat(weight)||null }})
    onClose()
  }
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/><h3>📏 生长记录</h3>
        <div className="manual-page">
          <div className="manual-row"><span>日期</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
          <div className="manual-row"><span>身高cm</span><input type="number" value={height} onChange={e=>setHeight(e.target.value)} placeholder="可选"/></div>
          <div className="manual-row"><span>体重kg</span><input type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="可选" step="0.1"/></div>
        </div>
        <div className="sheet-btns"><button className="cancel-btn" onClick={onClose}>取消</button><button className="save-btn" onClick={save} disabled={!height&&!weight}>保存</button></div>
      </div>
    </div>
  )
}

// ========== 照片弹窗 ==========
function PhotoModal({ babyId, onClose, onSave }) {
  const [desc, setDesc] = useState('')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)
  const onFile = (e) => {
    const file = e.target.files[0]
    if(!file) return
    const r = new FileReader()
    r.onload = () => setPreview(r.result)
    r.readAsDataURL(file)
  }
  const save = () => {
    if(!preview) return
    onSave({ baby_id:babyId, image_url:preview, description:desc||'成长记录', created_by:'家人' })
    onClose()
  }
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/><h3>📷 照片</h3>
        <div className="photo-preview" onClick={()=>fileRef.current.click()}>
          {preview ? <img src={preview} alt=""/> : <div className="photo-placeholder"><Camera size={36}/><span>点击上传</span></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFile}/>
        <input placeholder="描述（可选）" value={desc} onChange={e=>setDesc(e.target.value)}/>
        <div className="sheet-btns"><button className="cancel-btn" onClick={onClose}>取消</button><button className="save-btn" onClick={save} disabled={!preview}>保存</button></div>
      </div>
    </div>
  )
}

// ========== 分享卡片（Canvas生成） ==========
function ShareCard({ baby, records, onClose }) {
  const canvasRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  const drawCard = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 390, H = 580
    canvas.width = W; canvas.height = H

    // 渐变背景
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#FF6B9D')
    grad.addColorStop(1, '#9B7FD9')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 顶部标题
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.beginPath()
    ctx.roundRect(20, 20, W-40, 44, 14)
    ctx.fill()
    ctx.fillStyle = '#FF6B9D'
    ctx.font = 'bold 18px "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('👶 宝宝成长日记', W/2, 50)

    // 宝宝信息卡片
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.beginPath()
    ctx.roundRect(20, 80, W-40, 120, 16)
    ctx.fill()

    // 头像圆
    ctx.save()
    ctx.beginPath()
    ctx.arc(80, 140, 36, 0, Math.PI*2)
    ctx.clip()
    const avatarImg = new Image()
    avatarImg.crossOrigin = 'anonymous'
    avatarImg.onload = () => ctx.drawImage(avatarImg, 44, 104, 72, 72)
    avatarImg.src = baby?.avatar_url || ''
    ctx.restore()

    ctx.fillStyle = '#333'
    ctx.font = 'bold 20px "Noto Sans SC", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(baby?.name || '宝宝', 130, 130)
    ctx.fillStyle = '#888'
    ctx.font = '13px "Noto Sans SC", sans-serif'
    ctx.fillText('出生: ' + (baby?.birth_date || ''), 130, 152)
    ctx.fillText('成长: ' + calcDays(baby?.birth_date) + '天', 130, 172)

    // 今日数据
    const today = new Date().toDateString()
    const fCount = records.filter(r => r.type==='feeding' && new Date(r.created_at).toDateString()===today).length
    const sCount = records.filter(r => r.type==='sleep' && new Date(r.created_at).toDateString()===today).length
    const pCount = records.filter(r => r.type==='poop' && new Date(r.created_at).toDateString()===today).length

    const boxY = 218
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.beginPath()
    ctx.roundRect(20, boxY, W-40, 90, 14)
    ctx.fill()
    ctx.fillStyle = '#555'
    ctx.font = 'bold 14px "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('今日记录', W/2, boxY+28)

    const items = [{n:fCount,l:'喂养'},{n:sCount,l:'睡眠'},{n:pCount,l:'排便'}]
    const bw = (W-80)/3
    items.forEach((it,i) => {
      const bx = 30 + i*(bw+10)
      ctx.fillStyle = '#FFF0F5'
      ctx.beginPath()
      ctx.roundRect(bx, boxY+38, bw, 42, 10)
      ctx.fill()
      ctx.fillStyle = '#FF6B9D'
      ctx.font = 'bold 22px "Noto Sans SC", sans-serif'
      ctx.fillText(it.n, bx+bw/2, boxY+62)
      ctx.fillStyle = '#888'
      ctx.font = '11px "Noto Sans SC", sans-serif'
      ctx.fillText(it.l, bx+bw/2, boxY+78)
    })

    // 成长进度
    const growth = records.filter(r=>r.type==='growth').sort((a,b)=>new Date(b.data?.date)-new Date(a.data?.date))
    if(growth.length>0) {
      const gy = boxY+124
      ctx.fillStyle = 'rgba(255,255,255,0.95)'
      ctx.beginPath()
      ctx.roundRect(20, gy, W-40, 60, 14)
      ctx.fill()
      ctx.fillStyle = '#555'
      ctx.font = 'bold 13px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('最新生长数据', 36, gy+24)
      ctx.fillStyle = '#FF6B9D'
      ctx.font = 'bold 15px "Noto Sans SC", sans-serif'
      ctx.fillText('身高 ' + (growth[0]?.data?.height||'-') + 'cm', 36, gy+46)
      ctx.fillStyle = '#7CDE54'
      ctx.fillText('体重 ' + (growth[0]?.data?.weight||'-') + 'kg', 140, gy+46)
      ctx.fillStyle = '#888'
      ctx.font = '11px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(growth[0]?.data?.date||'', W-36, gy+46)
    }

    // 底部水印
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.roundRect(20, H-80, W-40, 54, 14)
    ctx.fill()
    ctx.fillStyle = '#FF6B9D'
    ctx.font = 'bold 13px "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('用宝宝成长日记记录每一个珍贵时刻 💕', W/2, H-52)
    ctx.fillStyle = '#aaa'
    ctx.font = '10px "Noto Sans SC", sans-serif'
    ctx.fillText('space.minimaxi.com/baby-diary', W/2, H-32)
  }

  useEffect(()=>{ drawCard() }, [baby, records])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setDownloading(true)
    const link = document.createElement('a')
    link.download = '宝宝成长日记.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    setTimeout(()=>setDownloading(false), 1000)
  }

  const handleShare = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setDownloading(true)
    try {
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))
      const file = new File([blob], '宝宝成长日记.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: '宝宝成长日记', text: `宝宝出生第${calcDays(baby?.birth_date)}天啦！` })
      } else {
        await navigator.share({ title: '宝宝成长日记', text: `今天是宝宝出生的第${calcDays(baby?.birth_date)}天！${baby?.name}的成长记录：` + window.location.href })
      }
    } catch(e) {
      if (e.name !== 'AbortError') {
        const link = document.createElement('a')
        link.download = '宝宝成长日记.png'
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    }
    setDownloading(false)
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <h3>📤 分享今日动态</h3>
        <div className="share-preview">
          <canvas ref={canvasRef} style={{width:'100%',borderRadius:'12px',boxShadow:'0 4px 20px rgba(0,0,0,.15)'}}/>
        </div>
        <p className="share-tip">长按图片保存，或直接分享到社交平台</p>
        <div className="share-btns">
          <button className="cancel-btn" onClick={onClose}>关闭</button>
          <button className="share-btn" onClick={handleShare} disabled={downloading}>📤 分享</button>
          <button className="save-btn" onClick={handleDownload} disabled={downloading}>💾 下载</button>
        </div>
      </div>
    </div>
  )
}

// 初始价格数据（由cron任务每次更新，2026-03-18实时数据）
const INITIAL_PRICES = [
  // 好价商品（单片 < 1元）⭐
  { name: '好奇铂金装小桃裤M144片', brand: '好奇', price: 91.54, pieces: 144, jdUrl: 'https://search.jd.com/Search?keyword=好奇铂金装M144片纸尿裤' },
  { name: '帮宝适绿帮M62片', brand: '帮宝适', price: 45, pieces: 62, jdUrl: 'https://search.jd.com/Search?keyword=帮宝适绿帮M62片纸尿裤' },
  // 普通价格
  { name: '帮宝适一级帮M42片', brand: '帮宝适', price: 75.9, pieces: 42, jdUrl: 'https://search.jd.com/Search?keyword=帮宝适一级帮M42片纸尿裤' },
  { name: '帮宝适一级帮M62片', brand: '帮宝适', price: 99, pieces: 62, jdUrl: 'https://search.jd.com/Search?keyword=帮宝适一级帮M62片纸尿裤' },
  { name: '帮宝适清新帮M96片', brand: '帮宝适', price: 109, pieces: 96, jdUrl: 'https://search.jd.com/Search?keyword=帮宝适清新帮M96片纸尿裤' },
  { name: '好奇铂金装小桃裤M92片', brand: '好奇', price: 88, pieces: 92, jdUrl: 'https://search.jd.com/Search?keyword=好奇铂金装M92片纸尿裤' },
  { name: '好奇铂金装小桃裤M72片', brand: '好奇', price: 79, pieces: 72, jdUrl: 'https://search.jd.com/Search?keyword=好奇铂金装M72片纸尿裤' },
  { name: '好奇金装纸尿裤M162片', brand: '好奇', price: 109, pieces: 162, jdUrl: 'https://search.jd.com/Search?keyword=好奇金装M162片纸尿裤' },
  { name: 'babycare花苞裤M68片', brand: 'babycare', price: 139, pieces: 68, jdUrl: 'https://search.jd.com/Search?keyword=babycare花苞裤M68片' },
  { name: 'babycare AIR PRO M64片', brand: 'babycare', price: 109, pieces: 64, jdUrl: 'https://search.jd.com/Search?keyword=BabycareAIRPROM64片纸尿裤' },
  { name: 'bebebus金标安睡M58片', brand: 'bebebus', price: 149, pieces: 58, jdUrl: 'https://search.jd.com/Search?keyword=bebebus金标M58片纸尿裤' },
  { name: 'bebebus超裤M8片×2包', brand: 'bebebus', price: 49, pieces: 16, jdUrl: 'https://search.jd.com/Search?keyword=bebebus超裤M16片' },
  { name: '花王妙而舒M58片', brand: '花王', price: 95, pieces: 58, jdUrl: 'https://search.jd.com/Search?keyword=花王妙而舒M58片纸尿裤' },
  { name: '尤妮佳极上M54片', brand: '尤妮佳', price: 89, pieces: 54, jdUrl: 'https://search.jd.com/Search?keyword=尤妮佳极上M54片纸尿裤' },
  { name: '大王光羽M56片', brand: '大王', price: 169, pieces: 56, jdUrl: 'https://search.jd.com/Search?keyword=大王光羽M56片纸尿裤' },
]

// ========== 纸尿裤Tab页 ==========
function PricePage() {
  const THRESHOLD = 1.0
  const prices = INITIAL_PRICES.map(p => ({
    ...p,
    pricePerPiece: Math.round(p.price / p.pieces * 100) / 100
  }))
  const goodDeals = prices.filter(p => p.pricePerPiece < THRESHOLD)
  const updatedAt = new Date().toLocaleString('zh-CN')

  const brandColor = (b) => {
    if (b === '好奇') return '#FF6B9D'
    if (b === '帮宝适') return '#9B7FD9'
    if (b === 'babycare') return '#FF9F43'
    if (b === 'bebebus') return '#7CDE54'
    return '#888'
  }

  return (
    <div className="page price-page">
      <div className="price-header">
        <div className="ph-title">🧷 纸尿裤好价</div>
        <div className="ph-sub">阈值：单片 &lt; ¥{THRESHOLD} ｜ 更新：{updatedAt}</div>
        {goodDeals.length > 0 && (
          <div className="ph-alert">🎉 当前有 <strong>{goodDeals.length}</strong> 款好价！</div>
        )}
      </div>

      {goodDeals.length > 0 && (
        <div className="good-deals-section">
          <div className="section-title">🎉 好价推荐（单片&lt;¥1）</div>
          <div className="good-deals-grid">
            {goodDeals.map((p, i) => (
              <a key={i} href={p.jdUrl} target="_blank" rel="noopener noreferrer" className="good-deal-card">
                <div className="gdc-brand" style={{background: brandColor(p.brand)}}>{p.brand}</div>
                <div className="gdc-name">{p.name}</div>
                <div className="gdc-price">¥{p.price}</div>
                <div className="gdc-ppc">≈¥{p.pricePerPiece}/片</div>
                <div className="gdc-btn">去购买 ›</div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="price-list">
        <div className="section-title">📊 全部报价</div>
        {['帮宝适','好奇','babycare','bebebus','花王','尤妮佳','大王'].map(brand => {
          const items = prices.filter(p => p.brand === brand)
          if (items.length === 0) return null
          return (
            <div key={brand} className="brand-section">
              <div className="brand-name" style={{borderLeft:'3px solid '+brandColor(brand)}}>{brand}</div>
              {items.map((p, i) => (
                <a key={i} href={p.jdUrl} target="_blank" rel="noopener noreferrer" className={`price-row ${p.pricePerPiece < THRESHOLD ? 'is-good' : ''}`}>
                  <div className="pr-info">
                    <b>{p.name}</b>
                    <span>{p.pieces}片装</span>
                  </div>
                  <div className="pr-prices">
                    <span className="pr-total">¥{p.price}</span>
                    <span className={`pr-ppc ${p.pricePerPiece < THRESHOLD ? 'good' : ''}`}>¥{p.pricePerPiece}/片</span>
                  </div>
                  <div className="pr-arrow">›</div>
                </a>
              ))}
            </div>
          )
        })}
      </div>

      <div className="price-tip">💡 价格由AI定时监控，有好价时自动推送通知到邮箱</div>
    </div>
  )
}

// ========== 首页 ==========
function HomePage({ baby, photos, records, onAddClick }) {
  const days = calcDays(baby?.birth_date)
  const today = new Date().toDateString()
  const stats = {
    f: records.filter(r => r.type==='feeding' && new Date(r.created_at).toDateString()===today).length,
    s: records.filter(r => r.type==='sleep' && new Date(r.created_at).toDateString()===today).length,
    p: records.filter(r => r.type==='poop' && new Date(r.created_at).toDateString()===today).length,
  }
  return (
    <div className="page home">
      <div className="header">
        <img src={baby?.avatar_url} alt="" className="avatar"/>
        <h2>{baby?.name}</h2>
        <p className="days">{days}天</p>
      </div>

      <div className="ai-banner" onClick={()=>onAddClick('ai')}>
        <span className="ai-icon">🤖</span>
        <span className="ai-text">AI助手 — 说句话就能记录</span>
        <span className="ai-arrow">›</span>
      </div>

      <div className="quick-btns">
        <button className="btn pink" onClick={()=>onAddClick('photo')}><Camera size={18}/><span>拍照</span></button>
        <button className="btn orange" onClick={()=>onAddClick('formula')}><Droplets size={18}/><span>奶粉</span></button>
        <button className="btn purple" onClick={()=>onAddClick('sleep')}><Moon size={18}/><span>睡眠</span></button>
        <button className="btn yellow" onClick={()=>onAddClick('share')}><Share2 size={18}/><span>分享</span></button>
      </div>
      <div className="stats">
        <div><span className="n">{stats.f}</span><span className="l">喂养</span></div>
        <div><span className="n">{stats.s}</span><span className="l">睡眠</span></div>
        <div><span className="n">{stats.p}</span><span className="l">排便</span></div>
      </div>
      <div className="timeline">
        <h3>成长动态</h3>
        {photos.length===0 && <p className="empty">暂无照片，点击拍照添加</p>}
        {photos.slice(0,5).map((p,i)=>(
          <div key={i} className="item">
            <div className="date">{fmtDate(p.created_at)}<br/><small>{fmtTime(p.created_at)}</small></div>
            <div className="card"><img src={p.image_url} alt=""/><p>{p.description}</p></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ========== 记录页 ==========
function RecordPage({ records, photos, onAddClick }) {
  const [tab, setTab] = useState('daily')
  const daily = records.filter(r=>['feeding','sleep','poop'].includes(r.type))
  const growth = records.filter(r=>r.type==='growth').sort((a,b)=>new Date(b.data?.date)-new Date(a.data?.date))
  const grouped = daily.reduce((g,r)=>{ const d=fmtDate(r.created_at); if(!g[d]) g[d]=[]; g[d].push(r); return g },{})

  const todayRecords = records.filter(r=>new Date(r.created_at).toDateString()===new Date().toDateString())
  const sleepToday = todayRecords.filter(r=>r.type==='sleep')
  const feedingToday = todayRecords.filter(r=>r.type==='feeding')
  const sleepDur = sleepToday.reduce((s,r)=>s+(r.data?.duration||0),0)
  const feedDur = feedingToday.reduce((s,r)=>s+((r.data?.left||0)+(r.data?.right||0)),0)

  const renderItem = (r) => {
    if(r.type==='feeding') {
      if(r.data?.method==='母乳') {
        const l=r.data?.left||0, rr=r.data?.right||0
        return (l>0?'左'+Math.floor(l/60)+'分'+l%60+'秒 ':'')+(rr>0?'右'+Math.floor(rr/60)+'分'+rr%60+'秒':'') || '母乳'
      }
      return r.data?.amount+'ml'
    }
    if(r.type==='sleep') { const d=r.data?.duration||0; return d>0?'睡眠'+Math.floor(d/60)+'小时'+d%60+'分':'睡眠' }
    if(r.type==='poop') return r.data?.poopType==='小便'?'小便':'大便'
    return ''
  }

  const getColor = (t) => t==='feeding'?'pink':t==='sleep'?'purple':'yellow'
  const getIcon = (t) => t==='feeding'?'🍼':t==='sleep'?'😴':'💩'

  return (
    <div className="page record">
      <div className="tabs">
        <button className={tab==='daily'?'active':''} onClick={()=>setTab('daily')}>日常</button>
        <button className={tab==='growth'?'active':''} onClick={()=>setTab('growth')}>生长</button>
        <button className={tab==='album'?'active':''} onClick={()=>setTab('album')}>相册</button>
      </div>

      {tab==='daily' && (
        <div className="daily-tab">
          <div className="day-summary">
            <div className="ds-item"><span className="ds-num">{feedingToday.length}</span><span>喂养</span></div>
            <div className="ds-item"><span className="ds-num">{Math.floor(feedDur/60)}</span><span>母乳分</span></div>
            <div className="ds-item"><span className="ds-num">{sleepToday.length}</span><span>睡眠</span></div>
            <div className="ds-item"><span className="ds-num">{Math.floor(sleepDur/3600)}</span><span>睡眠时</span></div>
          </div>

          {/* 快捷入口 */}
          <div className="quick-adds">
            <button onClick={()=>onAddClick('breast')} className="qa-btn">🍼 母乳计时</button>
            <button onClick={()=>onAddClick('formula')} className="qa-btn">🍼 奶粉</button>
            <button onClick={()=>onAddClick('sleep')} className="qa-btn">😴 睡眠</button>
            <button onClick={()=>onAddClick('poop')} className="qa-btn">💩 排便</button>
          </div>

          <div className="list">
            {Object.entries(grouped).map(([d,items])=>(
              <div key={d} className="group">
                <div className="date-h">{d}</div>
                {items.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map((r,i)=>(
                  <div key={i} className="row">
                    <div className={'icon '+getColor(r.type)}>{getIcon(r.type)}</div>
                    <div className="row-info">
                      <b>{r.type==='feeding'?'喂养':r.type==='sleep'?'睡眠':'排便'}</b>
                      <span>{renderItem(r)}</span>
                    </div>
                    <div className="row-time"><small>{fmtTime(r.created_at)}</small></div>
                  </div>
                ))}
              </div>
            ))}
            {Object.keys(grouped).length===0 && <p className="empty">今日暂无记录</p>}
          </div>
        </div>
      )}

      {tab==='growth' && (
        <div className="growth">
          <div className="growth-summary">
            {growth.length>0 && <div className="gs-card"><div>最新：{growth[0]?.data?.height||'-'}cm / {growth[0]?.data?.weight||'-'}kg</div><div className="gs-date">{growth[0]?.data?.date}</div></div>}
          </div>
          <div className="chart">
            {growth.length<2 ? <p className="empty">添加2条以上数据自动生成图表</p> : (
              <ResponsiveContainer height={200}>
                <LineChart data={[...growth].reverse().map(r=>({date:r.data?.date?.slice(5), h:parseFloat(r.data?.height)||0, w:parseFloat(r.data?.weight)||0}))}>
                  <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" fontSize={10}/>
                  <YAxis fontSize={10}/>
                  <Tooltip formatter={(v,n)=>n==='身高'?v+'cm':v+'kg'}/>
                  <Line type="monotone" dataKey="h" stroke="#FF6B9D" name="身高" strokeWidth={2}/>
                  <Line type="monotone" dataKey="w" stroke="#7CDE54" name="体重" strokeWidth={2}/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <button className="add-btn" onClick={()=>onAddClick('growth')}>+ 添加生长记录</button>
          <div className="growth-list">
            {growth.map((r,i)=>(
              <div key={i} className="growth-row">
                <span className="gr-date">{r.data?.date}</span>
                <span className="gr-h">身高 {r.data?.height||'-'}cm</span>
                <span className="gr-w">体重 {r.data?.weight||'-'}kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='album' && (
        <div className="album">
          <button className="add-p" onClick={()=>onAddClick('photo')}><Camera size={22}/><span>添加照片</span></button>
          {photos.map((p,i)=>(
            <div key={i} className="p-item"><img src={p.image_url} alt=""/><p>{p.description}</p></div>
          ))}
          {photos.length===0 && <p className="empty">暂无照片</p>}
        </div>
      )}
    </div>
  )
}

// ========== 主应用 ==========
function App() {
  const [page, setPage] = useState('home') // 'home'|'record'|'price'
  const [showAI, setShowAI] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [modal, setModal] = useState(null) // 'breast'|'sleep'|'poop'|'formula'|'growth'|'photo'
  const [baby] = useState(DEFAULT_BABY)
  const [records, setRecords] = useState([])
  const [photos, setPhotos] = useState([])

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
      if(item.type) {
        await sb.from('records').insert([{ baby_id:baby.id, type:item.type, data:item.data, created_by:'家人' }])
      } else {
        await sb.from('photos').insert([item])
      }
      load()
    }catch(e){}
  }

  return (
    <div className="app">
      {showAI && <AIChat onClose={()=>setShowAI(false)} onSaveRecord={saveRecord}/>}
      {showShare && <ShareCard baby={baby} records={records} onClose={()=>setShowShare(false)}/>}

      {modal==='breast' && <FeedingModal onClose={()=>setModal(null)} onSave={saveRecord}/>}
      {modal==='sleep' && <SleepModal onClose={()=>setModal(null)} onSave={saveRecord}/>}
      {modal==='poop' && <PoopModal onClose={()=>setModal(null)} onSave={saveRecord}/>}
      {modal==='formula' && <FormulaModal onClose={()=>setModal(null)} onSave={saveRecord}/>}
      {modal==='growth' && <GrowthModal onClose={()=>setModal(null)} onSave={saveRecord}/>}
      {modal==='photo' && <PhotoModal babyId={baby.id} onClose={()=>setModal(null)} onSave={saveRecord}/>}

      {!showAI && <main>
        {page==='home' && <HomePage baby={baby} photos={photos} records={records} onAddClick={(t)=>t==='ai'?setShowAI(true):t==='share'?setShowShare(true):setModal(t)}/>}
        {page==='record' && <RecordPage records={records} photos={photos} onAddClick={(t)=>setModal(t)}/>}
        {page==='price' && <PricePage/>}
      </main>}

      {!showAI && <nav>
        <button className={page==='home'?'active':''} onClick={()=>setPage('home')}><Home size={20}/><span>首页</span></button>
        <button className={page==='record'?'active':''} onClick={()=>setPage('record')}><PlusCircle size={20}/><span>记录</span></button>
        <button className={page==='price'?'active':''} onClick={()=>setPage('price')}><Package size={20}/><span>纸尿裤</span></button>
      </nav>}
    </div>
  )
}
export default App
