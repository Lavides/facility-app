// src/App.jsx
import { useState, useEffect } from 'react'
import {
  FACILITY_GROUPS,
  loadRequests, saveRequests,
  loadUsers,    saveUsers,
  loadFacilities, saveFacilities,
  loadSymptoms,   saveSymptoms,
  loadAccounts,   saveAccounts,
} from './data.js'

/* ── CSS ── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{-webkit-text-size-adjust:100%}
  html,body,#root{height:100%;background:#070e1a;color:#e2e8f0;font-family:'Noto Sans KR',sans-serif}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#1e3050;border-radius:4px}
  select option,optgroup{background:#0f1e33}
  input,textarea,select,button{-webkit-appearance:none;appearance:none}
  button{touch-action:manipulation}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideInR{from{transform:translateX(100%)}to{transform:translateX(0)}}
  @keyframes slideInUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
  @keyframes popUp{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes toastIn{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
`

const C = {
  bg:'#070e1a', surface:'#0d1829', surface2:'#122035', surface3:'#162640',
  border:'#1a2e48', border2:'#1e3555',
  accent:'#f97316', accentDim:'rgba(249,115,22,.12)',
  red:'#ef4444',   redDim:'rgba(239,68,68,.12)',
  blue:'#3b82f6',  blueDim:'rgba(59,130,246,.12)',
  green:'#22c55e', greenDim:'rgba(34,197,94,.12)',
  yellow:'#eab308',yellowDim:'rgba(234,179,8,.12)',
  text:'#e2e8f0',  text2:'#94a3b8', text3:'#475569', text4:'#2a3f5a',
}
const mono = { fontFamily:"'JetBrains Mono',monospace" }

/* ── hooks ── */
function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function nowDate() { return new Date().toISOString().slice(0,10) }
function uid() { return 'REQ-' + String(Date.now()).slice(-6) }

/* ── 권한 헬퍼 ── */
// role: null(비로그인) | 'manager'(설비관리자) | 'admin'(관리자)
const can = {
  submitRequest: () => true,                           // 모두 가능
  changeStatus:  (role) => role==='manager'||role==='admin',
  addFacility:   (role) => role==='manager'||role==='admin',
  deleteFacility:(role) => role==='admin',
  editSymptoms:  (role) => role==='admin',
  viewHistory:   (role) => role==='manager'||role==='admin',
  manageUsers:   (role) => role==='admin',
  addAccount:    (role) => role==='admin',
  viewDashboard: (role) => role==='manager'||role==='admin',
  viewAllReqs:   (role) => role==='manager'||role==='admin',
}

