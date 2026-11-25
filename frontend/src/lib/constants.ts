import type { Category, HazardStatus, Severity, Verification } from '../types'

export const CATEGORIES: { id: Category; label: string; color: string; glyph: string }[] = [
  { id: 'pothole', label: 'Pothole', color: '#ff7a1a', glyph: '🕳️' },
  { id: 'damaged_road', label: 'Damaged road', color: '#c98b5a', glyph: '🛣️' },
  { id: 'waterlogging', label: 'Waterlogging', color: '#3b9eff', glyph: '🌊' },
  { id: 'accident', label: 'Accident', color: '#f0527a', glyph: '💥' },
  { id: 'road_blockage', label: 'Road blockage', color: '#b06cff', glyph: '⛔' },
  { id: 'construction', label: 'Construction', color: '#f5c542', glyph: '🚧' },
  { id: 'traffic_obstruction', label: 'Traffic obstruction', color: '#7f93a8', glyph: '🚗' },
  { id: 'other', label: 'Other', color: '#5f7690', glyph: '❓' },
]
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<Category, (typeof CATEGORIES)[number]>

export const SEVERITIES: { id: Severity; label: string; color: string }[] = [
  { id: 'low', label: 'Low', color: '#6ee7b7' },
  { id: 'medium', label: 'Medium', color: '#fbbf24' },
  { id: 'high', label: 'High', color: '#fb923c' },
  { id: 'critical', label: 'Critical', color: '#f43f5e' },
]
export const SEV = Object.fromEntries(SEVERITIES.map((s) => [s.id, s])) as Record<Severity, (typeof SEVERITIES)[number]>

export const STATUS_LABEL: Record<HazardStatus, string> = {
  active: 'Active',
  under_review: 'Under review',
  resolved: 'Resolved',
}

export const VERIFICATION_LABEL: Record<Verification, string> = {
  unverified: 'Unverified',
  community_confirmed: 'Community confirmed',
  authority_verified: 'Authority verified',
}

export const VERIFICATION_NOTE: Record<Verification, string> = {
  unverified: 'Reported by one user. Not checked by anyone yet.',
  community_confirmed: 'Confirmed by several users. This is not an official check.',
  authority_verified: 'Marked verified by an administrator.',
}

export const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }
export const ROUTE_BUFFER_M = 150
export const ALERT_RADIUS_M = 1000

export const FEATURE_STATUS: { name: string; state: 'Working' | 'Rule-based' | 'Demo data' | 'Planned' | 'Future'; note: string }[] = [
  { name: 'Interactive map and GPS location', state: 'Working', note: 'Needs a Google Maps key and browser permission.' },
  { name: 'Destination search with autocomplete', state: 'Working', note: 'Google Places (New).' },
  { name: 'Route display and alternatives', state: 'Working', note: 'Google Routes API through our server. Traffic-aware times come from Google.' },
  { name: 'Hazard reporting with photo', state: 'Working', note: 'Stored in the database; photo stored but not analysed.' },
  { name: 'Hazard markers, filters, details', state: 'Working', note: 'Real reports from the database.' },
  { name: 'Community confirm / flag as resolved', state: 'Working', note: '3 confirmations = community confirmed. This is not official verification.' },
  { name: 'In-app proximity alerts', state: 'Rule-based', note: 'Based on distance rules. Only while the app is open.' },
  { name: 'Duplicate report warning', state: 'Rule-based', note: 'Same category within 50 m in 14 days. Not machine learning.' },
  { name: 'Report freshness', state: 'Rule-based', note: 'Derived from report age.' },
  { name: 'Admin dashboard', state: 'Working', note: 'Token-protected. Real numbers from the database.' },
  { name: 'Sample hazards', state: 'Demo data', note: 'Added by seed_demo.py and labelled DEMO DATA.' },
  { name: 'Photo-based pothole detection', state: 'Planned', note: 'No model connected yet.' },
  { name: 'AI severity, risk score, confidence', state: 'Planned', note: 'No model connected yet.' },
  { name: 'Turn-by-turn voice navigation', state: 'Future', note: 'Needs a native Android/iOS Navigation SDK.' },
  { name: 'Background push notifications', state: 'Future', note: 'Needs a mobile app or push service.' },
]
