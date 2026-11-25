import type { AdminStats, CreateResult, Hazard, RouteOption, LatLng } from '../types'
import { decodePolyline } from './geo'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export const assetUrl = (path: string | null) => (path ? `${BASE}${path}` : null)

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE + path, init)
  } catch {
    throw new Error('Cannot reach the Suraksha AI server. Start the backend (see README).')
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const j = await res.json()
      if (typeof j.detail === 'string') detail = j.detail
      else if (Array.isArray(j.detail)) detail = j.detail.map((d: { msg: string }) => d.msg).join('; ')
    } catch { /* keep default message */ }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

export const getHazards = (status = 'active,under_review') =>
  request<Hazard[]>(`/api/hazards?status=${encodeURIComponent(status)}&limit=1000`)

export const getHazard = (id: string) => request<Hazard>(`/api/hazards/${encodeURIComponent(id)}`)

export const createHazard = (form: FormData) =>
  request<CreateResult>('/api/hazards', { method: 'POST', body: form })

export const confirmHazard = (id: string) => request<Hazard>(`/api/hazards/${id}/confirm`, { method: 'POST' })
export const flagResolved = (id: string) => request<Hazard>(`/api/hazards/${id}/flag-resolved`, { method: 'POST' })

interface RawRoute {
  duration_sec: number
  static_duration_sec: number | null
  distance_m: number
  description: string | null
  labels: string[]
  encoded_polyline: string
}

export async function getRoutes(origin: LatLng, destination: LatLng): Promise<RouteOption[]> {
  const data = await request<{ routes: RawRoute[] }>('/api/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination }),
  })
  return data.routes.map((r) => ({
    durationSec: r.duration_sec,
    staticDurationSec: r.static_duration_sec,
    distanceM: r.distance_m,
    description: r.description,
    labels: r.labels,
    path: decodePolyline(r.encoded_polyline),
  }))
}

const TOKEN_KEY = 'suraksha_admin_token'
export const getAdminToken = () => sessionStorage.getItem(TOKEN_KEY) ?? ''
export const setAdminToken = (t: string) => (t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY))
const adminHeaders = (): HeadersInit => ({ 'X-Admin-Token': getAdminToken(), 'Content-Type': 'application/json' })

export const adminCheck = () => request<{ ok: boolean }>('/api/admin/check', { headers: adminHeaders() })
export const adminStats = () => request<AdminStats>('/api/admin/stats', { headers: adminHeaders() })
export const adminUpdate = (id: string, body: Partial<Pick<Hazard, 'status' | 'verification' | 'severity'>>) =>
  request<Hazard>(`/api/admin/hazards/${id}`, { method: 'PATCH', headers: adminHeaders(), body: JSON.stringify(body) })

export interface ImageAnalysis { available: boolean; status: string; message: string; predictions: Array<{ hazard_detected?: boolean; category?: string; severity_suggestion?: string; confidence?: number; explanation?: string }> }
export const analyzeHazardPhoto = (photo: File) => { const fd = new FormData(); fd.append('photo', photo); return request<ImageAnalysis>('/api/ai/analyze-image', { method: 'POST', body: fd }) }
