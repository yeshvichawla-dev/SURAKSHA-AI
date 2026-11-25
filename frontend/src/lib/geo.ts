import type { LatLng } from '../types'

const R = 6371000

export function haversine(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180
  const dp = (b.lat - a.lat) * rad
  const dl = (b.lng - a.lng) * rad
  const h = Math.sin(dp / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Shortest distance in metres from a point to a polyline. */
export function distanceToPath(p: LatLng, path: LatLng[]): number {
  if (path.length === 0) return Infinity
  if (path.length === 1) return haversine(p, path[0])
  const rad = Math.PI / 180
  const kx = R * Math.cos(p.lat * rad) * rad
  const ky = R * rad
  let best = Infinity
  for (let i = 0; i < path.length - 1; i++) {
    const ax = (path[i].lng - p.lng) * kx
    const ay = (path[i].lat - p.lat) * ky
    const bx = (path[i + 1].lng - p.lng) * kx
    const by = (path[i + 1].lat - p.lat) * ky
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2))
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy))
  }
  return best
}

/** Decodes a Google encoded polyline (precision 5). */
export function decodePolyline(str: string): LatLng[] {
  let index = 0, lat = 0, lng = 0
  const out: LatLng[] = []
  while (index < str.length) {
    for (const axis of [0, 1]) {
      let b: number, shift = 0, result = 0
      do {
        b = str.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const delta = result & 1 ? ~(result >> 1) : result >> 1
      if (axis === 0) lat += delta
      else lng += delta
    }
    out.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return out
}
