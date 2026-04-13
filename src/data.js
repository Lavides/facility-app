// src/data.js

// ── 계정 정보 (하드코딩 - 실제 서비스는 DB로 교체)
export const ACCOUNTS = [
  { id:'ACC-001', username:'EUNSEOK', password:'Qwertyseok1!', name:'김은석', dept:'생산기술', role:'admin' },
  // 설비관리자 계정은 관리자가 추가 가능 (localStorage에 저장됨)
]

// ── 증상 목록
const SEED_SYMPTOMS = [
  '이상 소음 발생', '진동 심함', '오작동 / 멈춤',
  '과열 발생', '오일 누유', '전원 불량',
  '속도 이상', '표시등 오류', '압력 이상', '금형 체결 불량',
]

// ── 설비 그룹 순서
export const FACILITY_GROUPS = ['사출', '프레스', 'TOM실', '기타']

// ── 초기 설비 데이터
const SEED_FACILITIES = [
  ...Array.from({ length: 24 }, (_, i) => ({
    id: `FAC-SJ-${String(i+1).padStart(2,'0')}`,
    name: `사출 ${String(i+1).padStart(2,'0')}호기`,
    group: '사출',
    status: [4,11].includes(i) ? '수리중' : [2,17].includes(i) ? '점검중' : '정상',
    lastCheck: `2025-06-${String(10+(i%6)).padStart(2,'0')}`,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `FAC-PR-${String(i+1).padStart(2,'0')}`,
    name: `프레스 ${String(i+1).padStart(2,'0')}호기`,
    group: '프레스',
    status: i===2 ? '수리중' : '정상',
    lastCheck: `2025-06-${String(10+(i%5)).padStart(2,'0')}`,
  })),
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `FAC-TM-${String(i+1).padStart(2,'0')}`,
    name: `톰 성형 ${i+1}호기`,
    group: 'TOM실',
    status: '정상',
    lastCheck: `2025-06-1${i+1}`,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `FAC-LZ-${String(i+1).padStart(2,'0')}`,
    name: `레이저 ${i+1}호기`,
    group: 'TOM실',
    status: i===1 ? '점검중' : '정상',
    lastCheck: `2025-06-${String(8+i).padStart(2,'0')}`,
  })),
  { id:'FAC-HS-01', name:'핫스탬핑 1호기', group:'기타', status:'정상', lastCheck:'2025-06-10' },
  { id:'FAC-HS-02', name:'핫스탬핑 2호기', group:'기타', status:'정상', lastCheck:'2025-06-11' },
]

// ── 초기 의뢰 데이터 (날짜 포함 - 고장이력 탭용)
const SEED_REQUESTS = [
  { id:'REQ-001', facId:'FAC-SJ-05', fac:'사출 05호기', symptoms:['이상 소음 발생','진동 심함'],  urgency:'긴급', requester:'조민관', date:'2025-06-11', time:'09:12', status:'처리중', memo:'주축 부근 금속 마찰음' },
  { id:'REQ-002', facId:'FAC-SJ-12', fac:'사출 12호기', symptoms:['오작동 / 멈춤'],              urgency:'긴급', requester:'이광래', date:'2025-06-11', time:'09:45', status:'대기',   memo:'3회 연속 정지' },
  { id:'REQ-003', facId:'FAC-SJ-18', fac:'사출 18호기', symptoms:['오일 누유'],                  urgency:'일반', requester:'홍동흠', date:'2025-06-10', time:'10:20', status:'대기',   memo:'하부 실린더 오일 누유' },
  { id:'REQ-004', facId:'FAC-PR-03', fac:'프레스 03호기', symptoms:['표시등 오류','전원 불량'],   urgency:'긴급', requester:'조민관', date:'2025-06-10', time:'11:00', status:'대기',   memo:'에러코드 E-04 반복' },
  { id:'REQ-005', facId:'FAC-SJ-21', fac:'사출 21호기', symptoms:['속도 이상'],                  urgency:'일반', requester:'이광래', date:'2025-06-09', time:'11:30', status:'완료',   memo:'사출 속도 30% 저하' },
  { id:'REQ-006', facId:'FAC-TM-01', fac:'톰 성형 1호기', symptoms:['과열 발생'],                urgency:'일반', requester:'홍동흠', date:'2025-06-09', time:'13:00', status:'완료',   memo:'냉각수 온도 비정상 상승' },
  { id:'REQ-007', facId:'FAC-SJ-05', fac:'사출 05호기', symptoms:['진동 심함'],                  urgency:'일반', requester:'조민관', date:'2025-05-20', time:'08:30', status:'완료',   memo:'베어링 마모' },
  { id:'REQ-008', facId:'FAC-SJ-05', fac:'사출 05호기', symptoms:['오일 누유'],                  urgency:'일반', requester:'이광래', date:'2025-05-10', time:'14:00', status:'완료',   memo:'오일씰 교체' },
  { id:'REQ-009', facId:'FAC-PR-01', fac:'프레스 01호기', symptoms:['이상 소음 발생'],            urgency:'긴급', requester:'홍동흠', date:'2025-05-05', time:'10:00', status:'완료',   memo:'금형 충격음' },
  { id:'REQ-010', facId:'FAC-SJ-12', fac:'사출 12호기', symptoms:['과열 발생'],                  urgency:'긴급', requester:'조민관', date:'2025-04-15', time:'09:00', status:'완료',   memo:'냉각 불량' },
]