/* ── Badges ── */
function StatusBadge({ s }) {
  const map = { '대기':[C.yellow,C.yellowDim], '처리중':[C.blue,C.blueDim], '완료':[C.green,C.greenDim] }
  const [col,bg] = map[s]||[C.text2,'rgba(148,163,184,.08)']
  return <span style={{ background:bg, color:col, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}><span style={{ width:5, height:5, borderRadius:'50%', background:col, flexShrink:0 }} />{s}</span>
}
function UrgTag({ u }) {
  return <span style={{ fontSize:11, fontWeight:700, color:u==='긴급'?'#f87171':C.text3, ...mono }}>{u==='긴급'?'🚨':'📋'} {u}</span>
}
function FacBadge({ s }) {
  const map = { '정상':[C.greenDim,'#4ade80'], '수리중':[C.redDim,'#f87171'], '점검중':[C.yellowDim,'#facc15'] }
  const [bg,col] = map[s]||['rgba(148,163,184,.08)',C.text2]
  return <span style={{ background:bg, color:col, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{s}</span>
}
function RoleBadge({ r }) {
  const map = { '관리자':[C.redDim,'#f87171'], '설비관리자':[C.blueDim,'#60a5fa'], '조/반장':['rgba(148,163,184,.08)',C.text2], '작업자':['rgba(148,163,184,.08)',C.text2] }
  const [bg,col] = map[r]||map['작업자']
  return <span style={{ background:bg, color:col, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{r}</span>
}
function Toggle({ on, onChange }) {
  return <div onClick={onChange} style={{ width:36, height:20, borderRadius:10, background:on?C.green:C.border, position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}><div style={{ position:'absolute', top:3, left:on?19:3, width:14, height:14, background:'#fff', borderRadius:'50%', transition:'left .2s' }} /></div>
}

/* ── Toast ── */
function Toasts({ list }) {
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
      {list.map(t=>(
        <div key={t.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 16px 48px rgba(0,0,0,.55)', animation:'toastIn .3s ease', minWidth:280 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, fontWeight:700,
            background:t.type==='success'?'rgba(34,197,94,.18)':t.type==='error'?'rgba(239,68,68,.18)':'rgba(234,179,8,.18)',
            color:t.type==='success'?'#4ade80':t.type==='error'?'#f87171':'#facc15' }}>
            {t.type==='success'?'✓':t.type==='error'?'✕':'!'}
          </div>
          <div><div style={{ fontSize:13, fontWeight:700 }}>{t.title}</div><div style={{ fontSize:11, color:C.text3, marginTop:2 }}>{t.sub}</div></div>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════
   LOGIN MODAL
══════════════════════════════════════ */
function LoginModal({ accounts, onLogin, onClose }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const inp = { width:'100%', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'11px 14px', color:C.text, fontSize:14, fontFamily:"'Noto Sans KR',sans-serif", outline:'none' }
  const submit = () => {
    const acc = accounts.find(a=>a.username===id && a.password===pw)
    if (!acc) { setErr('아이디 또는 비밀번호가 올바르지 않습니다'); return }
    onLogin(acc)
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', backdropFilter:'blur(8px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, width:380, animation:'popUp .22s ease', boxShadow:'0 32px 80px rgba(0,0,0,.6)' }}>
        <div style={{ padding:'28px 28px 20px' }}>
          <div style={{ width:44, height:44, background:'linear-gradient(135deg,#f97316,#dc2626)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:16 }}>⚙</div>
          <div style={{ fontSize:20, fontWeight:900, marginBottom:4 }}>로그인</div>
          <div style={{ fontSize:12, color:C.text3, marginBottom:24 }}>설비 수리 의뢰 시스템</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <input value={id} onChange={e=>{setId(e.target.value);setErr('')}} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="아이디" style={inp} />
            <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr('')}} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="비밀번호" style={inp} />
            {err && <div style={{ fontSize:12, color:'#f87171', background:C.redDim, border:`1px solid rgba(239,68,68,.2)`, borderRadius:8, padding:'8px 12px' }}>{err}</div>}
          </div>
        </div>
        <div style={{ padding:'0 28px 24px', display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:10, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>취소</button>
          <button onClick={submit} style={{ flex:2, padding:12, borderRadius:10, border:'none', background:C.accent, color:'#fff', fontSize:14, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>로그인</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   ADD ACCOUNT MODAL (관리자 전용)
══════════════════════════════════════ */
function AddAccountModal({ onClose, onAdd }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [dept, setDept]         = useState('')
  const [role, setRole]         = useState('manager')
  const inp = { width:'100%', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:13, fontFamily:"'Noto Sans KR',sans-serif", outline:'none', appearance:'none' }
  const submit = () => {
    if(!username.trim()||!password.trim()||!name.trim()) return alert('모든 항목을 입력해주세요')
    onAdd({ id:'ACC-'+Date.now(), username:username.trim(), password:password.trim(), name:name.trim(), dept:dept.trim()||'생산기술', role })
    onClose()
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, width:420, animation:'popUp .2s ease', boxShadow:'0 30px 70px rgba(0,0,0,.6)' }}>
        <div style={{ padding:'18px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontWeight:800, fontSize:15 }}>🔑 계정 추가</div>
          <button onClick={onClose} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, width:30, height:30, borderRadius:7, cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:22, display:'flex', flexDirection:'column', gap:12 }}>
          {[['이름',name,setName,'홍길동'],['부서',dept,setDept,'생산기술'],['아이디(로그인용)',username,setUsername,'GILDONG'],['비밀번호',password,setPassword,'Password1!']].map(([label,val,set,ph])=>(
            <div key={label}>
              <label style={{ fontSize:11, fontWeight:700, color:C.text3, display:'block', marginBottom:5 }}>{label}</label>
              <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={inp} type={label.includes('비밀번호')?'password':'text'} />
            </div>
          ))}
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.text3, display:'block', marginBottom:5 }}>권한</label>
            <select value={role} onChange={e=>setRole(e.target.value)} style={inp}>
              <option value='manager'>설비관리자</option>
              <option value='admin'>관리자</option>
            </select>
          </div>
        </div>
        <div style={{ padding:'12px 22px 20px', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>취소</button>
          <button onClick={submit} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>추가</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   ADD FACILITY MODAL
══════════════════════════════════════ */
function AddFacModal({ onClose, onAdd }) {
  const [name, setName]     = useState('')
  const [group, setGroup]   = useState('사출')
  const [status, setStatus] = useState('정상')
  const inp = { width:'100%', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:13, fontFamily:"'Noto Sans KR',sans-serif", outline:'none', appearance:'none' }
  const submit = () => {
    if(!name.trim()) return alert('설비명을 입력해주세요')
    onAdd({ id:'FAC-'+Date.now(), name:name.trim(), group, status, lastCheck:nowDate() })
    onClose()
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, width:380, animation:'popUp .2s ease', boxShadow:'0 30px 70px rgba(0,0,0,.6)' }}>
        <div style={{ padding:'18px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontWeight:800, fontSize:15 }}>⚙ 설비 추가</div>
          <button onClick={onClose} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, width:30, height:30, borderRadius:7, cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:22, display:'flex', flexDirection:'column', gap:12 }}>
          <div><label style={{ fontSize:11, fontWeight:700, color:C.text3, display:'block', marginBottom:5 }}>설비명</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="예: 사출 25호기" style={inp} /></div>
          <div><label style={{ fontSize:11, fontWeight:700, color:C.text3, display:'block', marginBottom:5 }}>구분</label>
            <select value={group} onChange={e=>setGroup(e.target.value)} style={inp}>{FACILITY_GROUPS.map(g=><option key={g}>{g}</option>)}</select></div>
          <div><label style={{ fontSize:11, fontWeight:700, color:C.text3, display:'block', marginBottom:5 }}>상태</label>
            <select value={status} onChange={e=>setStatus(e.target.value)} style={inp}><option>정상</option><option>점검중</option><option>수리중</option></select></div>
        </div>
        <div style={{ padding:'12px 22px 20px', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>취소</button>
          <button onClick={submit} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>추가</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   ADD USER MODAL (관리자 전용)
══════════════════════════════════════ */
function AddUserModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [dept, setDept] = useState('')
  const [role, setRole] = useState('조/반장')
  const inp = { width:'100%', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:13, fontFamily:"'Noto Sans KR',sans-serif", outline:'none', appearance:'none' }
  const submit = () => {
    if(!name.trim()) return alert('이름을 입력해주세요')
    onAdd({ id:'USR-'+Date.now(), name:name.trim(), dept:dept.trim(), role, notif:true, active:true })
    onClose()
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, width:380, animation:'popUp .2s ease', boxShadow:'0 30px 70px rgba(0,0,0,.6)' }}>
        <div style={{ padding:'18px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontWeight:800, fontSize:15 }}>👤 사용자 추가</div>
          <button onClick={onClose} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, width:30, height:30, borderRadius:7, cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:22, display:'flex', flexDirection:'column', gap:12 }}>
          <div><label style={{ fontSize:11, fontWeight:700, color:C.text3, display:'block', marginBottom:5 }}>이름</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동" style={inp} /></div>
          <div><label style={{ fontSize:11, fontWeight:700, color:C.text3, display:'block', marginBottom:5 }}>부서</label><input value={dept} onChange={e=>setDept(e.target.value)} placeholder="생산" style={inp} /></div>
          <div><label style={{ fontSize:11, fontWeight:700, color:C.text3, display:'block', marginBottom:5 }}>역할</label>
            <select value={role} onChange={e=>setRole(e.target.value)} style={inp}><option>관리자</option><option>설비관리자</option><option>조/반장</option><option>작업자</option></select></div>
        </div>
        <div style={{ padding:'12px 22px 20px', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>취소</button>
          <button onClick={submit} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>추가</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   REQUEST MODAL
══════════════════════════════════════ */
function RequestModal({ onClose, onSubmit, symptoms, isMobile, facilities: facList=[] }) {
  const [step, setStep]       = useState(isMobile ? 1 : 0)
  const [facId, setFacId]     = useState('')
  const [selSyms, setSelSyms] = useState([])
  const [urgency, setUrgency] = useState('긴급')
  const [memo, setMemo]       = useState('')
  const [name, setName]       = useState('')

  const toggleSym = s => setSelSyms(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])
  const submit = () => {
    if(!facId) return alert('설비를 선택해주세요')
    if(!selSyms.length) return alert('증상을 선택해주세요')
    if(!name.trim()) return alert('의뢰자 이름을 입력해주세요')
    const fac = facList.find(f=>f.id===facId)
    onSubmit({ id:uid(), facId, fac:fac.name, symptoms:selSyms, urgency, requester:name.trim(), date:nowDate(), time:nowTime(), status:'대기', memo })
    onClose()
  }

  const inp = { width:'100%', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:13, fontFamily:"'Noto Sans KR',sans-serif", outline:'none' }

  /* 모바일: 스텝 방식 */
  if (isMobile) {
    return (
      <div style={{ position:'fixed', inset:0, background:C.bg, zIndex:200, display:'flex', flexDirection:'column', animation:'slideInUp .25s ease' }}>
        <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <button onClick={step>1?()=>setStep(s=>s-1):onClose} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, width:34, height:34, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>←</button>
          <div style={{ flex:1 }}><div style={{ fontSize:15, fontWeight:800 }}>수리 의뢰 접수</div><div style={{ fontSize:11, color:C.text3 }}>STEP {step} / 4</div></div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
          {step===1&&(<div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text2, marginBottom:12 }}>설비 선택</div>
            {FACILITY_GROUPS.map(group=>{
              const gf=facList.filter(f=>f.group===group); if(!gf.length) return null
              return <div key={group} style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.text3, marginBottom:8 }}>{group}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {gf.map(f=>{ const sel=facId===f.id; return (
                    <div key={f.id} onClick={()=>setFacId(f.id)} style={{ padding:'12px', borderRadius:10, border:`2px solid ${sel?C.accent:C.border}`, background:sel?C.accentDim:C.surface2, cursor:'pointer', transition:'all .15s' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:sel?C.accent:C.text, marginBottom:4 }}>{f.name}</div>
                      <FacBadge s={f.status} />
                    </div>
                  )})}
                </div>
              </div>
            })}
          </div>)}
          {step===2&&(<div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text2, marginBottom:12 }}>증상 선택 (복수 가능)</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {symptoms.map(s=>{ const on=selSyms.includes(s); return (
                <div key={s} onClick={()=>toggleSym(s)} style={{ padding:'12px', borderRadius:10, border:`2px solid ${on?C.accent:C.border}`, background:on?C.accentDim:C.surface2, cursor:'pointer', transition:'all .15s', textAlign:'center', fontSize:12, fontWeight:on?700:400, color:on?C.accent:C.text2 }}>{s}</div>
              )})}
            </div>
          </div>)}
          {step===3&&(<div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text2, marginBottom:4 }}>긴급도 & 정보</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[{k:'긴급',icon:'🚨',col:'#f87171',bg:C.redDim,brd:C.red},{k:'일반',icon:'📋',col:'#60a5fa',bg:C.blueDim,brd:C.blue}].map(opt=>(
                <div key={opt.k} onClick={()=>setUrgency(opt.k)} style={{ padding:'14px', borderRadius:12, border:`1px solid ${urgency===opt.k?opt.brd:C.border}`, background:urgency===opt.k?opt.bg:C.surface2, cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:urgency===opt.k?opt.col:C.text2, marginBottom:3 }}>{opt.icon} {opt.k}</div>
                </div>
              ))}
            </div>
            <div><label style={{ fontSize:11, fontWeight:700, color:C.text3, display:'block', marginBottom:6 }}>의뢰자 이름</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="이름 입력" style={inp} /></div>
            <div><label style={{ fontSize:11, fontWeight:700, color:C.text3, display:'block', marginBottom:6 }}>메모 (선택)</label><textarea value={memo} onChange={e=>setMemo(e.target.value)} placeholder="추가 증상이나 상황..." style={{ ...inp, resize:'vertical', minHeight:80, lineHeight:1.6 }} /></div>
          </div>)}
          {step===4&&(<div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text2, marginBottom:14 }}>최종 확인</div>
            {[['설비',facList.find(f=>f.id===facId)?.name||'-'],['증상',selSyms.join(', ')||'-'],['긴급도',urgency],['의뢰자',name||'-']].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                <span style={{ color:C.text3 }}>{k}</span><span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
            {memo&&<div style={{ marginTop:10, padding:12, background:C.surface2, borderRadius:8, fontSize:12, color:C.text2 }}>{memo}</div>}
          </div>)}
        </div>
        <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.border}`, flexShrink:0, paddingBottom:'calc(12px + env(safe-area-inset-bottom,0px))' }}>
          {step<4
            ? <button onClick={()=>{if(step===1&&!facId){alert('설비를 선택해주세요');return}if(step===2&&!selSyms.length){alert('증상을 선택해주세요');return}setStep(s=>s+1)}} style={{ width:'100%', padding:15, borderRadius:12, border:'none', background:C.accent, color:'#fff', fontSize:15, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>다음 →</button>
            : <button onClick={submit} style={{ width:'100%', padding:15, borderRadius:12, border:'none', background:C.accent, color:'#fff', fontSize:15, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>✓ 의뢰 접수</button>}
        </div>
      </div>
    )
  }

  /* 데스크탑 */
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, width:540, maxHeight:'90vh', overflowY:'auto', animation:'popUp .22s ease', boxShadow:'0 32px 80px rgba(0,0,0,.6)' }}>
        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontWeight:800, fontSize:16 }}>🔧 수리 의뢰 접수</div>
          <button onClick={onClose} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, width:32, height:32, borderRadius:8, cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:24 }}>
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.text2, display:'block', marginBottom:8 }}>설비 선택</label>
            <select value={facId} onChange={e=>setFacId(e.target.value)} style={{ ...inp, appearance:'none' }}>
              <option value=''>설비를 선택하세요</option>
              {FACILITY_GROUPS.map(group=>(
                <optgroup key={group} label={`── ${group}`}>
                  {facList.filter(f=>f.group===group).map(f=><option key={f.id} value={f.id}>{f.name}　({f.status})</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.text2, display:'block', marginBottom:8 }}>증상 선택 <span style={{ color:C.text3, fontWeight:400 }}>(복수 가능)</span></label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {symptoms.map(s=>{ const on=selSyms.includes(s); return <div key={s} onClick={()=>toggleSym(s)} style={{ padding:'9px 12px', borderRadius:8, border:`1px solid ${on?C.accent:C.border}`, background:on?C.accentDim:C.surface2, color:on?C.accent:C.text2, fontSize:12, cursor:'pointer', textAlign:'center', transition:'all .15s', fontWeight:on?700:400 }}>{s}</div> })}
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.text2, display:'block', marginBottom:8 }}>긴급도</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[{k:'긴급',icon:'🚨',col:'#f87171',bg:C.redDim,brd:C.red},{k:'일반',icon:'📋',col:'#60a5fa',bg:C.blueDim,brd:C.blue}].map(opt=>(
                <div key={opt.k} onClick={()=>setUrgency(opt.k)} style={{ padding:'12px 14px', borderRadius:10, border:`1px solid ${urgency===opt.k?opt.brd:C.border}`, background:urgency===opt.k?opt.bg:C.surface2, cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:urgency===opt.k?opt.col:C.text2, marginBottom:3 }}>{opt.icon} {opt.k}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.text2, display:'block', marginBottom:8 }}>의뢰자 이름</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="이름을 입력하세요" style={inp} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:C.text2, display:'block', marginBottom:8 }}>메모 <span style={{ color:C.text3, fontWeight:400 }}>(선택)</span></label>
            <textarea value={memo} onChange={e=>setMemo(e.target.value)} placeholder="추가 증상이나 상황을 자세히 입력해주세요..." style={{ ...inp, resize:'vertical', minHeight:80, lineHeight:1.6 }} />
          </div>
        </div>
        <div style={{ padding:'14px 24px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>취소</button>
          <button onClick={submit} style={{ padding:'9px 20px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>➤ 의뢰 접수</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   DETAIL PANEL
══════════════════════════════════════ */
function DetailPanel({ req, role, onClose, onStatusChange, isMobile }) {
  if(!req) return null
  const canChange = can.changeStatus(role)
  const wrap = isMobile
    ? { position:'fixed', inset:0, background:C.bg, zIndex:150, overflowY:'auto', animation:'slideInR .25s ease' }
    : { position:'fixed', top:0, right:0, bottom:0, width:400, background:C.surface, borderLeft:`1px solid ${C.border}`, zIndex:100, overflowY:'auto', animation:'slideInR .25s ease', boxShadow:'-24px 0 64px rgba(0,0,0,.45)' }
  return (
    <div style={wrap}>
      <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, background:isMobile?C.bg:C.surface, zIndex:1 }}>
        <button onClick={onClose} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16, flexShrink:0 }}>←</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, color:C.text3, ...mono }}>{req.id}</div>
          <div style={{ fontSize:15, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{req.fac}</div>
        </div>
        <UrgTag u={req.urgency} />
      </div>
      <div style={{ padding:20 }}>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text3, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>의뢰 정보</div>
          {[['설비',req.fac],['증상',req.symptoms.join(', ')],['의뢰자',req.requester],['날짜/시간',`${req.date||''} ${req.time}`]].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'9px 0', borderBottom:`1px solid rgba(26,46,72,.6)`, fontSize:13 }}>
              <span style={{ color:C.text3, flexShrink:0, marginRight:12 }}>{k}</span><span style={{ fontWeight:500, textAlign:'right' }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:`1px solid rgba(26,46,72,.6)`, fontSize:13 }}>
            <span style={{ color:C.text3 }}>상태</span><StatusBadge s={req.status} />
          </div>
          {req.memo&&<div style={{ padding:'10px 0', fontSize:12, color:C.text2, lineHeight:1.65 }}><span style={{ color:C.text3, display:'block', marginBottom:4 }}>메모</span>{req.memo}</div>}
        </div>
        {canChange && req.status!=='완료' && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.text3, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>상태 변경</div>
            {req.status==='대기'&&<button onClick={()=>onStatusChange(req.id,'처리중')} style={{ width:'100%', padding:12, borderRadius:10, border:`1px solid ${C.blue}`, background:C.blueDim, color:'#60a5fa', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700, marginBottom:8 }}>→ 처리중으로 변경</button>}
            {req.status==='처리중'&&<button onClick={()=>onStatusChange(req.id,'완료')} style={{ width:'100%', padding:12, borderRadius:10, border:`1px solid ${C.green}`, background:C.greenDim, color:'#4ade80', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>✓ 완료 처리</button>}
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   SYMPTOM MANAGER (관리자 전용)
══════════════════════════════════════ */
function SymptomManager({ symptoms, onSave, onClose }) {
  const [list, setList] = useState([...symptoms])
  const [newItem, setNewItem] = useState('')
  const add = () => { if(!newItem.trim()) return; if(list.includes(newItem.trim())) return alert('이미 있는 증상입니다'); setList(p=>[...p, newItem.trim()]); setNewItem('') }
  const remove = (s) => setList(p=>p.filter(x=>x!==s))
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, width:420, maxHeight:'80vh', display:'flex', flexDirection:'column', animation:'popUp .2s ease', boxShadow:'0 30px 70px rgba(0,0,0,.6)' }}>
        <div style={{ padding:'18px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontWeight:800, fontSize:15 }}>📋 증상 목록 관리</div>
          <button onClick={onClose} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, width:30, height:30, borderRadius:7, cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:22 }}>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <input value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="새 증상 입력 후 Enter" style={{ flex:1, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:13, fontFamily:"'Noto Sans KR',sans-serif", outline:'none' }} />
            <button onClick={add} style={{ padding:'9px 14px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700, flexShrink:0 }}>추가</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {list.map(s=>(
              <div key={s} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:C.surface2, borderRadius:8, border:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13 }}>{s}</span>
                <button onClick={()=>remove(s)} style={{ background:C.redDim, border:`1px solid rgba(239,68,68,.2)`, color:'#f87171', width:24, height:24, borderRadius:6, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'12px 22px 20px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8, justifyContent:'flex-end', flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>취소</button>
          <button onClick={()=>{onSave(list);onClose()}} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>저장</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   HISTORY PAGE
══════════════════════════════════════ */
function HistoryPage({ requests, facilities }) {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()+1)

  const years  = [2024,2025,2026]
  const months = Array.from({length:12},(_,i)=>i+1)

  const pad = n => String(n).padStart(2,'0')
  const prefix = `${year}-${pad(month)}`
  const filtered = requests.filter(r=>(r.date||'').startsWith(prefix))

  // 설비별 집계
  const facMap = {}
  filtered.forEach(r=>{
    if(!facMap[r.facId]) facMap[r.facId]={ fac:r.fac, facId:r.facId, count:0, urgent:0, done:0, syms:{} }
    facMap[r.facId].count++
    if(r.urgency==='긴급') facMap[r.facId].urgent++
    if(r.status==='완료')  facMap[r.facId].done++
    r.symptoms.forEach(s=>{ facMap[r.facId].syms[s]=(facMap[r.facId].syms[s]||0)+1 })
  })
  const rows = Object.values(facMap).sort((a,b)=>b.count-a.count)

  const selStyle = { background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px', color:C.text, fontSize:13, fontFamily:"'Noto Sans KR',sans-serif", outline:'none', appearance:'none', cursor:'pointer' }

  return (
    <div style={{ animation:'fadeUp .3s ease' }}>
      {/* 필터 */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <select value={year} onChange={e=>setYear(Number(e.target.value))} style={selStyle}>
          {years.map(y=><option key={y}>{y}</option>)}
        </select>
        <span style={{ color:C.text3, fontSize:13 }}>년</span>
        <select value={month} onChange={e=>setMonth(Number(e.target.value))} style={selStyle}>
          {months.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <span style={{ color:C.text3, fontSize:13 }}>월</span>
        <span style={{ marginLeft:'auto', fontSize:12, color:C.text3 }}>총 <b style={{ color:C.text }}>{filtered.length}</b>건</span>
      </div>

      {rows.length===0
        ? <div style={{ textAlign:'center', padding:60, color:C.text3, fontSize:14 }}>해당 기간에 고장 이력이 없습니다</div>
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {rows.map((r,i)=>(
              <div key={r.facId} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:i===0?C.accentDim:C.surface2, border:`1px solid ${i===0?C.accent:C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:i===0?C.accent:C.text3, flexShrink:0 }}>{i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:800 }}>{r.fac}</div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <span style={{ background:C.redDim, color:'#f87171', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>총 {r.count}건</span>
                    {r.urgent>0&&<span style={{ background:'rgba(239,68,68,.2)', color:'#f87171', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>긴급 {r.urgent}</span>}
                    {r.done>0&&<span style={{ background:C.greenDim, color:'#4ade80', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>완료 {r.done}</span>}
                  </div>
                </div>
                <div style={{ padding:'10px 18px 12px', display:'flex', gap:6, flexWrap:'wrap' }}>
                  {Object.entries(r.syms).sort((a,b)=>b[1]-a[1]).map(([sym,cnt])=>(
                    <span key={sym} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, padding:'4px 10px', borderRadius:20, fontSize:11 }}>{sym} <b style={{ color:C.text }}>{cnt}회</b></span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

/* ══════════════════════════════════════
   MAIN APP
══════════════════════════════════════ */
export default function App() {
  const isMobile = useIsMobile()

  // ── 로그인 상태
  const [currentUser, setCurrentUser] = useState(null) // null | { username, name, role, dept }
  const [accounts, setAccounts]       = useState(()=>loadAccounts())
  const [showLogin, setShowLogin]     = useState(false)
  const [showAddAcc, setShowAddAcc]   = useState(false)

  // ── 데이터
  const [requests,   setRequests]   = useState(()=>loadRequests())
  const [users,      setUsers]      = useState(()=>loadUsers())
  const [facilities, setFacilities] = useState(()=>loadFacilities())
  const [symptoms,   setSymptoms]   = useState(()=>loadSymptoms())

  // ── UI
  const [page,        setPage]        = useState('request')
  const [toasts,      setToasts]      = useState([])
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [notifs,      setNotifs]      = useState([
    { id:1, title:'🚨 긴급 의뢰 접수', body:'사출 05호기 - 이상 소음 발생', time:'방금', unread:true },
    { id:2, title:'📋 의뢰 접수', body:'프레스 03호기 - 표시등 오류', time:'30분 전', unread:false },
  ])
  const [showModal,    setShowModal]    = useState(false)
  const [showAddFac,   setShowAddFac]   = useState(false)
  const [showAddUser,  setShowAddUser]  = useState(false)
  const [showSymMgr,   setShowSymMgr]   = useState(false)
  const [detailReq,    setDetailReq]    = useState(null)
  const [filterSt,     setFilterSt]     = useState('all')

  // role shorthand
  const role = currentUser?.role || null // null | 'manager' | 'admin'

  // ── persist
  useEffect(()=>{ saveRequests(requests)   },[requests])
  useEffect(()=>{ saveUsers(users)         },[users])
  useEffect(()=>{ saveFacilities(facilities) },[facilities])
  useEffect(()=>{ saveSymptoms(symptoms)   },[symptoms])
  useEffect(()=>{ saveAccounts(accounts)   },[accounts])

  // ── 페이지 접근 제어 (로그인 없으면 request만)
  useEffect(()=>{
    if(!role && page!=='request') setPage('request')
  },[role])

  // ── helpers
  const toast = (type, title, sub) => {
    const id=Date.now(); setToasts(p=>[...p,{id,type,title,sub}])
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), 3800)
  }

  const submitReq = req => {
    setRequests(p=>[req,...p])
    setNotifs(p=>[{ id:Date.now(), title:req.urgency==='긴급'?'🚨 긴급 의뢰 접수':'📋 의뢰 접수', body:`${req.fac} - ${req.symptoms[0]}`, time:'방금', unread:true },...p])
    toast('success','의뢰 접수 완료',`${req.fac} → 설비관리자에게 전달됨`)
  }

  const changeStatus = (id, status) => {
    setRequests(p=>p.map(r=>r.id===id?{...r,status}:r))
    const r=requests.find(x=>x.id===id)
    if(r){ setDetailReq({...r,status}); toast('success','상태 변경',`${r.fac} → ${status}`) }
  }

  const addFacility   = f => { setFacilities(p=>[...p,f]); toast('success','설비 추가',`${f.name} 추가됨`) }
  const deleteFacility = id => {
    const f=facilities.find(x=>x.id===id)
    if(window.confirm(`${f?.name}을(를) 삭제하시겠습니까?`)){ setFacilities(p=>p.filter(x=>x.id!==id)); toast('success','삭제 완료',`${f?.name} 삭제됨`) }
  }
  const addUser   = u => { setUsers(p=>[...p,u]); toast('success','사용자 추가',`${u.name} 추가됨`) }
  const deleteUser = id => {
    const u=users.find(x=>x.id===id)
    if(u?.name===currentUser?.name){ toast('error','삭제 불가','본인 계정은 삭제할 수 없습니다'); return }
    if(window.confirm(`${u?.name}을(를) 삭제하시겠습니까?`)){ setUsers(p=>p.filter(x=>x.id!==id)); toast('success','삭제 완료',`${u?.name} 삭제됨`) }
  }
  const addAccount = acc => { setAccounts(p=>[...p,acc]); toast('success','계정 추가',`${acc.name}(${acc.username}) 계정 생성됨`) }

  const handleLogin = acc => { setCurrentUser(acc); setShowLogin(false); toast('success',`환영합니다, ${acc.name}님`,acc.role==='admin'?'관리자로 로그인됨':'설비관리자로 로그인됨') }
  const handleLogout = () => { setCurrentUser(null); setPage('request'); toast('success','로그아웃','로그아웃 되었습니다') }

  // ── 파생값
  const filtered    = filterSt==='all' ? requests : requests.filter(r=>r.status===filterSt)
  const urgentCnt   = requests.filter(r=>r.urgency==='긴급'&&r.status!=='완료').length
  const progressCnt = requests.filter(r=>r.status==='처리중').length
  const doneCnt     = requests.filter(r=>r.status==='완료').length
  const pendingCnt  = requests.filter(r=>r.status==='대기').length
  const unreadCnt   = notifs.filter(n=>n.unread).length

  // ── 공통 컴포넌트
  const NotifPanel = () => (
    <>
      <div onClick={()=>setNotifOpen(false)} style={{ position:'fixed', inset:0, zIndex:149 }} />
      <div style={{ position:'fixed', top:isMobile?70:64, right:isMobile?12:16, width:isMobile?'calc(100% - 24px)':340, maxWidth:340, background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, zIndex:150, boxShadow:'0 16px 48px rgba(0,0,0,.6)', animation:'popUp .2s ease' }}>
        <div style={{ padding:'13px 15px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:13, fontWeight:700 }}>알림 {unreadCnt>0&&<span style={{ background:'#dc2626', color:'#fff', borderRadius:10, fontSize:10, padding:'2px 6px', marginLeft:6 }}>{unreadCnt}</span>}</div>
          <div onClick={()=>setNotifs(p=>p.map(n=>({...n,unread:false})))} style={{ fontSize:11, color:C.accent, cursor:'pointer' }}>모두 읽음</div>
        </div>
        {notifs.map(n=>(
          <div key={n.id} onClick={()=>setNotifs(p=>p.map(x=>x.id===n.id?{...x,unread:false}:x))} style={{ padding:'11px 15px', borderBottom:`1px solid rgba(26,46,72,.4)`, background:n.unread?'rgba(249,115,22,.03)':'transparent', cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:2 }}>
              <div style={{ fontSize:12, fontWeight:600 }}>{n.title}</div>
              <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}><span style={{ fontSize:10, color:C.text3 }}>{n.time}</span>{n.unread&&<div style={{ width:6, height:6, background:C.accent, borderRadius:'50%' }} />}</div>
            </div>
            <div style={{ fontSize:11, color:C.text3 }}>{n.body}</div>
          </div>
        ))}
      </div>
    </>
  )

  // ── 상단 로그인 버튼 / 유저 표시
  const LoginBtn = () => currentUser ? (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{currentUser.name}</div>
        <div style={{ fontSize:10, color:currentUser.role==='admin'?C.accent:'#60a5fa' }}>{currentUser.role==='admin'?'관리자':'설비관리자'}</div>
      </div>
      <button onClick={handleLogout} style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:11, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", whiteSpace:'nowrap' }}>로그아웃</button>
    </div>
  ) : (
    <button onClick={()=>setShowLogin(true)} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:600, whiteSpace:'nowrap' }}>🔑 로그인</button>
  )

  /* ────────── 모바일 레이아웃 ────────── */
  if (isMobile) {
    const NAV = [
      { key:'request',   icon:'📋', label:'의뢰', badge:pendingCnt },
      ...(can.viewDashboard(role) ? [{ key:'dashboard', icon:'▦', label:'현황', badge:0 }] : []),
      { key:'facilities', icon:'⚙', label:'설비', badge:0 },
      { key:'history',   icon:'📊', label:'이력', badge:0 },
      ...(can.manageUsers(role) ? [{ key:'admin', icon:'👥', label:'관리', badge:0 }] : []),
    ]
    return (
      <>
        <style>{CSS}</style>
        <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
          {/* 헤더 */}
          <div style={{ padding:'12px 16px', background:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:900, lineHeight:1.1 }}>설비수리 의뢰</div>
              <div style={{ fontSize:10, color:C.text4, ...mono }}>FMS v2.0</div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div onClick={()=>setNotifOpen(v=>!v)} style={{ position:'relative', background:C.surface2, border:`1px solid ${C.border}`, width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:15 }}>
                🔔{unreadCnt>0&&<div style={{ position:'absolute', top:6, right:6, width:7, height:7, background:'#dc2626', borderRadius:'50%', border:`2px solid ${C.surface}` }} />}
              </div>
              <LoginBtn />
            </div>
          </div>

          {/* 콘텐츠 */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {page==='request'&&(
              <div style={{ padding:16, animation:'fadeUp .3s ease' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{can.viewAllReqs(role)?'전체 의뢰':'수리 의뢰'}</div>
                  <div style={{ display:'flex', gap:6, overflowX:'auto' }}>
                    {['all','대기','처리중','완료'].map(f=>(
                      <button key={f} onClick={()=>setFilterSt(f)} style={{ padding:'5px 12px', borderRadius:20, fontSize:11, border:filterSt===f?'none':`1px solid ${C.border}`, background:filterSt===f?C.accent:'transparent', color:filterSt===f?'#fff':C.text3, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:filterSt===f?700:400, flexShrink:0 }}>
                        {f==='all'?'전체':f}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {filtered.map(r=>(
                    <div key={r.id} onClick={()=>setDetailReq(r)} style={{ background:C.surface, border:`1px solid ${r.urgency==='긴급'&&r.status!=='완료'?'rgba(239,68,68,.3)':C.border}`, borderRadius:12, padding:14, cursor:'pointer' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                        <div><div style={{ fontSize:14, fontWeight:800 }}>{r.fac}</div><div style={{ fontSize:11, color:C.text3, marginTop:2, ...mono }}>{r.id} · {r.date} {r.time}</div></div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}><UrgTag u={r.urgency} /><StatusBadge s={r.status} /></div>
                      </div>
                      <div style={{ fontSize:12, color:C.text2, marginBottom:6 }}>{r.symptoms.join(' · ')}</div>
                      <div style={{ fontSize:11, color:C.text3 }}>{r.requester}</div>
                    </div>
                  ))}
                  {filtered.length===0&&<div style={{ textAlign:'center', padding:32, color:C.text3, fontSize:13 }}>해당 의뢰가 없습니다</div>}
                </div>
              </div>
            )}
            {page==='dashboard'&&can.viewDashboard(role)&&(
              <div style={{ padding:16, animation:'fadeUp .3s ease' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                  {[{label:'긴급 대기',val:urgentCnt,col:'#f87171',bar:'#ef4444'},{label:'처리 중',val:progressCnt,col:'#facc15',bar:'#eab308'},{label:'금일 완료',val:doneCnt,col:'#4ade80',bar:'#22c55e'},{label:'전체 설비',val:facilities.length,col:'#60a5fa',bar:'#3b82f6'}].map(s=>(
                    <div key={s.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14, position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:s.bar }} />
                      <div style={{ fontSize:10, color:C.text3, fontWeight:600, marginBottom:8 }}>{s.label}</div>
                      <div style={{ fontSize:28, fontWeight:900, color:s.col, lineHeight:1, ...mono }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {page==='facilities'&&(
              <div style={{ padding:16, animation:'fadeUp .3s ease' }}>
                {can.addFacility(role)&&(
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
                    <button onClick={()=>setShowAddFac(true)} style={{ padding:'7px 13px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:12, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>+ 설비 추가</button>
                  </div>
                )}
                {FACILITY_GROUPS.map(group=>{
                  const gf=facilities.filter(f=>f.group===group); if(!gf.length) return null
                  return (
                    <div key={group} style={{ marginBottom:24 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                        <div style={{ width:3, height:14, background:C.accent, borderRadius:2 }} />
                        <div style={{ fontSize:12, fontWeight:700, color:C.text2 }}>{group}</div>
                        <span style={{ fontSize:11, color:C.text3 }}>({gf.length})</span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        {gf.map(f=>{
                          const repCnt=requests.filter(r=>r.facId===f.id&&r.status!=='완료').length
                          return (
                            <div key={f.id} style={{ background:C.surface, border:`1px solid ${f.status==='수리중'?'rgba(239,68,68,.3)':f.status==='점검중'?'rgba(234,179,8,.3)':C.border}`, borderRadius:10, padding:'12px', position:'relative' }}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                                <div style={{ fontSize:12, fontWeight:800, flex:1, marginRight:4 }}>{f.name}</div>
                                {repCnt>0&&<span style={{ background:C.redDim, color:'#f87171', fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:8, flexShrink:0 }}>{repCnt}건</span>}
                              </div>
                              <FacBadge s={f.status} />
                              {can.deleteFacility(role)&&<button onClick={()=>deleteFacility(f.id)} style={{ position:'absolute', top:6, right:6, width:20, height:20, borderRadius:5, border:`1px solid rgba(239,68,68,.3)`, background:C.redDim, color:'#f87171', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {page==='history'&&(
              <div style={{ padding:16, animation:'fadeUp .3s ease' }}>
                {can.viewHistory(role)
                  ? <HistoryPage requests={requests} facilities={facilities} />
                  : <div style={{ textAlign:'center', padding:60 }}><div style={{ fontSize:40, marginBottom:12 }}>🔒</div><div style={{ fontSize:14, color:C.text3 }}>로그인이 필요한 기능입니다</div><button onClick={()=>setShowLogin(true)} style={{ marginTop:16, padding:'10px 20px', borderRadius:10, border:'none', background:C.accent, color:'#fff', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>로그인</button></div>}
              </div>
            )}
            {page==='admin'&&can.manageUsers(role)&&(
              <div style={{ padding:16, animation:'fadeUp .3s ease' }}>
                <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                  <button onClick={()=>setShowAddUser(true)} style={{ padding:'7px 13px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:12, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>+ 사용자</button>
                  <button onClick={()=>setShowAddAcc(true)} style={{ padding:'7px 13px', borderRadius:8, border:`1px solid ${C.blue}`, background:C.blueDim, color:'#60a5fa', fontSize:12, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>+ 계정</button>
                  {can.editSymptoms(role)&&<button onClick={()=>setShowSymMgr(true)} style={{ padding:'7px 13px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:12, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>📋 증상 관리</button>}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {users.map((u,i)=>(
                    <div key={u.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                        <div><div style={{ fontSize:14, fontWeight:700 }}>{u.name} {u.name===currentUser?.name&&<span style={{ fontSize:10, color:C.accent }}>나</span>}</div><div style={{ fontSize:11, color:C.text3, marginTop:2 }}>{u.dept}</div></div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <RoleBadge r={u.role} />
                          {u.name!==currentUser?.name&&<button onClick={()=>deleteUser(u.id)} style={{ background:C.redDim, border:`1px solid rgba(239,68,68,.3)`, color:'#f87171', width:26, height:26, borderRadius:6, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:16 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:C.text2 }}><Toggle on={u.notif} onChange={()=>setUsers(p=>p.map((x,j)=>j===i?{...x,notif:!x.notif}:x))} />알림</div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:C.text2 }}><Toggle on={u.active} onChange={()=>setUsers(p=>p.map((x,j)=>j===i?{...x,active:!x.active}:x))} />활성</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FAB */}
          <button onClick={()=>setShowModal(true)} style={{ position:'fixed', bottom:'calc(72px + env(safe-area-inset-bottom, 0px))', right:16, width:56, height:56, borderRadius:'50%', background:C.accent, border:'none', color:'#fff', fontSize:28, cursor:'pointer', boxShadow:'0 8px 28px rgba(249,115,22,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>+</button>

          {/* 탭바 */}
          <div style={{ background:C.surface, borderTop:`1px solid ${C.border}`, display:'flex', flexShrink:0, paddingBottom:'env(safe-area-inset-bottom, 0px)' }}>
            {NAV.map(item=>(
              <div key={item.key} onClick={()=>setPage(item.key)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px 0', cursor:'pointer', position:'relative' }}>
                <div style={{ fontSize:20, marginBottom:2, opacity:page===item.key?1:0.35 }}>{item.icon}</div>
                <div style={{ fontSize:10, fontWeight:600, color:page===item.key?C.accent:C.text3 }}>{item.label}</div>
                {item.badge>0&&<div style={{ position:'absolute', top:8, right:'50%', transform:'translateX(8px)', background:'#dc2626', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:8, ...mono }}>{item.badge}</div>}
                {page===item.key&&<div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:20, height:2, background:C.accent, borderRadius:'0 0 2px 2px' }} />}
              </div>
            ))}
          </div>
        </div>

        {notifOpen&&<NotifPanel />}
        {showLogin&&<LoginModal accounts={accounts} onLogin={handleLogin} onClose={()=>setShowLogin(false)} />}
        {showAddAcc&&can.addAccount(role)&&<AddAccountModal onClose={()=>setShowAddAcc(false)} onAdd={addAccount} />}
        {showModal&&<RequestModal onClose={()=>setShowModal(false)} onSubmit={submitReq} symptoms={symptoms} isMobile={true} facilities={facilities} />}
        {showAddFac&&<AddFacModal onClose={()=>setShowAddFac(false)} onAdd={addFacility} />}
        {showAddUser&&can.manageUsers(role)&&<AddUserModal onClose={()=>setShowAddUser(false)} onAdd={addUser} />}
        {showSymMgr&&can.editSymptoms(role)&&<SymptomManager symptoms={symptoms} onSave={setSymptoms} onClose={()=>setShowSymMgr(false)} />}
        {detailReq&&<DetailPanel req={detailReq} role={role} onClose={()=>setDetailReq(null)} onStatusChange={changeStatus} isMobile={true} />}
        <Toasts list={toasts} />
      </>
    )
  }

  /* ────────── 데스크탑 레이아웃 ────────── */
  const TH = { padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:C.text3, letterSpacing:'0.06em', textTransform:'uppercase', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap', background:'rgba(255,255,255,.01)' }
  const TD = { padding:'12px 16px', fontSize:13, borderBottom:`1px solid rgba(26,46,72,.5)` }
  const card = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', marginBottom:24 }

  const DESK_NAV = [
    { key:'request',    icon:'≡', label:'수리 의뢰',   badge:pendingCnt },
    ...(can.viewDashboard(role) ? [{ key:'dashboard', icon:'▦', label:'대시보드', badge:0 }] : []),
    { key:'facilities', icon:'◫', label:'설비 목록',   badge:0 },
    { key:'history',    icon:'📊', label:'고장 이력',  badge:0 },
    ...(can.manageUsers(role) ? [{ key:'admin', icon:'◎', label:'사용자 관리', badge:0 }] : []),
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
        {/* 사이드바 */}
        <div style={{ width:236, background:C.bg, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'18px 16px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ width:40, height:40, background:'linear-gradient(135deg,#f97316,#dc2626)', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10, fontSize:20 }}>⚙</div>
            <div style={{ fontSize:13, fontWeight:900 }}>설비수리 의뢰시스템</div>
            <div style={{ fontSize:10, color:C.text4, marginTop:3, ...mono }}>FMS v2.0</div>
          </div>
          <nav style={{ padding:'12px 8px', flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.text4, padding:'6px 12px 4px', letterSpacing:'0.1em', textTransform:'uppercase' }}>메뉴</div>
            {DESK_NAV.map(item=>(
              <div key={item.key} onClick={()=>setPage(item.key)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, cursor:'pointer', marginBottom:2, fontSize:13, color:page===item.key?C.accent:C.text3, background:page===item.key?C.accentDim:'transparent', fontWeight:page===item.key?600:400, transition:'all .15s' }}
                onMouseEnter={e=>{ if(page!==item.key) e.currentTarget.style.color=C.text2 }}
                onMouseLeave={e=>{ if(page!==item.key) e.currentTarget.style.color=C.text3 }}>
                <span style={{ fontSize:17 }}>{item.icon}</span>{item.label}
                {item.badge>0&&<span style={{ marginLeft:'auto', background:'#dc2626', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:10, ...mono }}>{item.badge}</span>}
              </div>
            ))}
          </nav>
          {/* 사용자 카드 */}
          <div style={{ margin:8, padding:'12px 14px', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10 }}>
            {currentUser ? <>
              <div style={{ fontSize:10, color:currentUser.role==='admin'?C.accent:'#60a5fa', fontWeight:700, letterSpacing:'0.08em', marginBottom:4 }}>{currentUser.role==='admin'?'ADMIN':'MANAGER'}</div>
              <div style={{ fontSize:13, fontWeight:600 }}>{currentUser.name}</div>
              <div style={{ fontSize:11, color:C.text3, marginTop:2 }}>{currentUser.dept}</div>
            </> : <>
              <div style={{ fontSize:11, color:C.text3, marginBottom:8 }}>로그인하면 더 많은 기능을 사용할 수 있습니다</div>
              <button onClick={()=>setShowLogin(true)} style={{ width:'100%', padding:'8px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:12, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>🔑 로그인</button>
            </>}
          </div>
        </div>

        {/* 메인 */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* 탑바 */}
          <div style={{ padding:'14px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:C.bg, flexShrink:0 }}>
            <div style={{ fontSize:18, fontWeight:900 }}>{{ request:'수리 의뢰', dashboard:'대시보드', facilities:'설비 목록', history:'고장 이력', admin:'사용자 관리' }[page]||page}</div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              {can.editSymptoms(role)&&page==='request'&&<button onClick={()=>setShowSymMgr(true)} style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:12, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>📋 증상 관리</button>}
              <button onClick={()=>setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>+ 수리 의뢰</button>
              <div onClick={()=>setNotifOpen(v=>!v)} style={{ position:'relative', background:C.surface2, border:`1px solid ${C.border}`, width:38, height:38, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16 }}>
                🔔{unreadCnt>0&&<div style={{ position:'absolute', top:7, right:7, width:8, height:8, background:'#dc2626', borderRadius:'50%', border:`2px solid ${C.bg}` }} />}
              </div>
              <LoginBtn />
            </div>
          </div>

          {/* 콘텐츠 */}
          <div style={{ flex:1, overflowY:'auto' }}>

            {/* 수리 의뢰 */}
            {page==='request'&&(
              <div style={{ padding:24, animation:'fadeUp .3s ease' }}>
                <div style={card}>
                  <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>{can.viewAllReqs(role)?'전체 수리 의뢰':'수리 의뢰 목록'}</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {['all','대기','처리중','완료'].map(f=>(
                        <button key={f} onClick={()=>setFilterSt(f)} style={{ padding:'5px 12px', borderRadius:20, fontSize:11, border:filterSt===f?'none':`1px solid ${C.border}`, background:filterSt===f?C.accent:'transparent', color:filterSt===f?'#fff':C.text3, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:filterSt===f?700:400 }}>
                          {f==='all'?'전체':f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead><tr>{['의뢰번호','설비명','증상','긴급도','의뢰자','날짜','상태'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                      <tbody>
                        {filtered.map(r=>(
                          <tr key={r.id} onClick={()=>setDetailReq(r)} style={{ cursor:'pointer' }}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.025)'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <td style={{...TD,...mono,fontSize:11,color:C.text3}}>{r.id}</td>
                            <td style={{...TD,fontWeight:700}}>{r.fac}</td>
                            <td style={{...TD,fontSize:12,color:C.text2,maxWidth:200}}><div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.symptoms.join(', ')}</div></td>
                            <td style={TD}><UrgTag u={r.urgency} /></td>
                            <td style={{...TD,fontSize:12,color:C.text3}}>{r.requester}</td>
                            <td style={{...TD,...mono,fontSize:11,color:C.text3}}>{r.date} {r.time}</td>
                            <td style={TD}><StatusBadge s={r.status} /></td>
                          </tr>
                        ))}
                        {filtered.length===0&&<tr><td colSpan={7} style={{ padding:32, textAlign:'center', color:C.text3, fontSize:13 }}>해당하는 의뢰가 없습니다</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 대시보드 */}
            {page==='dashboard'&&can.viewDashboard(role)&&(
              <div style={{ padding:24, animation:'fadeUp .3s ease' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
                  {[{label:'긴급 처리 대기',val:urgentCnt,col:'#f87171',bar:'#ef4444',icon:'⚠'},{label:'처리 중',val:progressCnt,col:'#facc15',bar:'#eab308',icon:'⟳'},{label:'금일 완료',val:doneCnt,col:'#4ade80',bar:'#22c55e',icon:'✓'},{label:'전체 설비',val:facilities.length,col:'#60a5fa',bar:'#3b82f6',icon:'◫'}].map(s=>(
                    <div key={s.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:'16px 20px', position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:s.bar }} />
                      <div style={{ fontSize:11, color:C.text3, fontWeight:600, marginBottom:10 }}>{s.label}</div>
                      <div style={{ fontSize:34, fontWeight:900, color:s.col, lineHeight:1, ...mono }}>{s.val}</div>
                      <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:48, opacity:.05, color:s.bar }}>{s.icon}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 설비 목록 */}
            {page==='facilities'&&(
              <div style={{ padding:24, animation:'fadeUp .3s ease' }}>
                {can.addFacility(role)&&(
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
                    <button onClick={()=>setShowAddFac(true)} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>+ 설비 추가</button>
                  </div>
                )}
                {FACILITY_GROUPS.map(group=>{
                  const gf=facilities.filter(f=>f.group===group); if(!gf.length) return null
                  return (
                    <div key={group} style={{ marginBottom:32 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                        <div style={{ width:3, height:18, background:C.accent, borderRadius:2 }} />
                        <div style={{ fontSize:13, fontWeight:700, color:C.text2, letterSpacing:'0.06em', textTransform:'uppercase' }}>{group}</div>
                        <span style={{ fontSize:12, color:C.text3 }}>({gf.length}대)</span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                        {gf.map(f=>{
                          const repCnt=requests.filter(r=>r.facId===f.id&&r.status!=='완료').length
                          return (
                            <div key={f.id} style={{ background:C.surface, border:`1px solid ${f.status==='수리중'?'rgba(239,68,68,.3)':f.status==='점검중'?'rgba(234,179,8,.3)':C.border}`, borderRadius:12, padding:'14px 16px', transition:'transform .15s', position:'relative' }}
                              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                                <div style={{ fontSize:13, fontWeight:800, flex:1, marginRight:6 }}>{f.name}</div>
                                {repCnt>0&&<span style={{ background:C.redDim, color:'#f87171', fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:8, flexShrink:0 }}>{repCnt}건</span>}
                              </div>
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                <FacBadge s={f.status} /><span style={{ fontSize:10, color:C.text4, ...mono }}>{f.lastCheck}</span>
                              </div>
                              {can.deleteFacility(role)&&<button onClick={()=>deleteFacility(f.id)} style={{ position:'absolute', top:8, right:8, width:22, height:22, borderRadius:6, border:`1px solid rgba(239,68,68,.3)`, background:C.redDim, color:'#f87171', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 고장 이력 */}
            {page==='history'&&(
              <div style={{ padding:24, animation:'fadeUp .3s ease' }}>
                {can.viewHistory(role)
                  ? <HistoryPage requests={requests} facilities={facilities} />
                  : <div style={{ textAlign:'center', padding:80 }}><div style={{ fontSize:60, marginBottom:16 }}>🔒</div><div style={{ fontSize:16, color:C.text3, marginBottom:8 }}>로그인이 필요한 기능입니다</div><button onClick={()=>setShowLogin(true)} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:C.accent, color:'#fff', fontSize:14, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>로그인하기</button></div>}
              </div>
            )}

            {/* 사용자 관리 */}
            {page==='admin'&&can.manageUsers(role)&&(
              <div style={{ padding:24, animation:'fadeUp .3s ease' }}>
                {/* 계정 목록 */}
                <div style={{ ...card, marginBottom:20 }}>
                  <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>로그인 계정 <span style={{ fontSize:12, color:C.text3, fontWeight:400 }}>({accounts.length}개)</span></div>
                    {can.addAccount(role)&&<button onClick={()=>setShowAddAcc(true)} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'rgba(59,130,246,.2)', color:'#60a5fa', fontSize:12, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>+ 계정 추가</button>}
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr>{['아이디','이름','부서','권한',''].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {accounts.map((a,i)=>(
                        <tr key={a.id}>
                          <td style={{...TD,...mono,fontSize:12}}>{a.username}</td>
                          <td style={{...TD,fontWeight:600}}>{a.name}</td>
                          <td style={{...TD,fontSize:12,color:C.text3}}>{a.dept}</td>
                          <td style={TD}><span style={{ background:a.role==='admin'?C.redDim:C.blueDim, color:a.role==='admin'?'#f87171':'#60a5fa', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{a.role==='admin'?'관리자':'설비관리자'}</span></td>
                          <td style={TD}>{a.username!=='EUNSEOK'&&<button onClick={()=>{ if(window.confirm(`${a.name} 계정을 삭제하시겠습니까?`)){setAccounts(p=>p.filter(x=>x.id!==a.id));toast('success','계정 삭제',`${a.name} 계정 삭제됨`)}}} style={{ padding:'4px 12px', borderRadius:6, border:`1px solid rgba(239,68,68,.3)`, background:C.redDim, color:'#f87171', fontSize:11, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>삭제</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* 사용자 목록 */}
                <div style={card}>
                  <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>사용자 목록 <span style={{ fontSize:12, color:C.text3, fontWeight:400 }}>({users.length}명)</span></div>
                    <button onClick={()=>setShowAddUser(true)} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:12, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>+ 사용자 추가</button>
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr>{['이름','부서','역할','알림','활성','삭제'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {users.map((u,i)=>(
                        <tr key={u.id}>
                          <td style={{...TD,fontWeight:600}}>{u.name}{u.name===currentUser?.name&&<span style={{ fontSize:10, background:C.accentDim, color:C.accent, padding:'2px 6px', borderRadius:10, fontWeight:700, marginLeft:6 }}>나</span>}</td>
                          <td style={{...TD,fontSize:12,color:C.text3}}>{u.dept}</td>
                          <td style={TD}><RoleBadge r={u.role} /></td>
                          <td style={TD}><Toggle on={u.notif} onChange={()=>setUsers(p=>p.map((x,j)=>j===i?{...x,notif:!x.notif}:x))} /></td>
                          <td style={TD}><Toggle on={u.active} onChange={()=>setUsers(p=>p.map((x,j)=>j===i?{...x,active:!x.active}:x))} /></td>
                          <td style={TD}>{u.name!==currentUser?.name&&<button onClick={()=>deleteUser(u.id)} style={{ padding:'4px 12px', borderRadius:6, border:`1px solid rgba(239,68,68,.3)`, background:C.redDim, color:'#f87171', fontSize:11, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>삭제</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {notifOpen&&<NotifPanel />}
      {showLogin&&<LoginModal accounts={accounts} onLogin={handleLogin} onClose={()=>setShowLogin(false)} />}
      {showAddAcc&&can.addAccount(role)&&<AddAccountModal onClose={()=>setShowAddAcc(false)} onAdd={addAccount} />}
      {showModal&&<RequestModal onClose={()=>setShowModal(false)} onSubmit={submitReq} symptoms={symptoms} isMobile={false} facilities={facilities} />}
      {showAddFac&&<AddFacModal onClose={()=>setShowAddFac(false)} onAdd={addFacility} />}
      {showAddUser&&can.manageUsers(role)&&<AddUserModal onClose={()=>setShowAddUser(false)} onAdd={addUser} />}
      {showSymMgr&&can.editSymptoms(role)&&<SymptomManager symptoms={symptoms} onSave={setSymptoms} onClose={()=>setShowSymMgr(false)} />}
      {detailReq&&<DetailPanel req={detailReq} role={role} onClose={()=>setDetailReq(null)} onStatusChange={changeStatus} isMobile={false} />}
      <Toasts list={toasts} />
    </>
  )
}
