export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function freshness(iso: string): { label: string; tone: 'good' | 'ok' | 'stale' } {
  const days = (Date.now() - new Date(iso).getTime()) / 86400000
  if (days < 1) return { label: 'Fresh (under 24 h)', tone: 'good' }
  if (days < 7) return { label: 'Recent (under 7 days)', tone: 'good' }
  if (days < 30) return { label: 'Aging (7 to 30 days)', tone: 'ok' }
  return { label: 'Possibly outdated (over 30 days)', tone: 'stale' }
}

export const fmtDistance = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`)

export function fmtDuration(sec: number): string {
  const min = Math.round(sec / 60)
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`
}
