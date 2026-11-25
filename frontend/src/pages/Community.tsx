import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Category, Hazard, LatLng } from '../types'
import { CAT, CATEGORIES } from '../lib/constants'
import { getHazards } from '../lib/api'
import { haversine } from '../lib/geo'
import { fmtDistance, timeAgo } from '../lib/format'
import { HazardMeta } from '../components/Badges'

export default function Community() {
  const [all, setAll] = useState<Hazard[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [status, setStatus] = useState('active,under_review')
  const [here, setHere] = useState<LatLng | null>(null)
  const [nearest, setNearest] = useState(false)
  const [locMsg, setLocMsg] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getHazards(status).then((d) => { setAll(d); setErr(null) }).catch((e: Error) => setErr(e.message)).finally(() => setLoading(false))
  }, [status])

  function sortNearest() {
    if (nearest) { setNearest(false); return }
    setLocMsg('Finding your location…')
    navigator.geolocation?.getCurrentPosition(
      (p) => { setHere({ lat: p.coords.latitude, lng: p.coords.longitude }); setNearest(true); setLocMsg(null) },
      () => setLocMsg('Could not get your location. Allow location access to sort by distance.'),
    )
    if (!navigator.geolocation) setLocMsg('This browser does not support location.')
  }

  const list = useMemo(() => {
    const f = all.filter((h) => cat === 'all' || h.category === cat)
    return nearest && here ? [...f].sort((a, b) => haversine(here, a) - haversine(here, b)) : f
  }, [all, cat, nearest, here])

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Community reports</h1>
      <p className="mt-1 text-mute">Reports from people on the road. Open one to confirm it or flag it as resolved.</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-line bg-raise px-3 py-2 text-sm">
          <option value="active,under_review">Open reports</option>
          <option value="active">Active only</option>
          <option value="under_review">Under review</option>
          <option value="resolved">Resolved</option>
          <option value="active,under_review,resolved">All</option>
        </select>
        <button onClick={sortNearest} aria-pressed={nearest} className={`rounded-lg border px-3 py-2 text-sm ${nearest ? 'border-route bg-raise' : 'border-line'}`}>Nearest first</button>
        {locMsg && <span className="text-xs text-mute" role="status">{locMsg}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[{ id: 'all' as const, label: 'All types', glyph: '' }, ...CATEGORIES].map((c) => (
          <button key={c.id} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}
            className={`rounded-full border px-3 py-1 text-xs ${cat === c.id ? 'border-route bg-raise' : 'border-line text-mute'}`}>{c.glyph} {c.label}</button>
        ))}
      </div>

      {loading && <p className="mt-8 text-mute">Loading reports…</p>}
      {err && <p className="mt-8 text-signal" role="alert">{err}</p>}
      {!loading && !err && list.length === 0 && (
        <p className="mt-8 text-mute">No reports match these filters. <Link to="/app" className="text-route underline">Open the map</Link> to report one.</p>
      )}
      <ul className="mt-6 space-y-3">
        {list.map((h) => (
          <li key={h.id}>
            <Link to={`/hazard/${h.id}`} className="block rounded-xl border border-line bg-panel p-4 hover:border-route">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-semibold">{CAT[h.category].glyph} {CAT[h.category].label}</h2>
                <span className="text-xs text-mute">{timeAgo(h.created_at)}{nearest && here ? ` · ${fmtDistance(haversine(here, h))} away` : ''}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-mute">{h.description}</p>
              <div className="mt-2"><HazardMeta h={h} /></div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
