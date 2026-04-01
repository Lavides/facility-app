// src/App.jsx  ── 모바일 퍼스트 반응형 설비 수리 의뢰 시스템
import { useState, useEffect, useRef } from 'react'
import { FACILITIES, SYMPTOMS, ROLES, INITIAL_USERS, loadRequests, saveRequests } from './data.js'

/* ─────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  html, body, #root { height: 100%; background: #070e1a; color: #e2e8f0; font-family: 'Noto Sans KR', sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e3050; border-radius: 4px; }
  select option, optgroup { background: #0f1e33; }
  input, textarea, select, button { -webkit-appearance: none; appearance: none; }
  button { touch-action: manipulation; }
  @keyframes fadeUp    { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideInR  { from { transform:translateX(100%); } to { transform:translateX(0); } }
  @keyframes slideInUp { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
  @keyframes popUp     { from { opacity:0; transform:translateY(18px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes toastIn   { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:translateX(0); } }
  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:.25} }
`

const C = {
  bg:'#070e1a', surface:'#0d1829', surface2:'#122035', surface3:'#162640',
  border:'#1a2e48', border2:'#1e3555',
  accent:'#f97316', accentDim:'rgba(249,115,22,.12)',
  red:'#ef4444', redDim:'rgba(239,68,68,.12)',
  blue:'#3b82f6', blueDim:'rgba(59,130,246,.12)',
  green:'#22c55e', greenDim:'rgba(34,197,94,.12)',
  yellow:'#eab308', yellowDim:'rgba(234,179,8,.12)',
  text:'#e2e8f0', text2:'#94a3b8', text3:'#475569', text4:'#2a3f5a',
}
const mono = { fontFamily:"'JetBrains Mono', monospace" }

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
function uid() { return 'REQ-' + String(Date.now()).slice(-6) }

/* ── 배지 컴포넌트들 ── */
function StatusBadge({ s }) {
  const map = { '대기':[C.yellow,C.yellowDim], '처리중':[C.blue,C.blueDim], '완료':[C.green,C.greenDim] }
  const [col,bg] = map[s]||[C.text2,'rgba(148,163,184,.08)']
  return <span style={{ background:bg, color:col, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}><span style={{ width:5, height:5, borderRadius:'50%', background:col, flexShrink:0 }} />{s}</span>
}
function UrgTag({ u }) {
  return <span style={{ fontSize:11, fontWeight:700, color:u==='긴급'?'#f87171':C.text3, ...mono, whiteSpace:'nowrap' }}>{u==='긴급'?'🚨':'📋'} {u}</span>
}
function FacBadge({ s }) {
  const map = { '정상':[C.greenDim,'#4ade80'], '수리중':[C.redDim,'#f87171'], '점검중':[C.yellowDim,'#facc15'] }
  const [bg,col] = map[s]||['rgba(148,163,184,.08)',C.text2]
  return <span style={{ background:bg, color:col, padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:700 }}>{s}</span>
}
function RoleBadge({ r }) {
  const map = { '관리자':[C.redDim,'#f87171'], '설비관리자':[C.blueDim,'#60a5fa'], '작업자':['rgba(148,163,184,.08)',C.text2] }
  const [bg,col] = map[r]||map['작업자']
  return <span style={{ background:bg, color:col, padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:700 }}>{r}</span>
}
function Toggle({ on, onChange }) {
  return (
    <div onClick={onChange} style={{ width:40, height:22, borderRadius:11, background:on?C.green:C.border, position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, left:on?21:3, width:16, height:16, background:'#fff', borderRadius:'50%', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.3)' }} />
    </div>
  )
}

/* ── 토스트 ── */
function Toasts({ list }) {
  return (
    <div style={{ position:'fixed', bottom:80, right:16, zIndex:9999, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
      {list.map(t=>(
        <div key={t.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:'11px 14px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 12px 40px rgba(0,0,0,.6)', animation:'toastIn .3s ease', minWidth:240, maxWidth:300 }}>
          <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:12, fontWeight:700, background:t.type==='success'?'rgba(34,197,94,.18)':t.type==='error'?'rgba(239,68,68,.18)':'rgba(234,179,8,.18)', color:t.type==='success'?'#4ade80':t.type==='error'?'#f87171':'#facc15' }}>
            {t.type==='success'?'✓':t.type==='error'?'✕':'!'}
          </div>
          <div><div style={{ fontSize:12, fontWeight:700 }}>{t.title}</div><div style={{ fontSize:11, color:C.text3, marginTop:1 }}>{t.sub}</div></div>
        </div>
      ))}
    </div>
  )
}

/* ── AI 모달 ── */
function AIModal({ req, onClose, isMobile }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  const SYS = `당신은 공장 사출 성형기 수리 전문 AI입니다. 설비 오작동 원인 분석, 즉시 조치법, 부품 교체 주기를 안내합니다.\n현재 의뢰: 설비=${req.fac}, 증상=${req.symptoms.join(', ')}, 긴급도=${req.urgency}, 메모=${req.memo||'없음'}\n한국어로 답변. 핵심만 간결하게.`

  useEffect(()=>{
    (async()=>{
      setLoading(true)
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:800, system:SYS, messages:[{ role:'user', content:`${req.fac}에서 "${req.symptoms.join(', ')}" 증상 발생. 원인과 즉시 조치법 알려주세요.` }] }) })
        const d = await res.json()
        setMsgs([{ role:'assistant', content:d.content?.[0]?.text||'응답 없음' }])
      } catch { setMsgs([{ role:'assistant', content:'AI 연결 실패. 잠시 후 다시 시도해주세요.' }]) }
      setLoading(false)
    })()
  },[])

  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:'smooth' }) },[msgs,loading])

  const send = async()=>{
    if(!input.trim()||loading) return
    const q=input.trim(); setInput('')
    const next=[...msgs,{role:'user',content:q}]
    setMsgs(next); setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:800, system:SYS, messages:next }) })
      const d = await res.json()
      setMsgs(p=>[...p,{ role:'assistant', content:d.content?.[0]?.text||'응답 없음' }])
    } catch { setMsgs(p=>[...p,{ role:'assistant', content:'오류가 발생했습니다.' }]) }
    setLoading(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', backdropFilter:'blur(6px)', zIndex:500, display:'flex', alignItems:isMobile?'flex-end':'center', justifyContent:'center' }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ background:C.surface, borderRadius:isMobile?'20px 20px 0 0':20, border:isMobile?'none':`1px solid ${C.border}`, width:isMobile?'100%':560, maxHeight:isMobile?'92vh':'82vh', display:'flex', flexDirection:'column', animation:isMobile?'slideInUp .25s ease':'popUp .22s ease', boxShadow:'0 32px 80px rgba(0,0,0,.6)' }}>
        {isMobile&&<div style={{ width:36, height:4, borderRadius:2, background:C.border2, margin:'12px auto 0' }} />}
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#f97316,#dc2626)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🤖</div>
            <div><div style={{ fontWeight:700, fontSize:14 }}>AI 설비 분석</div><div style={{ fontSize:11, color:C.text3 }}>{req.fac} · {req.symptoms[0]}</div></div>
          </div>
          <button onClick={onClose} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', display:'flex', flexDirection:'column', gap:10 }}>
          {msgs.map((m,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
              <div style={{ maxWidth:'88%', padding:'10px 13px', fontSize:13, lineHeight:1.75, whiteSpace:'pre-wrap', wordBreak:'break-word', borderRadius:m.role==='user'?'12px 12px 2px 12px':'12px 12px 12px 2px', background:m.role==='user'?'rgba(249,115,22,.15)':C.surface2, border:`1px solid ${m.role==='user'?'rgba(249,115,22,.3)':C.border}`, color:m.role==='user'?'#fdba74':C.text }}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{ display:'flex', gap:5, padding:'10px 13px', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:'12px 12px 12px 2px', width:'fit-content' }}>{[0,.15,.3].map((d,i)=><span key={i} style={{ width:7, height:7, borderRadius:'50%', background:C.accent, display:'inline-block', animation:`blink 1s ${d}s infinite` }} />)}</div>}
          <div ref={endRef} />
        </div>
        <div style={{ padding:'8px 18px', display:'flex', gap:6, flexWrap:'wrap' }}>
          {['부품 교체 주기?','안전 조치 방법','예방 점검 방법'].map(q=>(
            <button key={q} onClick={()=>setInput(q)} style={{ padding:'5px 11px', borderRadius:20, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:11, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>{q}</button>
          ))}
        </div>
        <div style={{ padding:'10px 18px 18px', display:'flex', gap:8 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="질문하세요..." style={{ flex:1, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 13px', color:C.text, fontSize:13, fontFamily:"'Noto Sans KR',sans-serif", outline:'none' }} />
          <button onClick={send} disabled={!input.trim()||loading} style={{ width:44, height:44, borderRadius:10, border:'none', background:input.trim()?C.accent:C.surface2, color:'#fff', cursor:input.trim()?'pointer':'default', fontSize:17, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>➤</button>
        </div>
      </div>
    </div>
  )
}

/* ── 수리 의뢰 모달 ── */
function RequestModal({ onClose, onSubmit, currentUser, isMobile }) {
  const [step, setStep] = useState(1)
  const [facId, setFacId] = useState('')
  const [selSyms, setSelSyms] = useState([])
  const [urgency, setUrgency] = useState('긴급')
  const [memo, setMemo] = useState('')
  const toggleSym = s => setSelSyms(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])
  const canNext = () => step===1?!!facId:step===2?selSyms.length>0:true
  const submit = () => {
    if(!facId||!selSyms.length) return
    const fac = FACILITIES.find(f=>f.id===facId)
    onSubmit({ id:uid(), facId, fac:fac.name, symptoms:selSyms, urgency, requester:currentUser.name, time:nowTime(), status:'대기', memo })
    onClose()
  }
  const inputBase = { width:'100%', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px', color:C.text, fontSize:14, fontFamily:"'Noto Sans KR',sans-serif", outline:'none' }
  const STEPS = ['설비 선택','증상 선택','긴급도','메모 & 확인']

  /* 모바일: 스텝 바텀시트 */
  if (isMobile) return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', backdropFilter:'blur(6px)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:C.surface, borderRadius:'24px 24px 0 0', width:'100%', maxHeight:'96vh', display:'flex', flexDirection:'column', animation:'slideInUp .25s ease' }}>
        <div style={{ width:36, height:4, borderRadius:2, background:C.border2, margin:'12px auto 0', flexShrink:0 }} />
        <div style={{ padding:'14px 20px 10px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:17, fontWeight:800 }}>🔧 수리 의뢰</div>
            <button onClick={onClose} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {STEPS.map((_,i)=><div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<step?C.accent:C.border, transition:'background .3s' }} />)}
          </div>
          <div style={{ fontSize:11, color:C.text3, marginTop:6 }}>STEP {step}/{STEPS.length} · {STEPS[step-1]}</div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'0 20px 16px' }}>
          {step===1&&(
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text2, marginBottom:12 }}>어느 설비에서 문제가 발생했나요?</div>
              {['A라인','B라인','C라인'].map(line=>(
                <div key={line} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.text3, marginBottom:8 }}>{line}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {FACILITIES.filter(f=>f.line===line).map(f=>{
                      const sel=facId===f.id
                      return <div key={f.id} onClick={()=>setFacId(f.id)} style={{ padding:'12px', borderRadius:10, border:`2px solid ${sel?C.accent:C.border}`, background:sel?C.accentDim:C.surface2, cursor:'pointer', transition:'all .15s' }}>
                        <div style={{ fontSize:13, fontWeight:700, color:sel?C.accent:C.text, marginBottom:4 }}>{f.name}</div>
                        <FacBadge s={f.status} />
                      </div>
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {step===2&&(
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text2, marginBottom:12 }}>어떤 증상인가요? <span style={{ color:C.text3, fontWeight:400 }}>(복수 선택)</span></div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {SYMPTOMS.map(s=>{
                  const on=selSyms.includes(s)
                  return <div key={s} onClick={()=>toggleSym(s)} style={{ padding:'14px 16px', borderRadius:12, border:`2px solid ${on?C.accent:C.border}`, background:on?C.accentDim:C.surface2, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .15s' }}>
                    <span style={{ fontSize:14, fontWeight:on?700:400, color:on?C.accent:C.text }}>{s}</span>
                    <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${on?C.accent:C.border}`, background:on?C.accent:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{on&&<span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>}</div>
                  </div>
                })}
              </div>
            </div>
          )}
          {step===3&&(
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text2, marginBottom:16 }}>긴급도를 선택하세요</div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[{key:'긴급',icon:'🚨',title:'긴급',desc:'즉시 조치 필요 — 생산 중단 또는 안전 위험',col:'#f87171',bg:C.redDim,brd:'rgba(239,68,68,.5)'},{key:'일반',icon:'📋',title:'일반',desc:'다음 순서에 처리 가능',col:'#60a5fa',bg:C.blueDim,brd:'rgba(59,130,246,.5)'}].map(opt=>(
                  <div key={opt.key} onClick={()=>setUrgency(opt.key)} style={{ padding:'18px', borderRadius:14, border:`2px solid ${urgency===opt.key?opt.brd:C.border}`, background:urgency===opt.key?opt.bg:C.surface2, cursor:'pointer', transition:'all .15s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                      <span style={{ fontSize:24 }}>{opt.icon}</span>
                      <span style={{ fontSize:16, fontWeight:800, color:urgency===opt.key?opt.col:C.text }}>{opt.title}</span>
                      {urgency===opt.key&&<span style={{ marginLeft:'auto', fontSize:18, color:opt.col }}>✓</span>}
                    </div>
                    <div style={{ fontSize:12, color:C.text3 }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step===4&&(
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text2, marginBottom:8 }}>추가 메모 <span style={{ color:C.text3, fontWeight:400 }}>(선택)</span></div>
              <textarea value={memo} onChange={e=>setMemo(e.target.value)} placeholder="구체적인 증상, 발생 시간 등..." style={{ ...inputBase, resize:'none', height:120, lineHeight:1.65 }} />
              <div style={{ marginTop:16, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:12, padding:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.text3, marginBottom:10 }}>의뢰 요약</div>
                {[['설비',FACILITIES.find(f=>f.id===facId)?.name],['증상',selSyms.join(', ')],['긴급도',urgency]].map(([k,v])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'5px 0', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ color:C.text3 }}>{k}</span><span style={{ fontWeight:600, textAlign:'right', maxWidth:'65%' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'12px 20px', paddingBottom:'calc(12px + env(safe-area-inset-bottom, 0px))', borderTop:`1px solid ${C.border}`, display:'flex', gap:10, flexShrink:0, background:C.surface }}>
          <button onClick={step>1?()=>setStep(s=>s-1):onClose} style={{ flex:1, padding:14, borderRadius:12, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:14, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:600 }}>{step>1?'← 이전':'취소'}</button>
          {step<STEPS.length
            ?<button onClick={()=>canNext()&&setStep(s=>s+1)} style={{ flex:2, padding:14, borderRadius:12, border:'none', background:canNext()?C.accent:'#2a3f5a', color:canNext()?'#fff':C.text3, fontSize:14, cursor:canNext()?'pointer':'default', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>다음 →</button>
            :<button onClick={submit} style={{ flex:2, padding:14, borderRadius:12, border:'none', background:C.accent, color:'#fff', fontSize:14, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>➤ 의뢰 접수</button>
          }
        </div>
      </div>
    </div>
  )

  /* 데스크탑 팝업 */
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', backdropFilter:'blur(6px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, width:520, maxHeight:'92vh', overflowY:'auto', animation:'popUp .22s ease', boxShadow:'0 32px 80px rgba(0,0,0,.6)' }}>
        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontWeight:800, fontSize:16 }}>🔧 수리 의뢰 접수</div>
          <button onClick={onClose} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, width:32, height:32, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        <div style={{ padding:24 }}>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.text2, display:'block', marginBottom:8 }}>설비 선택</label>
            <select value={facId} onChange={e=>setFacId(e.target.value)} style={{ width:'100%', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px', color:facId?C.text:C.text3, fontSize:13, fontFamily:"'Noto Sans KR',sans-serif", outline:'none' }}>
              <option value=''>설비를 선택하세요</option>
              {['A라인','B라인','C라인'].map(line=>(
                <optgroup key={line} label={`── ${line}`}>
                  {FACILITIES.filter(f=>f.line===line).map(f=><option key={f.id} value={f.id}>{f.name}　({f.status})</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.text2, display:'block', marginBottom:8 }}>증상 선택 <span style={{ color:C.text3, fontWeight:400 }}>(복수 가능)</span></label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {SYMPTOMS.map(s=>{ const on=selSyms.includes(s); return <div key={s} onClick={()=>toggleSym(s)} style={{ padding:'9px 12px', borderRadius:8, border:`1px solid ${on?C.accent:C.border}`, background:on?C.accentDim:C.surface2, color:on?C.accent:C.text2, fontSize:12, cursor:'pointer', textAlign:'center', transition:'all .15s', fontWeight:on?700:400 }}>{s}</div> })}
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.text2, display:'block', marginBottom:8 }}>긴급도</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[{key:'긴급',icon:'🚨',desc:'즉시 조치',col:'#f87171',bg:C.redDim,brd:'rgba(239,68,68,.5)'},{key:'일반',icon:'📋',desc:'일정 처리',col:'#60a5fa',bg:C.blueDim,brd:'rgba(59,130,246,.5)'}].map(opt=>(
                <div key={opt.key} onClick={()=>setUrgency(opt.key)} style={{ padding:'12px', borderRadius:10, border:`1px solid ${urgency===opt.key?opt.brd:C.border}`, background:urgency===opt.key?opt.bg:C.surface2, cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:urgency===opt.key?opt.col:C.text2 }}>{opt.icon} {opt.key}</div>
                  <div style={{ fontSize:11, color:C.text3, marginTop:2 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:C.text2, display:'block', marginBottom:8 }}>자유 메모 <span style={{ color:C.text3, fontWeight:400 }}>(선택)</span></label>
            <textarea value={memo} onChange={e=>setMemo(e.target.value)} placeholder="추가 상황을 입력해주세요..." style={{ width:'100%', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px', color:C.text, fontSize:13, fontFamily:"'Noto Sans KR',sans-serif", outline:'none', resize:'vertical', minHeight:80, lineHeight:1.6 }} />
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

/* ── 상세 패널 ── */
function DetailPanel({ req, role, onClose, onStatusChange, onAI, isMobile }) {
  if(!req) return null
  const canChange = role !== 'worker'
  const Row = ({ k, v, node }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 0', borderBottom:`1px solid rgba(26,46,72,.5)`, fontSize:13, gap:12 }}>
      <span style={{ color:C.text3, flexShrink:0 }}>{k}</span>
      <span style={{ fontWeight:500, textAlign:'right', wordBreak:'break-word' }}>{node||v}</span>
    </div>
  )
  const wrapStyle = isMobile
    ? { position:'fixed', inset:0, background:C.surface, zIndex:200, overflowY:'auto', animation:'slideInR .25s ease' }
    : { position:'fixed', top:0, right:0, bottom:0, width:400, background:C.surface, borderLeft:`1px solid ${C.border}`, zIndex:100, overflowY:'auto', animation:'slideInR .25s ease', boxShadow:'-20px 0 60px rgba(0,0,0,.4)' }
  return (
    <div style={wrapStyle}>
      <div style={{ padding:'16px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, background:C.surface, zIndex:1 }}>
        <button onClick={onClose} style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text2, width:36, height:36, borderRadius:10, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
        <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:11, color:C.text3, ...mono }}>{req.id}</div><div style={{ fontSize:15, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{req.fac}</div></div>
        <UrgTag u={req.urgency} />
      </div>
      <div style={{ padding:18 }}>
        <button onClick={()=>onAI(req)} style={{ width:'100%', padding:14, borderRadius:12, border:'1px solid rgba(249,115,22,.3)', background:'rgba(249,115,22,.07)', color:'#fb923c', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:20 }}>🤖 AI 원인 분석</button>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text3, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>의뢰 정보</div>
          <Row k='설비' v={req.fac} /><Row k='증상' v={req.symptoms.join(', ')} /><Row k='의뢰자' v={req.requester} /><Row k='접수' v={req.time} /><Row k='상태' node={<StatusBadge s={req.status} />} />
          {req.memo&&<div style={{ padding:'10px 0', fontSize:13, color:C.text2, lineHeight:1.65 }}><span style={{ color:C.text3, display:'block', marginBottom:4, fontSize:12 }}>메모</span>{req.memo}</div>}
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text3, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>처리 이력</div>
          {[{label:'의뢰 접수',time:req.time,color:C.accent,show:true},{label:'담당자 배정 (이상훈)',time:req.time+' +5분',color:C.blue,show:req.status!=='대기'},{label:'수리 완료',time:req.time+' +45분',color:C.green,show:req.status==='완료'}].filter(i=>i.show).map((item,idx,arr)=>(
            <div key={idx} style={{ display:'flex', gap:12, marginBottom:14 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:item.color, flexShrink:0, marginTop:4 }} />
                {idx<arr.length-1&&<div style={{ width:2, flex:1, background:C.border, marginTop:4, minHeight:20 }} />}
              </div>
              <div style={{ paddingBottom:idx<arr.length-1?14:0 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{item.label}</div>
                <div style={{ fontSize:11, color:C.text3, marginTop:2, ...mono }}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>
        {canChange&&req.status!=='완료'&&(
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.text3, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>상태 변경</div>
            {req.status==='대기'&&<button onClick={()=>onStatusChange(req.id,'처리중')} style={{ width:'100%', padding:13, borderRadius:10, border:`1px solid ${C.blue}`, background:C.blueDim, color:'#60a5fa', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>→ 처리중으로 변경</button>}
            {req.status==='처리중'&&<button onClick={()=>onStatusChange(req.id,'완료')} style={{ width:'100%', padding:13, borderRadius:10, border:`1px solid ${C.green}`, background:C.greenDim, color:'#4ade80', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>✓ 완료 처리</button>}
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
   MAIN APP
────────────────────────────────────────── */
export default function App() {
  const isMobile = useIsMobile()
  const [page, setPage] = useState('dashboard')
  const [roleIdx, setRoleIdx] = useState(0)
  const currentRole = ROLES[roleIdx]
  const [requests, setRequests] = useState(()=>loadRequests())
  const [users, setUsers] = useState(INITIAL_USERS)
  const [toasts, setToasts] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState([
    { id:1, title:'🚨 긴급 의뢰 접수', body:'사출 05호기 - 이상 소음 발생', time:'방금', unread:true },
    { id:2, title:'✅ 수리 완료', body:'사출 21호기 처리 완료', time:'30분 전', unread:true },
    { id:3, title:'📋 담당자 배정', body:'사출 18호기 → 이상훈 배정', time:'1시간 전', unread:false },
  ])
  const [showModal, setShowModal] = useState(false)
  const [detailReq, setDetailReq] = useState(null)
  const [aiReq, setAiReq] = useState(null)
  const [filterSt, setFilterSt] = useState('all')

  useEffect(()=>{ saveRequests(requests) },[requests])

  const toast = (type,title,sub) => {
    const id=Date.now(); setToasts(p=>[...p,{id,type,title,sub}])
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3800)
  }
  const submitReq = req => {
    setRequests(p=>[req,...p])
    setNotifs(p=>[{ id:Date.now(), title:req.urgency==='긴급'?'🚨 긴급 의뢰 접수':'📋 일반 의뢰 접수', body:`${req.fac} - ${req.symptoms[0]}`, time:'방금', unread:true },...p])
    toast('success','의뢰 접수 완료',`${req.fac} → 설비관리자에게 전달됨`)
  }
  const changeStatus = (id,status) => {
    setRequests(p=>p.map(r=>r.id===id?{...r,status}:r))
    const r=requests.find(x=>x.id===id)
    if(r){ setDetailReq({...r,status}); toast('success','상태 변경',`${r.fac} → ${status}`) }
  }

  const filtered    = filterSt==='all'?requests:requests.filter(r=>r.status===filterSt)
  const urgentCnt   = requests.filter(r=>r.urgency==='긴급'&&r.status!=='완료').length
  const progressCnt = requests.filter(r=>r.status==='처리중').length
  const doneCnt     = requests.filter(r=>r.status==='완료').length
  const pendingCnt  = requests.filter(r=>r.status==='대기').length
  const unreadCnt   = notifs.filter(n=>n.unread).length

  /* 알림 패널 공통 */
  const NotifPanel = () => (
    <>
      <div onClick={()=>setNotifOpen(false)} style={{ position:'fixed', inset:0, zIndex:149 }} />
      <div style={{ position:'fixed', top: isMobile?70:64, right:isMobile?12:16, width:isMobile?'calc(100% - 24px)':340, maxWidth:340, background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, zIndex:150, boxShadow:'0 16px 48px rgba(0,0,0,.6)', animation:'popUp .2s ease' }}>
        <div style={{ padding:'13px 15px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:13, fontWeight:700 }}>알림 {unreadCnt>0&&<span style={{ background:'#dc2626', color:'#fff', borderRadius:10, fontSize:10, padding:'2px 6px', marginLeft:6 }}>{unreadCnt}</span>}</div>
          <div onClick={()=>setNotifs(p=>p.map(n=>({...n,unread:false})))} style={{ fontSize:11, color:C.accent, cursor:'pointer' }}>모두 읽음</div>
        </div>
        {notifs.map(n=>(
          <div key={n.id} onClick={()=>{ setNotifs(p=>p.map(x=>x.id===n.id?{...x,unread:false}:x)); setNotifOpen(false); }} style={{ padding:'11px 15px', borderBottom:`1px solid rgba(26,46,72,.4)`, background:n.unread?'rgba(249,115,22,.03)':'transparent', cursor:'pointer' }}>
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

  /* ───── 모바일 레이아웃 ───── */
  if (isMobile) {
    const NAV = [
      { key:'dashboard',  icon:'▦', label:'홈' },
      { key:'request',    icon:'≡', label:'의뢰', badge:pendingCnt },
      { key:'facilities', icon:'◫', label:'설비' },
      { key:'admin',      icon:'◎', label:'관리' },
    ]
    const titles = { dashboard:'대시보드', request:'수리 의뢰', facilities:'설비 목록', admin:'관리' }

    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:C.bg }}>

          {/* 모바일 탑바 */}
          <div style={{ padding:'14px 16px 10px', paddingTop:'calc(14px + env(safe-area-inset-top, 0px))', background:C.bg, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:900 }}>{titles[page]}</div>
              <div style={{ fontSize:11, color:C.text3, marginTop:1 }}>{currentRole.name} · {currentRole.label}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <div onClick={()=>setNotifOpen(v=>!v)} style={{ position:'relative', width:38, height:38, borderRadius:10, background:C.surface, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18 }}>
                🔔{unreadCnt>0&&<div style={{ position:'absolute', top:7, right:7, width:8, height:8, background:'#dc2626', borderRadius:'50%', border:`2px solid ${C.bg}` }} />}
              </div>
              <button onClick={()=>setRoleIdx(i=>(i+1)%ROLES.length)} style={{ padding:'7px 11px', borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, color:C.accent, fontSize:11, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>{currentRole.label}</button>
            </div>
          </div>

          {/* 콘텐츠 */}
          <div style={{ flex:1, overflowY:'auto' }}>

            {page==='dashboard'&&(
              <div style={{ padding:16, animation:'fadeUp .3s ease' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                  {[{label:'긴급 대기',val:urgentCnt,col:'#f87171',bar:'#ef4444'},{label:'처리 중',val:progressCnt,col:'#facc15',bar:'#eab308'},{label:'금일 완료',val:doneCnt,col:'#4ade80',bar:'#22c55e'},{label:'전체 설비',val:24,col:'#60a5fa',bar:'#3b82f6'}].map(s=>(
                    <div key={s.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14, position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:s.bar }} />
                      <div style={{ fontSize:10, color:C.text3, fontWeight:600, marginBottom:8 }}>{s.label}</div>
                      <div style={{ fontSize:28, fontWeight:900, color:s.col, lineHeight:1, ...mono }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>최근 의뢰</div>
                <div style={{ display:'flex', gap:6, marginBottom:12, overflowX:'auto', paddingBottom:4 }}>
                  {['all','대기','처리중','완료'].map(f=>(
                    <button key={f} onClick={()=>setFilterSt(f)} style={{ padding:'5px 13px', borderRadius:20, fontSize:11, border:filterSt===f?'none':`1px solid ${C.border}`, background:filterSt===f?C.accent:'transparent', color:filterSt===f?'#fff':C.text3, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:filterSt===f?700:400, flexShrink:0 }}>
                      {f==='all'?'전체':f}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {filtered.map(r=>(
                    <div key={r.id} onClick={()=>setDetailReq(r)} style={{ background:C.surface, border:`1px solid ${r.urgency==='긴급'&&r.status!=='완료'?'rgba(239,68,68,.3)':C.border}`, borderRadius:12, padding:14, cursor:'pointer' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                        <div><div style={{ fontSize:14, fontWeight:800 }}>{r.fac}</div><div style={{ fontSize:11, color:C.text3, marginTop:2, ...mono }}>{r.id} · {r.time}</div></div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}><UrgTag u={r.urgency} /><StatusBadge s={r.status} /></div>
                      </div>
                      <div style={{ fontSize:12, color:C.text2, marginBottom:6 }}>{r.symptoms.join(' · ')}</div>
                      {r.memo&&<div style={{ fontSize:11, color:C.text3, borderTop:`1px solid ${C.border}`, paddingTop:6 }}>{r.memo}</div>}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                        <span style={{ fontSize:11, color:C.text3 }}>{r.requester}</span>
                        <button onClick={e=>{e.stopPropagation();setAiReq(r)}} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid rgba(249,115,22,.3)', background:'rgba(249,115,22,.08)', color:'#fb923c', fontSize:11, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>🤖 AI분석</button>
                      </div>
                    </div>
                  ))}
                  {filtered.length===0&&<div style={{ textAlign:'center', padding:32, color:C.text3, fontSize:13 }}>해당 의뢰가 없습니다</div>}
                </div>
              </div>
            )}

            {page==='request'&&(
              <div style={{ padding:16, animation:'fadeUp .3s ease' }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>{currentRole.key==='worker'?`내 의뢰 (${currentRole.name})`:'전체 의뢰'}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {requests.filter(r=>currentRole.key==='worker'?r.requester===currentRole.name:true).map(r=>(
                    <div key={r.id} onClick={()=>setDetailReq(r)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14, cursor:'pointer' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                        <div style={{ fontSize:14, fontWeight:800 }}>{r.fac}</div><StatusBadge s={r.status} />
                      </div>
                      <div style={{ fontSize:12, color:C.text2, marginBottom:6 }}>{r.symptoms.join(' · ')}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <UrgTag u={r.urgency} /><span style={{ fontSize:11, color:C.text3, ...mono }}>{r.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {page==='facilities'&&(
              <div style={{ padding:16, animation:'fadeUp .3s ease' }}>
                {['A라인','B라인','C라인'].map(line=>(
                  <div key={line} style={{ marginBottom:20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <div style={{ width:3, height:14, background:C.accent, borderRadius:2 }} /><div style={{ fontSize:12, fontWeight:700, color:C.text2 }}>{line}</div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {FACILITIES.filter(f=>f.line===line).map(f=>{
                        const repCnt=requests.filter(r=>r.facId===f.id&&r.status!=='완료').length
                        return (
                          <div key={f.id} style={{ background:C.surface, border:`1px solid ${f.status==='수리중'?'rgba(239,68,68,.3)':f.status==='점검중'?'rgba(234,179,8,.3)':C.border}`, borderRadius:10, padding:'12px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                              <div style={{ fontSize:12, fontWeight:800 }}>{f.name}</div>
                              {repCnt>0&&<span style={{ background:C.redDim, color:'#f87171', fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:8 }}>{repCnt}건</span>}
                            </div>
                            <FacBadge s={f.status} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {page==='admin'&&(
              <div style={{ padding:16, animation:'fadeUp .3s ease' }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>사용자 목록</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {users.map((u,i)=>(
                    <div key={u.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                        <div><div style={{ fontSize:14, fontWeight:700 }}>{u.name}</div><div style={{ fontSize:11, color:C.text3, marginTop:2 }}>{u.dept}</div></div>
                        <RoleBadge r={u.role} />
                      </div>
                      <div style={{ display:'flex', gap:16 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:C.text2 }}><Toggle on={u.notif} onChange={()=>setUsers(p=>p.map((x,j)=>j===i?{...x,notif:!x.notif}:x))} />앱 알림</div>
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
                <div style={{ fontSize:22, marginBottom:2, opacity:page===item.key?1:0.35 }}>{item.icon}</div>
                <div style={{ fontSize:10, fontWeight:600, color:page===item.key?C.accent:C.text3 }}>{item.label}</div>
                {item.badge>0&&<div style={{ position:'absolute', top:8, right:'50%', transform:'translateX(8px)', background:'#dc2626', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:8, ...mono }}>{item.badge}</div>}
                {page===item.key&&<div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:20, height:2, background:C.accent, borderRadius:'0 0 2px 2px' }} />}
              </div>
            ))}
          </div>
        </div>

        {notifOpen&&<NotifPanel />}
        {showModal&&<RequestModal onClose={()=>setShowModal(false)} onSubmit={submitReq} currentUser={currentRole} isMobile={true} />}
        {detailReq&&<DetailPanel req={detailReq} role={currentRole.key} onClose={()=>setDetailReq(null)} onStatusChange={changeStatus} onAI={setAiReq} isMobile={true} />}
        {aiReq&&<AIModal req={aiReq} onClose={()=>setAiReq(null)} isMobile={true} />}
        <Toasts list={toasts} />
      </>
    )
  }

  /* ───── 데스크탑 레이아웃 ───── */
  const TH = { padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:C.text3, letterSpacing:'0.06em', textTransform:'uppercase', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap', background:'rgba(255,255,255,.01)' }
  const TD = { padding:'12px 16px', fontSize:13, borderBottom:`1px solid rgba(26,46,72,.5)` }
  const card = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', marginBottom:24 }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
        {/* 사이드바 */}
        <div style={{ width:236, background:C.bg, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'18px 16px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ width:40, height:40, background:'linear-gradient(135deg,#f97316,#dc2626)', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10, fontSize:20 }}>⚙</div>
            <div style={{ fontSize:13, fontWeight:900 }}>설비수리 의뢰시스템</div>
            <div style={{ fontSize:10, color:C.text4, marginTop:3, ...mono }}>FMS v2.0 · AI POWERED</div>
          </div>
          <nav style={{ padding:'12px 8px', flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.text4, padding:'6px 12px 4px', letterSpacing:'0.1em', textTransform:'uppercase' }}>메뉴</div>
            {[{key:'dashboard',icon:'▦',label:'대시보드'},{key:'request',icon:'≡',label:'수리 의뢰',badge:pendingCnt},{key:'facilities',icon:'◫',label:'설비 목록'},{key:'admin',icon:'◎',label:'사용자 관리'}].map(item=>(
              <div key={item.key} onClick={()=>setPage(item.key)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, cursor:'pointer', marginBottom:2, fontSize:13, color:page===item.key?C.accent:C.text3, background:page===item.key?C.accentDim:'transparent', fontWeight:page===item.key?600:400, transition:'all .15s' }}
                onMouseEnter={e=>{ if(page!==item.key) e.currentTarget.style.color=C.text2 }}
                onMouseLeave={e=>{ if(page!==item.key) e.currentTarget.style.color=C.text3 }}>
                <span style={{ fontSize:17 }}>{item.icon}</span>{item.label}
                {item.badge>0&&<span style={{ marginLeft:'auto', background:'#dc2626', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:10, ...mono }}>{item.badge}</span>}
              </div>
            ))}
          </nav>
          <div style={{ margin:8 }}>
            <div onClick={()=>setRoleIdx(i=>(i+1)%ROLES.length)}
              style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'border-color .15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{ fontSize:10, color:C.accent, fontWeight:700, letterSpacing:'0.08em', marginBottom:4 }}>{currentRole.label}</div>
              <div style={{ fontSize:13, fontWeight:600 }}>{currentRole.name}</div>
              <div style={{ fontSize:11, color:C.text3, marginTop:2 }}>{currentRole.dept}</div>
              <div style={{ fontSize:10, color:C.text4, marginTop:6 }}>클릭하여 역할 전환 →</div>
            </div>
          </div>
        </div>

        {/* 메인 */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'14px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:C.bg, flexShrink:0 }}>
            <div style={{ fontSize:18, fontWeight:900 }}>{{ dashboard:'대시보드', request:'수리 의뢰', facilities:'설비 목록', admin:'사용자 관리' }[page]}</div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={()=>setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontSize:13, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700 }}>+ 수리 의뢰</button>
              <div onClick={()=>setNotifOpen(v=>!v)} style={{ position:'relative', background:C.surface2, border:`1px solid ${C.border}`, width:38, height:38, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16 }}>
                🔔{unreadCnt>0&&<div style={{ position:'absolute', top:7, right:7, width:8, height:8, background:'#dc2626', borderRadius:'50%', border:`2px solid ${C.bg}` }} />}
              </div>
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {page==='dashboard'&&(
              <div style={{ padding:24, animation:'fadeUp .3s ease' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
                  {[{label:'긴급 처리 대기',val:urgentCnt,col:'#f87171',bar:'#ef4444'},{label:'처리 중',val:progressCnt,col:'#facc15',bar:'#eab308'},{label:'금일 완료',val:doneCnt,col:'#4ade80',bar:'#22c55e'},{label:'전체 설비',val:24,col:'#60a5fa',bar:'#3b82f6'}].map(s=>(
                    <div key={s.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:'16px 20px', position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:s.bar }} />
                      <div style={{ fontSize:11, color:C.text3, fontWeight:600, marginBottom:10 }}>{s.label}</div>
                      <div style={{ fontSize:34, fontWeight:900, color:s.col, lineHeight:1, ...mono }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                <div style={card}>
                  <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>수리 의뢰 현황</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {['all','대기','처리중','완료'].map(f=>(
                        <button key={f} onClick={()=>setFilterSt(f)} style={{ padding:'5px 12px', borderRadius:20, fontSize:11, border:filterSt===f?'none':`1px solid ${C.border}`, background:filterSt===f?C.accent:'transparent', color:filterSt===f?'#fff':C.text3, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif", fontWeight:filterSt===f?700:400 }}>{f==='all'?'전체':f}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead><tr>{['의뢰번호','설비명','증상','긴급도','의뢰자','접수','상태','AI분석'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
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
                            <td style={{...TD,...mono,fontSize:11,color:C.text3}}>{r.time}</td>
                            <td style={TD}><StatusBadge s={r.status} /></td>
                            <td style={TD}><button onClick={e=>{e.stopPropagation();setAiReq(r)}} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid rgba(249,115,22,.3)', background:'rgba(249,115,22,.08)', color:'#fb923c', fontSize:11, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>🤖 분석</button></td>
                          </tr>
                        ))}
                        {filtered.length===0&&<tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:C.text3, fontSize:13 }}>해당하는 의뢰가 없습니다</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {page==='request'&&(
              <div style={{ padding:24, animation:'fadeUp .3s ease' }}>
                <div style={card}>
                  <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}` }}><div style={{ fontSize:14, fontWeight:700 }}>{currentRole.key==='worker'?`내 수리 의뢰 (${currentRole.name})`:'전체 수리 의뢰'}</div></div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead><tr>{['의뢰번호','설비명','증상','긴급도','접수','상태','AI분석'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                      <tbody>
                        {requests.filter(r=>currentRole.key==='worker'?r.requester===currentRole.name:true).map(r=>(
                          <tr key={r.id} onClick={()=>setDetailReq(r)} style={{ cursor:'pointer' }}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.025)'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <td style={{...TD,...mono,fontSize:11,color:C.text3}}>{r.id}</td>
                            <td style={{...TD,fontWeight:700}}>{r.fac}</td>
                            <td style={{...TD,fontSize:12,color:C.text2}}>{r.symptoms.join(', ')}</td>
                            <td style={TD}><UrgTag u={r.urgency} /></td>
                            <td style={{...TD,...mono,fontSize:11,color:C.text3}}>{r.time}</td>
                            <td style={TD}><StatusBadge s={r.status} /></td>
                            <td style={TD}><button onClick={e=>{e.stopPropagation();setAiReq(r)}} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid rgba(249,115,22,.3)', background:'rgba(249,115,22,.08)', color:'#fb923c', fontSize:11, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>🤖 분석</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {page==='facilities'&&(
              <div style={{ padding:24, animation:'fadeUp .3s ease' }}>
                {['A라인','B라인','C라인'].map(line=>(
                  <div key={line} style={{ marginBottom:28 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}><div style={{ width:3, height:16, background:C.accent, borderRadius:2 }} /><div style={{ fontSize:12, fontWeight:700, color:C.text2, letterSpacing:'0.06em', textTransform:'uppercase' }}>{line}</div></div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                      {FACILITIES.filter(f=>f.line===line).map(f=>{
                        const repCnt=requests.filter(r=>r.facId===f.id&&r.status!=='완료').length
                        return (
                          <div key={f.id} style={{ background:C.surface, border:`1px solid ${f.status==='수리중'?'rgba(239,68,68,.3)':f.status==='점검중'?'rgba(234,179,8,.3)':C.border}`, borderRadius:12, padding:'14px 16px', transition:'transform .15s', cursor:'default' }}
                            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                              <div style={{ fontSize:13, fontWeight:800 }}>{f.name}</div>
                              {repCnt>0&&<span style={{ background:C.redDim, color:'#f87171', fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:8 }}>{repCnt}건</span>}
                            </div>
                            <div style={{ fontSize:10, color:C.text4, marginBottom:10, ...mono }}>{f.model}</div>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}><FacBadge s={f.status} /><span style={{ fontSize:10, color:C.text4, ...mono }}>{f.lastCheck}</span></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {page==='admin'&&(
              <div style={{ padding:24, animation:'fadeUp .3s ease' }}>
                <div style={card}>
                  <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>사용자 목록</div>
                    <button onClick={()=>toast('warn','준비 중','사용자 추가 기능 준비 중')} style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface2, color:C.text2, fontSize:12, cursor:'pointer', fontFamily:"'Noto Sans KR',sans-serif" }}>+ 추가</button>
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr>{['ID','이름','부서','역할','앱 알림','활성'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {users.map((u,i)=>(
                        <tr key={u.id}>
                          <td style={{...TD,...mono,fontSize:11,color:C.text3}}>{u.id}</td>
                          <td style={{...TD,fontWeight:600}}>{u.name}</td>
                          <td style={{...TD,fontSize:12,color:C.text3}}>{u.dept}</td>
                          <td style={TD}><RoleBadge r={u.role} /></td>
                          <td style={TD}><Toggle on={u.notif} onChange={()=>setUsers(p=>p.map((x,j)=>j===i?{...x,notif:!x.notif}:x))} /></td>
                          <td style={TD}><Toggle on={u.active} onChange={()=>setUsers(p=>p.map((x,j)=>j===i?{...x,active:!x.active}:x))} /></td>
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
      {showModal&&<RequestModal onClose={()=>setShowModal(false)} onSubmit={submitReq} currentUser={currentRole} isMobile={false} />}
      {detailReq&&<DetailPanel req={detailReq} role={currentRole.key} onClose={()=>setDetailReq(null)} onStatusChange={changeStatus} onAI={setAiReq} isMobile={false} />}
      {aiReq&&<AIModal req={aiReq} onClose={()=>setAiReq(null)} isMobile={false} />}
      <Toasts list={toasts} />
    </>
  )
}
