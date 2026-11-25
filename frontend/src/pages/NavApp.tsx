import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapView from '../components/MapView'
import SearchBox, { type Place } from '../components/SearchBox'
import HazardPanel from '../components/HazardPanel'
import ReportModal from '../components/ReportModal'
import { SeverityPill } from '../components/Badges'
import type { Category, Hazard, LatLng, RouteOption } from '../types'
import { ALERT_RADIUS_M, CAT, CATEGORIES, DEFAULT_CENTER, ROUTE_BUFFER_M, SEV } from '../lib/constants'
import { getHazards, getRoutes } from '../lib/api'
import { distanceToPath, haversine } from '../lib/geo'
import { fmtDistance, fmtDuration } from '../lib/format'

const ALERT_CATEGORIES: Category[] = ['waterlogging', 'road_blockage', 'construction']

export default function NavApp() {
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [user, setUser] = useState<LatLng | null>(null)
  const [geoMsg, setGeoMsg] = useState<string | null>(null)
  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER)
  const [visible, setVisible] = useState<Set<Category>>(new Set(CATEGORIES.map((c) => c.id)))
  const [dest, setDest] = useState<Place | null>(null)
  const [routes, setRoutes] = useState<RouteOption[]>([])
  const [active, setActive] = useState(0)
  const [routing, setRouting] = useState(false)
  const [routeErr, setRouteErr] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<LatLng | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const firstFix = useRef(true)

  const load = useCallback(async () => {
    try {
      setHazards(await getHazards())
      setLoadErr(null)
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Could not load hazards.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  useEffect(() => {
    if (!navigator.geolocation) { setGeoMsg('This browser does not support location.'); return }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude }
        setUser(here); setGeoMsg(null)
        if (firstFix.current) { firstFix.current = false; setCenter(here) }
      },
      (e) => setGeoMsg(`Location unavailable (${e.message}). Allow location access in your browser to route from where you are.`),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  async function planRoute(place: Place) {
    setDest(place); setRoutes([]); setRouteErr(null)
    if (!user) { setRouteErr('We need your location as the starting point. Allow location access and choose the destination again.'); return }
    setRouting(true)
    try {
      const r = await getRoutes(user, place)
      setRoutes(r); setActive(0)
    } catch (e) {
      setRouteErr(e instanceof Error ? e.message : 'Could not get routes.')
    } finally { setRouting(false) }
  }

  const shown = useMemo(() => hazards.filter((h) => visible.has(h.category)), [hazards, visible])
  const selected = hazards.find((h) => h.id === selectedId) ?? null

  const analysis = useMemo(
    () => routes.map((r) => {
      const near = hazards.filter((h) => distanceToPath(h, r.path) <= ROUTE_BUFFER_M)
      return { near, critical: near.filter((h) => h.severity === 'critical').length }
    }),
    [routes, hazards],
  )
  const fewest = useMemo(() => {
    if (analysis.length < 2) return -1
    const counts = analysis.map((a) => a.near.length)
    const min = Math.min(...counts)
    return counts.filter((c) => c === min).length === 1 ? counts.indexOf(min) : -1
  }, [analysis])

  const alerts = useMemo(() => {
    const list: { key: string; text: string; sev: Hazard['severity']; id: string }[] = []
    const seen = new Set<string>()
    const add = (key: string, text: string, h: Hazard) => { if (!seen.has(key) && !dismissed.has(key)) { seen.add(key); list.push({ key, text, sev: h.severity, id: h.id }) } }
    if (user) {
      for (const h of hazards) {
        const d = haversine(user, h)
        if (d <= ALERT_RADIUS_M && (h.severity === 'high' || h.severity === 'critical' || ALERT_CATEGORIES.includes(h.category))) {
          add(`${h.id}:near`, `${CAT[h.category].label} reported ${fmtDistance(d)} from you`, h)
        }
      }
    }
    if (analysis[active]) {
      for (const h of analysis[active].near) {
        if (h.severity === 'high' || h.severity === 'critical') add(`${h.id}:route`, `On your route: ${CAT[h.category].label} (${SEV[h.severity].label})`, h)
      }
    }
    const rank = { critical: 0, high: 1, medium: 2, low: 3 }
    return list.sort((a, b) => rank[a.sev] - rank[b.sev]).slice(0, 5)
  }, [hazards, user, analysis, active, dismissed])

  const toggle = (c: Category) => setVisible((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n })
  const replace = (h: Hazard) => setHazards((list) => list.map((x) => (x.id === h.id ? h : x)))

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row">
      <aside className="order-2 w-full space-y-5 overflow-y-auto border-t border-line bg-ink p-4 md:order-1 md:w-96 md:border-r md:border-t-0">
        <SearchBox onSelect={planRoute} />
        {geoMsg && <p className="text-xs text-mute" role="status">{geoMsg}</p>}

        {(routing || routeErr || routes.length > 0) && (
          <section aria-label="Routes">
            <h2 className="mb-2 font-semibold">Routes to {dest?.name}</h2>
            {routing && <p className="text-sm text-mute">Finding routes…</p>}
            {routeErr && <p className="text-sm text-signal" role="alert">{routeErr}</p>}
            <ul className="space-y-2">
              {routes.map((r, i) => {
                const a = analysis[i]
                return (
                  <li key={i}>
                    <button onClick={() => setActive(i)} aria-pressed={active === i}
                      className={`w-full rounded-xl border p-3 text-left ${active === i ? 'border-route bg-raise' : 'border-line'}`}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold">{fmtDuration(r.durationSec)}</span>
                        <span className="text-sm text-mute">{fmtDistance(r.distanceM)}</span>
                      </div>
                      <p className="text-xs text-mute">{r.description ? `via ${r.description}` : `Route ${i + 1}`}{r.staticDurationSec && r.durationSec - r.staticDurationSec > 120 ? ` · about ${fmtDuration(r.durationSec - r.staticDurationSec)} added by traffic` : ''}</p>
                      <p className="mt-1 text-sm">
                        {a.near.length} reported hazard{a.near.length === 1 ? '' : 's'} within {ROUTE_BUFFER_M} m
                        {a.critical > 0 && <span className="ml-1 font-semibold text-signal">· {a.critical} critical</span>}
                        {fewest === i && <span className="ml-1 text-route">· fewest reports</span>}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
            {routes.length > 0 && (
              <>
                {(analysis[active]?.near.length ?? 0) > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {analysis[active].near.map((h) => (
                      <li key={h.id}><button className="text-left underline decoration-line" onClick={() => { setSelectedId(h.id); setCenter({ lat: h.lat, lng: h.lng }) }}>{CAT[h.category].glyph} {CAT[h.category].label}</button> <SeverityPill s={h.severity} /></li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-mute">
                  Counts use only reports in this app. Few or no reports does not mean a route is safe, and there is no safety score. Travel time and traffic come from Google. This is route preview, not turn-by-turn navigation.
                </p>
              </>
            )}
          </section>
        )}

        <section aria-label="Alerts">
          <h2 className="mb-2 font-semibold">Alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-mute">{user ? 'No high-severity hazards within 1 km or on your route.' : 'Allow location to see alerts near you.'}</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.key} className="flex items-start justify-between gap-2 rounded-lg border border-line bg-panel p-2 text-sm">
                  <button className="text-left" onClick={() => setSelectedId(a.id)}>{a.text}</button>
                  <button className="text-xs text-mute" aria-label="Dismiss alert" onClick={() => setDismissed((d) => new Set(d).add(a.key))}>Dismiss</button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-xs text-mute">In-app alerts only. They appear while this page is open.</p>
        </section>

        <section aria-label="Hazard filters">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Show on map</h2>
            <button className="text-xs text-route underline" onClick={() => setVisible(visible.size === CATEGORIES.length ? new Set() : new Set(CATEGORIES.map((c) => c.id)))}>
              {visible.size === CATEGORIES.length ? 'Hide all' : 'Show all'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.id} aria-pressed={visible.has(c.id)} onClick={() => toggle(c.id)}
                className={`rounded-full border px-3 py-1 text-xs ${visible.has(c.id) ? 'border-route bg-raise' : 'border-line text-mute'}`}>
                {c.glyph} {c.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-mute">Marker ring colour shows severity: green low, yellow medium, orange high, red critical.</p>
          {loading && <p className="mt-2 text-sm text-mute">Loading hazards…</p>}
          {loadErr && <p className="mt-2 text-sm text-signal" role="alert">{loadErr} <button className="underline" onClick={load}>Retry</button></p>}
          {!loading && !loadErr && hazards.length === 0 && <p className="mt-2 text-sm text-mute">No hazards reported yet. Be the first to report one.</p>}
          {!loading && !loadErr && hazards.length > 0 && <p className="mt-2 text-xs text-mute">{shown.length} of {hazards.length} open reports shown.</p>}
        </section>
      </aside>

      <div className="relative order-1 h-[55vh] min-h-72 md:order-2 md:h-auto md:flex-1">
        <MapView center={center} hazards={shown} selectedId={selectedId} onSelectHazard={setSelectedId}
          routes={routes} activeRoute={active} onSelectRoute={setActive} user={user}
          picking={picking} picked={picked} onPick={(p) => { setPicked(p); setPicking(false); setReportOpen(true) }} />

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          <button onClick={() => { setReportOpen(true) }} className="rounded-lg bg-signal px-4 py-2.5 text-sm font-bold text-ink shadow-lg">Report a hazard</button>
          {user && <button onClick={() => setCenter({ ...user })} className="rounded-lg border border-line bg-ink/90 px-4 py-2 text-sm shadow-lg">My location</button>}
        </div>

        {picking && (
          <div className="absolute inset-x-3 top-3 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-lg bg-signal p-3 text-sm font-semibold text-ink shadow-lg" role="status">
            Tap the map to set the hazard location
            <button className="rounded border border-ink px-2 py-1" onClick={() => { setPicking(false); setReportOpen(true) }}>Cancel</button>
          </div>
        )}

        {selected && !picking && (
          <div className="absolute inset-x-3 bottom-3 max-h-[70%] overflow-auto shadow-2xl md:inset-x-auto md:right-3 md:w-96">
            <HazardPanel hazard={selected} onChange={replace} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>

      {reportOpen && (
        <ReportModal hidden={picking} pickedLocation={picked} userLocation={user}
          onPickRequest={() => { setPicking(true); setReportOpen(true) }}
          onClose={() => { setReportOpen(false); setPicking(false); setPicked(null) }}
          onSubmitted={(h) => { setHazards((l) => [h, ...l]); setSelectedId(h.id); setCenter({ lat: h.lat, lng: h.lng }) }} />
      )}
    </div>
  )
}
