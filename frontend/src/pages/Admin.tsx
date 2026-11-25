import { useCallback, useEffect, useState } from 'react'
import type { AdminStats, Hazard, HazardStatus, Verification } from '../types'
import { CAT, CATEGORIES, SEVERITIES, STATUS_LABEL, VERIFICATION_LABEL } from '../lib/constants'
import { adminCheck, adminStats, adminUpdate, getAdminToken, getHazards, setAdminToken } from '../lib/api'
import { SeverityPill, Pill } from '../components/Badges'
import MapView from '../components/MapView'
import { timeAgo } from '../lib/format'

function Bars({ data, colors, labels }: { data: Record<string, number>; colors: Record<string, string>; labels: Record<string, string> }) {
  const max = Math.max(1, ...Object.values(data))
  const keys = Object.keys(labels)
  return (
    <ul className="space-y-2">
      {keys.map((k) => (
        <li key={k} className="text-sm">
          <div className="flex justify-between"><span>{labels[k]}</span><span>{data[k] ?? 0}</span></div>
          <div className="h-2 rounded bg-raise"><div className="h-2 rounded" style={{ width: `${((data[k] ?? 0) / max) * 100}%`, background: colors[k] }} /></div>
        </li>
      ))}
    </ul>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [token, setToken] = useState(getAdminToken())
  const [authErr, setAuthErr] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([adminStats(), getHazards('active,under_review,resolved')])
      setStats(s); setHazards(h); setErr(null)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not load data.') }
  }, [])

  useEffect(() => { if (getAdminToken()) adminCheck().then(() => setAuthed(true)).catch(() => setAdminToken('')) }, [])
  useEffect(() => { if (authed) load() }, [authed, load])

  async function login(e: React.FormEvent) {
    e.preventDefault(); setAuthErr(null)
    setAdminToken(token.trim())
    try { await adminCheck(); setAuthed(true) } catch (x) { setAdminToken(''); setAuthErr(x instanceof Error ? x.message : 'Login failed.') }
  }

  async function update(id: string, body: { status?: HazardStatus; verification?: Verification }) {
    setBusyId(id)
    try { await adminUpdate(id, body); await load() } catch (e) { setErr(e instanceof Error ? e.message : 'Update failed.') } finally { setBusyId(null) }
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold">Authority dashboard</h1>
        <p className="mt-2 text-sm text-mute">For road-authority or admin use. Enter the admin token set in <code>backend/.env</code>.</p>
        <form onSubmit={login} className="mt-5 space-y-3">
          <label htmlFor="tok" className="block text-sm font-semibold">Admin token</label>
          <input id="tok" type="password" value={token} onChange={(e) => setToken(e.target.value)} className="w-full rounded-lg border border-line bg-raise px-3 py-2" />
          {authErr && <p className="text-sm text-signal" role="alert">{authErr}</p>}
          <button className="w-full rounded-lg bg-signal py-2.5 font-semibold text-ink">Sign in</button>
        </form>
      </main>
    )
  }

  const catLabels = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))
  const catColors = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.color]))
  const sevLabels = Object.fromEntries(SEVERITIES.map((s) => [s.id, s.label]))
  const sevColors = Object.fromEntries(SEVERITIES.map((s) => [s.id, s.color]))
  const mid = hazards.length ? { lat: hazards.reduce((a, h) => a + h.lat, 0) / hazards.length, lng: hazards.reduce((a, h) => a + h.lng, 0) / hazards.length } : { lat: 28.6139, lng: 77.209 }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Authority dashboard</h1>
        <button onClick={() => { setAdminToken(''); setAuthed(false); setStats(null) }} className="rounded-lg border border-line px-3 py-2 text-sm">Sign out</button>
      </div>
      {err && <p className="text-signal" role="alert">{err}</p>}
      {!stats && !err && <p className="text-mute">Loading…</p>}
      {stats && (
        <>
          {stats.demo_count > 0 && <p className="rounded-lg border border-signal p-3 text-sm">{stats.demo_count} of {stats.total} reports are DEMO DATA added by the seed script.</p>}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[['Total reports', stats.total], ['Active', stats.active], ['Resolved', stats.resolved], ['High or critical, open', stats.high_severity_open]].map(([l, v]) => (
              <div key={l as string} className="rounded-xl border border-line bg-panel p-4"><p className="text-sm text-mute">{l}</p><p className="text-3xl font-bold">{v}</p></div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-line bg-panel p-4"><h2 className="mb-3 font-semibold">Reports by category</h2><Bars data={stats.by_category} colors={catColors} labels={catLabels} /></section>
            <section className="rounded-xl border border-line bg-panel p-4"><h2 className="mb-3 font-semibold">Severity</h2><Bars data={stats.by_severity} colors={sevColors} labels={sevLabels} /></section>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-line bg-panel p-4">
              <h2 className="font-semibold">Maintenance priority</h2>
              <p className="mb-3 text-xs text-mute">{stats.priority_formula}</p>
              {stats.priority_queue.length === 0 ? <p className="text-sm text-mute">No open hazards.</p> : (
                <ol className="space-y-1 text-sm">{stats.priority_queue.map((h) => <li key={h.id}>{CAT[h.category].glyph} {CAT[h.category].label} <SeverityPill s={h.severity} /> <span className="text-mute">· {h.confirmations} confirmations · {h.id}</span></li>)}</ol>
              )}
            </section>
            <section className="rounded-xl border border-line bg-panel p-4">
              <h2 className="font-semibold">Frequently reported locations</h2>
              <p className="mb-3 text-xs text-mute">Open reports grouped into cells of roughly 110 m. Shown when a cell has 2 or more.</p>
              {stats.hotspots.length === 0 ? <p className="text-sm text-mute">No location has 2 or more open reports yet.</p> : (
                <ul className="space-y-1 text-sm">{stats.hotspots.map((s) => <li key={`${s.lat},${s.lng}`}>{s.count} reports near {s.lat}, {s.lng}</li>)}</ul>
              )}
            </section>
          </div>

          <section>
            <h2 className="mb-2 font-semibold">Hazard distribution</h2>
            <div className="h-80 overflow-hidden rounded-xl border border-line"><MapView center={mid} hazards={hazards.filter((h) => h.status !== 'resolved')} zoom={11} /></div>
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Review and manage reports</h2>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-panel text-mute"><tr><th className="p-3">Report</th><th className="p-3">Severity</th><th className="p-3">Status</th><th className="p-3">Verification</th><th className="p-3">Reported</th></tr></thead>
                <tbody>
                  {hazards.map((h) => (
                    <tr key={h.id} className="border-t border-line align-top">
                      <td className="p-3"><p>{CAT[h.category].glyph} {CAT[h.category].label} {h.is_demo && <Pill color="#ff7a1a">DEMO</Pill>}</p><p className="text-xs text-mute">{h.id}</p></td>
                      <td className="p-3"><SeverityPill s={h.severity} /></td>
                      <td className="p-3">
                        <select aria-label={`Status for ${h.id}`} disabled={busyId === h.id} value={h.status} onChange={(e) => update(h.id, { status: e.target.value as HazardStatus })} className="rounded border border-line bg-raise px-2 py-1">
                          {(Object.keys(STATUS_LABEL) as HazardStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <select aria-label={`Verification for ${h.id}`} disabled={busyId === h.id} value={h.verification} onChange={(e) => update(h.id, { verification: e.target.value as Verification })} className="rounded border border-line bg-raise px-2 py-1">
                          {(Object.keys(VERIFICATION_LABEL) as Verification[]).map((s) => <option key={s} value={s}>{VERIFICATION_LABEL[s]}</option>)}
                        </select>
                      </td>
                      <td className="p-3 text-mute">{timeAgo(h.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
