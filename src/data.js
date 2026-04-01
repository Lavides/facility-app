// src/data.js  ── 마스터 데이터 & 로컬 스토리지 기반 Mock DB

// ── 설비 목록 (사출 01~24호기)
export const FACILITIES = Array.from({ length: 24 }, (_, i) => ({
  id: `FAC-${String(i + 1).padStart(2, '0')}`,
  name: `사출 ${String(i + 1).padStart(2, '0')}호기`,
  line: i < 8 ? 'A라인' : i < 16 ? 'B라인' : 'C라인',
  status: [4, 11].includes(i) ? '수리중' : [2, 17].includes(i) ? '점검중' : '정상',
  lastCheck: `2025-06-${String(10 + (i % 6)).padStart(2, '0')}`,
  model: ['LS엠트론 180T', '현대위아 250T', '우진 300T', '태광 220T'][i % 4],
}))

// ── 증상 목록
export const SYMPTOMS = [
  '이상 소음 발생', '진동 심함', '오작동 / 멈춤',
  '과열 발생', '오일 누유', '전원 불량',
  '속도 이상', '표시등 오류', '압력 이상', '금형 체결 불량',
]

// ── 현재 로그인 사용자 (김은석 = 관리자)
export const CURRENT_USER = { name: '김은석', dept: '생산기술', role: '관리자' }

// ── 역할 목록 (사이드바 표시용)
export const ROLES = [
  { key: 'admin', label: 'ADMIN', name: '김은석', dept: '생산기술' },
]

// ── 초기 의뢰 데이터
const SEED_REQUESTS = [
  { id:'REQ-001', facId:'FAC-05', fac:'사출 05호기', symptoms:['이상 소음 발생','진동 심함'],  urgency:'긴급', requester:'조민관', time:'09:12', status:'처리중', memo:'주축 부근 금속 마찰음' },
  { id:'REQ-002', facId:'FAC-12', fac:'사출 12호기', symptoms:['오작동 / 멈춤'],              urgency:'긴급', requester:'이광래', time:'09:45', status:'대기',   memo:'3회 연속 정지' },
  { id:'REQ-003', facId:'FAC-18', fac:'사출 18호기', symptoms:['오일 누유'],                  urgency:'일반', requester:'홍동흠', time:'10:20', status:'대기',   memo:'하부 실린더 오일 누유' },
  { id:'REQ-004', facId:'FAC-07', fac:'사출 07호기', symptoms:['표시등 오류','전원 불량'],     urgency:'긴급', requester:'조민관', time:'11:00', status:'대기',   memo:'에러코드 E-04 반복' },
  { id:'REQ-005', facId:'FAC-21', fac:'사출 21호기', symptoms:['속도 이상'],                  urgency:'일반', requester:'이광래', time:'11:30', status:'완료',   memo:'사출 속도 30% 저하' },
  { id:'REQ-006', facId:'FAC-03', fac:'사출 03호기', symptoms:['과열 발생'],                  urgency:'일반', requester:'홍동흠', time:'13:00', status:'완료',   memo:'냉각수 온도 비정상 상승' },
]

// ── 초기 사용자 데이터 (실제 사용자)
const SEED_USERS = [
  { id:'USR-001', name:'김은석', dept:'생산기술', role:'관리자',    notif:true, active:true },
  { id:'USR-002', name:'이종석', dept:'생산기술', role:'설비관리자', notif:true, active:true },
  { id:'USR-003', name:'최원철', dept:'생산기술', role:'설비관리자', notif:true, active:true },
  { id:'USR-004', name:'조민관', dept:'생산',     role:'조/반장',   notif:true, active:true },
  { id:'USR-005', name:'이광래', dept:'생산',     role:'조/반장',   notif:true, active:true },
  { id:'USR-006', name:'홍동흠', dept:'생산',     role:'조/반장',   notif:true, active:true },
]

// ─────────────────────────────────────────────
// LocalStorage Mock DB
// ─────────────────────────────────────────────
const LS_REQ   = 'fms_requests'
const LS_USERS = 'fms_users'

export function loadRequests() {
  try {
    const raw = localStorage.getItem(LS_REQ)
    if (raw) return JSON.parse(raw)
  } catch {}
  saveRequests(SEED_REQUESTS)
  return SEED_REQUESTS
}
export function saveRequests(list) {
  try { localStorage.setItem(LS_REQ, JSON.stringify(list)) } catch {}
}

export function loadUsers() {
  try {
    const raw = localStorage.getItem(LS_USERS)
    if (raw) return JSON.parse(raw)
  } catch {}
  saveUsers(SEED_USERS)
  return SEED_USERS
}
export function saveUsers(list) {
  try { localStorage.setItem(LS_USERS, JSON.stringify(list)) } catch {}
}
