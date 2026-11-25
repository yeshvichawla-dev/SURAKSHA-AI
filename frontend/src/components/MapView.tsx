import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { Hazard, LatLng, RouteOption } from '../types'
import { CAT, SEV } from '../lib/constants'

interface Props {
  center: LatLng
  hazards: Hazard[]
  selectedId?: string | null
  onSelectHazard?: (id: string) => void
  routes?: RouteOption[]
  activeRoute?: number
  onSelectRoute?: (i: number) => void
  user?: LatLng | null
  picking?: boolean
  picked?: LatLng | null
  onPick?: (p: LatLng) => void
  zoom?: number
}

function makeIcon(content: string, color: string, size = 36) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;background:${color};
      border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      font-size:17px;box-shadow:0 2px 7px #0008;
    ">${content}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function MapView(p: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const markers = useRef<L.Layer[]>([])
  const lines = useRef<L.Polyline[]>([])
  const userMarker = useRef<L.Marker | null>(null)
  const pickedMarker = useRef<L.Marker | null>(null)
  const pickingRef = useRef(false)
  const onPickRef = useRef(p.onPick)

  pickingRef.current = !!p.picking
  onPickRef.current = p.onPick

  // Initialize OpenStreetMap
  useEffect(() => {
    if (!el.current) return

    const m = L.map(el.current, {
      center: [p.center.lat, p.center.lng],
      zoom: p.zoom ?? 13,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(m)

    m.on('click', (e: L.LeafletMouseEvent) => {
      if (pickingRef.current) {
        onPickRef.current?.({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        })
      }
    })

    map.current = m

    const timer = window.setTimeout(() => m.invalidateSize(), 200)

    return () => {
      window.clearTimeout(timer)
      m.remove()
      map.current = null
    }
    // Initialize only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Hazard markers
  useEffect(() => {
    if (!map.current) return

    markers.current.forEach(marker => marker.remove())
    markers.current = []

    p.hazards.forEach(h => {
      const c = CAT[h.category]
      if (!c) return

      const marker = L.marker([h.lat, h.lng], {
        icon: makeIcon(c.glyph, c.color),
        zIndexOffset: h.id === p.selectedId ? 1000 : 0,
      }).addTo(map.current!)

      marker.bindPopup(
        `<b>${c.label}</b><br/>Severity: ${SEV[h.severity]?.label ?? h.severity}`
      )

      marker.on('click', () => p.onSelectHazard?.(h.id))
      markers.current.push(marker)
    })
  }, [p.hazards, p.selectedId, p.onSelectHazard])

  // Route lines
  useEffect(() => {
    if (!map.current) return

    lines.current.forEach(line => line.remove())
    lines.current = []

    ;(p.routes ?? []).forEach((route, i) => {
      const active = i === p.activeRoute

      const line = L.polyline(
        route.path.map(point => [point.lat, point.lng] as L.LatLngTuple),
        {
          color: active ? '#2dd4bf' : '#7b8ea3',
          weight: active ? 7 : 5,
          opacity: active ? 0.95 : 0.7,
        }
      ).addTo(map.current!)

      line.on('click', () => p.onSelectRoute?.(i))
      lines.current.push(line)
    })
  }, [p.routes, p.activeRoute, p.onSelectRoute])

  // Fit map to route
  useEffect(() => {
    if (!map.current || !p.routes?.length) return

    const points = p.routes.flatMap(route =>
      route.path.map(point => [point.lat, point.lng] as L.LatLngTuple)
    )

    if (points.length) {
      map.current.fitBounds(L.latLngBounds(points), { padding: [40, 40] })
    }
  }, [p.routes])

  // User location
  useEffect(() => {
    if (!map.current) return

    userMarker.current?.remove()
    userMarker.current = null

    if (p.user) {
      userMarker.current = L.marker(
        [p.user.lat, p.user.lng],
        { icon: makeIcon('●', '#3b82f6', 22), zIndexOffset: 1500 }
      ).addTo(map.current).bindPopup('Your location')
    }
  }, [p.user])

  // Selected hazard/report location
  useEffect(() => {
    if (!map.current) return

    pickedMarker.current?.remove()
    pickedMarker.current = null

    if (p.picked) {
      pickedMarker.current = L.marker(
        [p.picked.lat, p.picked.lng],
        { icon: makeIcon('📍', '#ff7a1a', 30), zIndexOffset: 1600 }
      ).addTo(map.current).bindPopup('Selected location')
    }
  }, [p.picked])

  // Update map center
  useEffect(() => {
    map.current?.panTo([p.center.lat, p.center.lng])
  }, [p.center.lat, p.center.lng])

  // Map cursor
  useEffect(() => {
    if (el.current) {
      el.current.style.cursor = p.picking ? 'crosshair' : ''
    }
  }, [p.picking])

  return (
    <div
      ref={el}
      className="h-[400px] w-full min-h-[400px] bg-panel"
      aria-label="OpenStreetMap"
    />
  )
}