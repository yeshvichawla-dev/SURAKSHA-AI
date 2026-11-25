export type Category =
  | 'pothole' | 'damaged_road' | 'waterlogging' | 'accident'
  | 'road_blockage' | 'construction' | 'traffic_obstruction' | 'other'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type HazardStatus = 'active' | 'under_review' | 'resolved'
export type Verification = 'unverified' | 'community_confirmed' | 'authority_verified'

export interface LatLng { lat: number; lng: number }

export interface Hazard {
  id: string
  category: Category
  description: string
  lat: number
  lng: number
  severity: Severity
  status: HazardStatus
  verification: Verification
  photo_url: string | null
  confirmations: number
  resolved_flags: number
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface RouteOption {
  durationSec: number
  staticDurationSec: number | null
  distanceM: number
  description: string | null
  labels: string[]
  path: LatLng[]
}

export interface CreateResult { hazard: Hazard; possible_duplicates: Hazard[] }

export interface AdminStats {
  total: number
  active: number
  under_review: number
  resolved: number
  high_severity_open: number
  demo_count: number
  by_category: Record<string, number>
  by_severity: Record<string, number>
  hotspots: { lat: number; lng: number; count: number }[]
  priority_formula: string
  priority_queue: Hazard[]
  recent: Hazard[]
}