// ── 초기 사용자 데이터
const SEED_USERS = [
  { id:'USR-001', name:'김은석', dept:'생산기술', role:'관리자',    notif:true, active:true },
  { id:'USR-002', name:'이종석', dept:'생산기술', role:'설비관리자', notif:true, active:true },
  { id:'USR-003', name:'최원철', dept:'생산기술', role:'설비관리자', notif:true, active:true },
  { id:'USR-004', name:'조민관', dept:'생산',     role:'조/반장',   notif:true, active:true },
  { id:'USR-005', name:'이광래', dept:'생산',     role:'조/반장',   notif:true, active:true },
  { id:'USR-006', name:'홍동흠', dept:'생산',     role:'조/반장',   notif:true, active:true },
]

// ─────────────────────────────────────────────
// LocalStorage
// ─────────────────────────────────────────────
const LS = { REQ:'fms_requests', USERS:'fms_users', FAC:'fms_facilities', SYMS:'fms_symptoms', ACCS:'fms_accounts' }

export function loadRequests()   { try { const r=localStorage.getItem(LS.REQ);  if(r) return JSON.parse(r) } catch {} saveRequests(SEED_REQUESTS); return SEED_REQUESTS }
export function saveRequests(l)  { try { localStorage.setItem(LS.REQ,  JSON.stringify(l)) } catch {} }

export function loadUsers()      { try { const r=localStorage.getItem(LS.USERS); if(r) return JSON.parse(r) } catch {} saveUsers(SEED_USERS); return SEED_USERS }
export function saveUsers(l)     { try { localStorage.setItem(LS.USERS, JSON.stringify(l)) } catch {} }

export function loadFacilities() { try { const r=localStorage.getItem(LS.FAC);  if(r) return JSON.parse(r) } catch {} saveFacilities(SEED_FACILITIES); return SEED_FACILITIES }
export function saveFacilities(l){ try { localStorage.setItem(LS.FAC,  JSON.stringify(l)) } catch {} }

export function loadSymptoms()   { try { const r=localStorage.getItem(LS.SYMS); if(r) return JSON.parse(r) } catch {} saveSymptoms(SEED_SYMPTOMS); return SEED_SYMPTOMS }
export function saveSymptoms(l)  { try { localStorage.setItem(LS.SYMS, JSON.stringify(l)) } catch {} }

export function loadAccounts()   { try { const r=localStorage.getItem(LS.ACCS); if(r) return JSON.parse(r) } catch {} saveAccounts(ACCOUNTS); return ACCOUNTS }
export function saveAccounts(l)  { try { localStorage.setItem(LS.ACCS, JSON.stringify(l)) } catch {} }
