import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Home, PlusCircle, BarChart3, Settings, Baby, Moon, Droplets, Scale, Syringe, Star, Edit, Trash2, Save, X, Download, MessageCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

// Supabase 配置
const DEFAULT_SUPABASE_URL = 'https://cyiuaertydcyeelguhor.supabase.co'
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aXVhZXJ0eWRjeWVlbGd1aG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTIyNTksImV4cCI6MjA4OTI4ODI1OX0.aFim4dRREA11Vbw1IXDt_TGgK6YeHvrSTs7tZ22Mv2U'

// 工具函数
const calculateAge = (birthDate) => {
  if (!birthDate) return '未知'
  const today = new Date()
  const birth = new Date(birthDate)
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  const days = Math.floor((today - birth) / (1000 * 60 * 60 * 24))
  
  if (months < 1) return `${days}天`
  if (months < 12) return `${months}个月`
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  return remainingMonths > 0 ? `${years}岁${remainingMonths}个月` : `${years}岁`
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const formatTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 首页组件
function HomePage({ baby, records, onQuickAdd }) {
  const today = new Date().toDateString()
  
  const todayRecords = {
    feeding: records.filter(r => r.type === 'feeding' && new Date(r.created_at).toDateString() === today).length,
    sleep: records.filter(r => r.type === 'sleep' && new Date(r.created_at).toDateString() === today).length,
    poop: records.filter(r => r.type === 'poop' && new Date(r.created_at).toDateString() === today).length,
  }

  const todaySleepDuration = records
    .filter(r => r.type === 'sleep' && new Date(r.created_at).toDateString() === today && r.data?.endTime)
    .reduce((sum, r) => {
      const start = new Date(r.data.startTime)
      const end = new Date(r.data.endTime)
      return sum + (end - start) / (1000 * 60 * 60)
    }, 0)

  const recentRecords = [...records]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)

  const typeLabels = { feeding: '喂养', sleep: '睡眠', poop: '排便', growth: '生长', vaccine: '疫苗', milestone: '里程碑' }
  const typeIcons = {
    feeding: <Droplets size={16} />, sleep: <Moon size={16} />, poop: <Droplets size={16} />,
    growth: <Scale size={16} />, vaccine: <Syringe size={16} />, milestone: <Star size={16} />,
  }

  const getRecordDesc = (record) => {
    const d = record.data || {}
    switch (record.type) {
      case 'feeding': return d.method === '母乳' ? `${d.side || '母乳'} ${d.duration || ''}分钟` : `${d.method} ${d.amount || ''}ml`
      case 'sleep': return d.endTime ? `${((new Date(d.endTime) - new Date(d.startTime)) / (1000 * 60 * 60)).toFixed(1)}小时` : `${formatTime(d.startTime)} 开始`
      case 'poop': return `${d.poopType || ''}${d.status ? ` (${d.status})` : ''}`
      case 'growth': return `身高${d.height}cm / 体重${d.weight}kg`
      case 'vaccine': return d.vaccineName || ''
      case 'milestone': return d.title || ''
      default: return ''
    }
  }

  if (!baby) {
    return (
      <div className="home-page">
        <div className="empty-state">
          <Baby size={64} />
          <p>请先在设置中添加宝宝信息</p>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page">
      <div className="baby-card">
        <div className="baby-avatar-large">
          {baby.avatar_url ? <img src={baby.avatar_url} alt="宝宝" /> : <Baby size={48} />}
        </div>
        <h2>{baby.name || '宝宝'}</h2>
        <p className="baby-age">{calculateAge(baby.birth_date)}</p>
        {baby.birth_date && <p className="baby-birthday">生日: {new Date(baby.birth_date).toLocaleDateString('zh-CN')}</p>}
      </div>

      <div className="today-overview">
        <h3>今日概览</h3>
        <div className="overview-grid">
          <div className="overview-item"><Droplets className="overview-icon" /><span className="overview-value">{todayRecords.feeding}</span><span className="overview-label">喂养</span></div>
          <div className="overview-item"><Moon className="overview-icon" /><span className="overview-value">{todaySleepDuration.toFixed(1)}h</span><span className="overview-label">睡眠</span></div>
          <div className="overview-item"><Droplets className="overview-icon" /><span className="overview-value">{todayRecords.poop}</span><span className="overview-label">排便</span></div>
        </div>
      </div>

      <div className="recent-records">
        <h3>最近记录</h3>
        <div className="records-list">
          {recentRecords.length === 0 ? <p className="empty-tip">暂无记录，点击下方按钮添加</p> : recentRecords.map((record) => (
            <div key={record.id} className="record-item">
              <div className="record-icon">{typeIcons[record.type]}</div>
              <div className="record-content">
                <span className="record-type">{typeLabels[record.type]}</span>
                <span className="record-desc">{getRecordDesc(record)}</span>
                <span className="record-time">{formatDate(record.created_at)} {formatTime(record.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="fab" onClick={onQuickAdd}><PlusCircle size={28} /></button>
    </div>
  )
}

// 记录页面
function RecordPage({ records, babyId, supabase, onRefresh }) {
  const [activeTab, setActiveTab] = useState('feeding')
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [formData, setFormData] = useState({})

  const tabs = [
    { key: 'feeding', label: '喂养', icon: Droplets },
    { key: 'sleep', label: '睡眠', icon: Moon },
    { key: 'poop', label: '排便', icon: Droplets },
    { key: 'growth', label: '生长', icon: Scale },
    { key: 'vaccine', label: '疫苗', icon: Syringe },
    { key: 'milestone', label: '里程碑', icon: Star },
  ]

  const handleAdd = (type) => {
    setActiveTab(type)
    setEditingRecord(null)
    setFormData({ time: new Date().toISOString().slice(0, 16) })
    setShowForm(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    setFormData({ ...record.data })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const recordData = { baby_id: babyId, type: activeTab, data: formData, created_by: '用户' }
    if (editingRecord) {
      await supabase.from('records').update(recordData).eq('id', editingRecord.id)
    } else {
      await supabase.from('records').insert([recordData])
    }
    setShowForm(false)
    setFormData({})
    onRefresh()
  }

  const handleDelete = async (id) => {
    if (confirm('确定删除这条记录吗？')) {
      await supabase.from('records').delete().eq('id', id)
      onRefresh()
    }
  }

  const filteredRecords = records.filter(r => r.type === activeTab).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const getRecordDesc = (record) => {
    const d = record.data || {}
    switch (record.type) {
      case 'feeding': return d.method === '母乳' ? `${d.side || '母乳'} ${d.duration || ''}分钟` : `${d.method} ${d.amount || ''}ml${d.food || ''}`
      case 'sleep': return d.endTime ? `${((new Date(d.endTime) - new Date(d.startTime)) / (1000 * 60 * 60)).toFixed(1)}小时 (${d.status || ''})` : `${formatTime(d.startTime)} 开始`
      case 'poop': return `${d.poopType || ''}${d.status ? ` (${d.status})` : ''}`
      case 'growth': return `身高${d.height}cm / 体重${d.weight}kg`
      case 'vaccine': return `${d.vaccineName || ''} - ${d.date || ''}`
      case 'milestone': return d.description || d.title || ''
      default: return ''
    }
  }

  const renderForm = () => {
    const commonFields = <div className="form-group"><label>时间</label><input type="datetime-local" value={formData.time || formData.startTime || formData.date || ''} onChange={(e) => setFormData({ ...formData, time: e.target.value })} /></div>

    switch (activeTab) {
      case 'feeding': return (<>{commonFields}<div className="form-group"><label>喂养方式</label><select value={formData.method || ''} onChange={(e) => setFormData({ ...formData, method: e.target.value })}><option value="">选择方式</option><option value="母乳">母乳</option><option value="奶粉">奶粉</option><option value="辅食">辅食</option></select></div>{formData.method === '母乳' && <div className="form-group"><label>喂奶侧</label><select value={formData.side || ''} onChange={(e) => setFormData({ ...formData, side: e.target.value })}><option value="">选择</option><option value="左侧">左侧</option><option value="右侧">右侧</option><option value="双边">双边</option></select></div>}{(formData.method === '母乳' || formData.method === '辅食') && <div className="form-group"><label>时长（分钟）</label><input type="number" value={formData.duration || ''} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} /></div>}{formData.method === '奶粉' && <div className="form-group"><label>奶量 (ml)</label><input type="number" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>}{formData.method === '辅食' && <div className="form-group"><label>食物</label><input type="text" value={formData.food || ''} onChange={(e) => setFormData({ ...formData, food: e.target.value })} placeholder="吃了什么" /></div>}</>)
      case 'sleep': return (<><div className="form-group"><label>开始时间</label><input type="datetime-local" value={formData.startTime || ''} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} /></div><div className="form-group"><label>结束时间</label><input type="datetime-local" value={formData.endTime || ''} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} /></div><div className="form-group"><label>状态</label><select value={formData.status || ''} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="">选择状态</option><option value="深睡">深睡</option><option value="浅睡">浅睡</option><option value="醒来">醒来</option></select></div></>)
      case 'poop': return (<>{commonFields}<div className="form-group"><label>类型</label><select value={formData.poopType || ''} onChange={(e) => setFormData({ ...formData, poopType: e.target.value })}><option value="">选择</option><option value="大便">大便</option><option value="小便">小便</option></select></div><div className="form-group"><label>状态</label><select value={formData.status || ''} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="">正常</option><option value="稀">稀</option><option value="干">干</option></select></div><div className="form-group"><label>备注</label><input type="text" value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} /></div></>)
      case 'growth': return (<><div className="form-group"><label>日期</label><input type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div><div className="form-group"><label>身高 (cm)</label><input type="number" step="0.1" value={formData.height || ''} onChange={(e) => setFormData({ ...formData, height: e.target.value })} /></div><div className="form-group"><label>体重 (kg)</label><input type="number" step="0.1" value={formData.weight || ''} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} /></div><div className="form-group"><label>头围 (cm, 可选)</label><input type="number" step="0.1" value={formData.head || ''} onChange={(e) => setFormData({ ...formData, head: e.target.value })} /></div></>)
      case 'vaccine': return (<><div className="form-group"><label>疫苗名称</label><input type="text" value={formData.vaccineName || ''} onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })} /></div><div className="form-group"><label>接种日期</label><input type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div><div className="form-group"><label>接种部位</label><input type="text" value={formData.site || ''} onChange={(e) => setFormData({ ...formData, site: e.target.value })} /></div><div className="form-group"><label>备注</label><input type="text" value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} /></div></>)
      case 'milestone': return (<><div className="form-group"><label>标题</label><input type="text" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="如：第一次抬头" /></div><div className="form-group"><label>日期</label><input type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div><div className="form-group"><label>描述</label><textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div></>)
      default: return null
    }
  }

  return (
    <div className="record-page">
      <div className="tab-buttons">
        {tabs.map(tab => <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`} onClick={() => handleAdd(tab.key)}><tab.icon size={18} /><span>{tab.label}</span></button>)}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>{editingRecord ? '编辑' : '添加'}{tabs.find(t => t.key === activeTab)?.label}</h3><button className="close-btn" onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>{renderForm()}<div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>取消</button><button type="submit" className="btn-primary"><Save size={16} /> 保存</button></div></form>
          </div>
        </div>
      )}

      <div className="records-list-full">
        {filteredRecords.length === 0 ? <div className="empty-state"><p>暂无记录</p><button className="btn-primary" onClick={() => handleAdd(activeTab)}><PlusCircle size={18} /> 添加第一条记录</button></div> : filteredRecords.map((record) => (
          <div key={record.id} className="record-card">
            <div className="record-info"><span className="record-main">{getRecordDesc(record)}</span><span className="record-date">{formatDate(record.data?.time || record.data?.date || record.created_at)}</span></div>
            <div className="record-actions"><button onClick={() => handleEdit(record)}><Edit size={16} /></button><button onClick={() => handleDelete(record.id)}><Trash2 size={16} /></button></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 统计页面
function StatsPage({ records }) {
  const growthData = records.filter(r => r.type === 'growth' && r.data?.height && r.data?.weight).sort((a, b) => new Date(a.data.date) - new Date(b.data.date)).map(r => ({ date: r.data.date?.slice(5) || '', height: parseFloat(r.data.height), weight: parseFloat(r.data.weight) }))

  return (
    <div className="stats-page">
      <h2>成长统计</h2>
      <div className="chart-container">
        <h3>身高体重曲线</h3>
        {growthData.length < 2 ? <div className="empty-chart"><Scale size={48} /><p>需要至少2条身高/体重记录</p></div> : (
          <><ResponsiveContainer width="100%" height={250}><LineChart data={growthData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="date" stroke="#888" fontSize={12} /><YAxis stroke="#888" fontSize={12} /><Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} /><Line type="monotone" dataKey="height" stroke="#FF9A9E" strokeWidth={2} name="身高(cm)" /><Line type="monotone" dataKey="weight" stroke="#A8E6CF" strokeWidth={2} name="体重(kg)" /></LineChart></ResponsiveContainer><div className="stats-summary"><div className="stat-card"><span className="stat-label">最新身高</span><span className="stat-value">{growthData[growthData.length - 1]?.height} cm</span></div><div className="stat-card"><span className="stat-label">最新体重</span><span className="stat-value">{growthData[growthData.length - 1]?.weight} kg</span></div></div></>
        )}
      </div>
    </div>
  )
}

// 设置页面
function SettingsPage({ baby, supabase, onUpdateBaby, config, onUpdateConfig }) {
  const [formData, setFormData] = useState(baby || {})
  const [llmConfig, setLlmConfig] = useState(config.llm || { provider: 'openai', apiKey: '', endpoint: '' })

  const handleSave = async () => {
    if (baby) {
      await supabase.from('babies').update({ name: formData.name, birth_date: formData.birth_date, gender: formData.gender, avatar_url: formData.avatar_url }).eq('id', baby.id)
    } else {
      const { data } = await supabase.from('babies').insert([{ name: formData.name, birth_date: formData.birth_date, gender: formData.gender, avatar_url: formData.avatar_url }]).select().single()
      if (data) onUpdateBaby(data)
    }
    onUpdateBaby({ ...baby, ...formData })
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => setFormData({ ...formData, avatar_url: event.target.result })
      reader.readAsDataURL(file)
    }
  }

  const handleLlmSave = () => { onUpdateConfig({ ...config, llm: llmConfig }); alert('LLM 配置已保存！') }
  const handleExport = async () => {
    const { data: babies } = await supabase.from('babies').select('*')
    const { data: records } = await supabase.from('records').select('*')
    const blob = new Blob([JSON.stringify({ babies, records, exportTime: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `baby-diary-${new Date().toISOString().slice(0, 10)}.json`; a.click()
  }

  return (
    <div className="settings-page">
      <h2>设置</h2>
      <div className="settings-section">
        <h3>宝宝信息</h3>
        <div className="baby-info-form">
          <div className="avatar-section"><div className="avatar-preview">{formData.avatar_url ? <img src={formData.avatar_url} alt="宝宝" /> : <Baby size={48} />}</div><label className="avatar-upload"><input type="file" accept="image/*" onChange={handleAvatarChange} />更换头像</label></div>
          <div className="form-group"><label>姓名</label><input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="宝宝姓名" /></div>
          <div className="form-group"><label>出生日期</label><input type="date" value={formData.birth_date || ''} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} /></div>
          <div className="form-group"><label>性别</label><select value={formData.gender || ''} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}><option value="">请选择</option><option value="男">男宝宝</option><option value="女">女宝宝</option></select></div>
          <button className="btn-primary" onClick={handleSave}><Save size={16} /> 保存信息</button>
        </div>
      </div>
      <div className="settings-section">
        <h3>LLM 配置 (Page Agent)</h3><p className="setting-tip">配置 LLM 用于 Page Agent 智能对话</p>
        <div className="form-group"><label>模型提供商</label><select value={llmConfig.provider} onChange={(e) => setLlmConfig({ ...llmConfig, provider: e.target.value })}><option value="openai">OpenAI</option><option value="anthropic">Anthropic (Claude)</option><option value="qwen">通义千问</option><option value="custom">自定义</option></select></div>
        <div className="form-group"><label>API Key</label><input type="password" value={llmConfig.apiKey} onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })} placeholder="请输入 API Key" /></div>
        {llmConfig.provider === 'custom' && <div className="form-group"><label>自定义 Endpoint</label><input type="text" value={llmConfig.endpoint} onChange={(e) => setLlmConfig({ ...llmConfig, endpoint: e.target.value })} placeholder="https://api.example.com/v1/chat" /></div>}
        <button className="btn-secondary" onClick={handleLlmSave}><Save size={16} /> 保存 LLM 配置</button>
      </div>
      <div className="settings-section"><h3>数据管理</h3><div className="data-actions"><button className="btn-secondary" onClick={handleExport}><Download size={18} /> 导出数据</button></div></div>
      <div className="settings-section about"><h3>关于</h3><p>宝宝成长记录 v1.0</p><p>Powered by Supabase</p></div>
    </div>
  )
}

// Page Agent 组件
function PageAgent({ config, baby, records, onAddRecord, onClose }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: '你好！我是宝宝记录助手可以说："宝宝吃了100ml奶粉"、"今天吃了几次奶？" 等' }])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const processLocally = (text, baby, records) => {
    const lower = text.toLowerCase()
    if (lower.includes('奶粉') || lower.includes('ml')) {
      const match = text.match(/(\d+)\s*ml/i)
      if (match) { onAddRecord('feeding', { method: '奶粉', amount: match[1], time: new Date().toISOString() }); return `已记录宝宝吃了 ${match[1]}ml 奶粉！` }
    }
    if (lower.includes('母乳')) {
      const match = text.match(/(\d+)\s*分钟/i)
      if (match) { onAddRecord('feeding', { method: '母乳', duration: match[1], time: new Date().toISOString() }); return `已记录母乳 ${match[1]} 分钟！` }
    }
    if (lower.includes('睡觉')) { onAddRecord('sleep', { startTime: new Date().toISOString() }); return '已记录宝宝开始睡觉！' }
    if (lower.includes('今天') && lower.includes('吃')) {
      const today = new Date().toDateString()
      const count = records.filter(r => r.type === 'feeding' && new Date(r.created_at).toDateString() === today).length
      return `今天记录了 ${count} 次喂养。`
    }
    if (lower.includes('多大') || lower.includes('年龄')) {
      if (baby?.birth_date) return `宝宝 ${baby.name} 现在 ${calculateAge(baby.birth_date)} 了！`
      return '请先在设置中添加宝宝出生日期'
    }
    return '可以说："宝宝吃了100ml奶粉"、"记录睡觉"、"今天吃了几次？"'
  }

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsProcessing(true)
    setTimeout(() => {
      const response = processLocally(input, baby, records)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setIsProcessing(false)
    }, 500)
  }

  return (
    <div className="page-agent-overlay" onClick={onClose}>
      <div className="page-agent-panel" onClick={e => e.stopPropagation()}>
        <div className="page-agent-header"><h3>🤖 AI 助手</h3><button onClick={onClose}><X size={20} /></button></div>
        <div className="page-agent-messages">
          {messages.map((msg, i) => <div key={i} className={`msg ${msg.role}`}>{msg.content}</div>)}
          {isProcessing && <div className="msg assistant">处理中...</div>}
        </div>
        <div className="page-agent-input"><input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="说点什么..." /><button onClick={handleSend} disabled={isProcessing}>发送</button></div>
      </div>
    </div>
  )
}

// 主应用
function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [supabase] = useState(() => createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY))
  // 默认宝宝数据
  const DEFAULT_BABY = {
    id: 'b28b33ff-f8bf-46f1-afac-e3ec8d250724',
    name: 'ok',
    birth_date: '2025-11-27',
    gender: '男',
    avatar_url: 'https://cdn.hailuoai.com/cdn_upload/20260317/483599064122089474/377493510574432/123036_4a92/workspace/user_input_files/0fc91d9d65183260ce751b47fafc600f.png'
  }

  const [baby, setBaby] = useState(DEFAULT_BABY)
  const [records, setRecords] = useState([])
  const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('babyDiary_config') || '{}'))
  const [showPageAgent, setShowPageAgent] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // 先尝试从数据库获取
      const { data: babies } = await supabase.from('babies').select('*').limit(1)
      
      if (babies && babies.length > 0) {
        setBaby(babies[0])
        const { data: recordsData } = await supabase.from('records').select('*').eq('baby_id', babies[0].id).order('created_at', { ascending: false })
        setRecords(recordsData || [])
      } else {
        // 获取默认宝宝的记录
        const { data: recordsData } = await supabase.from('records').select('*').eq('baby_id', DEFAULT_BABY.id).order('created_at', { ascending: false })
        setRecords(recordsData || [])
      }
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const handleAddRecord = async (type, data) => {
    if (!baby) return
    await supabase.from('records').insert([{ baby_id: baby.id, type, data, created_by: '用户' }])
    loadData()
  }

  const handleUpdateConfig = (newConfig) => {
    setConfig(newConfig)
    localStorage.setItem('babyDiary_config', JSON.stringify(newConfig))
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage baby={baby} records={records} onQuickAdd={() => setActiveTab('record')} />
      case 'record': return <RecordPage records={records} babyId={baby?.id} supabase={supabase} onRefresh={loadData} />
      case 'stats': return <StatsPage records={records} />
      case 'settings': return <SettingsPage baby={baby} supabase={supabase} onUpdateBaby={(b) => { setBaby(b); loadData() }} config={config} onUpdateConfig={handleUpdateConfig} />
      default: return null
    }
  }

  return (
    <div className="app">
      {loading && <div className="loading-overlay"><div className="loading">加载中...</div></div>}
      {error && <div className="error-banner">错误: {error}</div>}
      <header className="app-header">
        <div className="baby-mini-info">
          <div className="baby-mini-avatar">{baby?.avatar_url ? <img src={baby.avatar_url} alt="" /> : <Baby size={20} />}</div>
          <span className="baby-mini-name">{baby?.name || '宝宝'}</span>
          <span className="baby-mini-age">{calculateAge(baby?.birth_date)}</span>
        </div>
        <button className="ai-btn" onClick={() => setShowPageAgent(true)}><MessageCircle size={20} /></button>
      </header>
      <main className="app-content">{renderPage()}</main>
      <nav className="bottom-nav">
        <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}><Home size={22} /><span>首页</span></button>
        <button className={activeTab === 'record' ? 'active' : ''} onClick={() => setActiveTab('record')}><PlusCircle size={22} /><span>记录</span></button>
        <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}><BarChart3 size={22} /><span>统计</span></button>
        <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}><Settings size={22} /><span>设置</span></button>
      </nav>
      {showPageAgent && <PageAgent config={config} baby={baby} records={records} onAddRecord={handleAddRecord} onClose={() => setShowPageAgent(false)} />}
    </div>
  )
}

export default App
