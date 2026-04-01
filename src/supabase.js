// src/supabase.js
// ──────────────────────────────────────────────────────────────────
// Supabase 연결 설정
// 나중에 Supabase 프로젝트를 만들면 아래 두 값만 교체하면 됩니다.
// 지금은 로컬 메모리(mock) 모드로 동작합니다.
// ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabaseClient = null

export function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  if (supabaseClient) return supabaseClient
  // dynamic import only when keys exist
  return null
}

export const isSupabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
