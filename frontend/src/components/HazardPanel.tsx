import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Hazard } from '../types'
import { CAT, VERIFICATION_NOTE } from '../lib/constants'
import { assetUrl, confirmHazard, flagResolved } from '../lib/api'
import { timeAgo } from '../lib/format'
import { HazardMeta } from './Badges'

const votedKey = 'suraksha_voted'
const voted = (): string[] => { try { return JSON.parse(localStorage.getItem(votedKey) ?? '[]') } catch { return [] } }
const markVoted = (k: string) => { try { localStorage.setItem(votedKey, JSON.stringify([...voted(), k])) } catch { /* storage unavailable */ } }

interface Props { hazard: Hazard; onChange: (h: Hazard) => void; onClose?: () => void }

export default function HazardPanel({ hazard: h, onChange, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const c = CAT[h.category]
  const done = voted()
  const confirmed = done.includes(`${h.id}:c`)
  const flagged = done.includes(`${h.id}:f`)

  async function act(kind: 'c' | 'f') {
    setBusy(true); setMsg(null)
    try {
      const updated = await (kind === 'c' ? confirmHazard(h.id) : flagResolved(h.id))
      markVoted(`${h.id}:${kind}`)
      onChange(updated)
      setMsg({ ok: true, text: kind === 'c' ? 'Thanks, your confirmation was added.' : 'Thanks, your report was recorded.' })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong.' })
    } finally { setBusy(false) }
  }

  const photo = assetUrl(h.photo_url)
  return (
    <section className="rounded-xl border border-line bg-panel p-4" aria-label="Hazard details">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{c.glyph} {c.label}</h2>
          <p className="text-xs text-mute">Report {h.id} · {timeAgo(h.created_at)}</p>
        </div>
        {onClose && <button onClick={onClose} className="rounded-md border border-line px-2 py-1 text-sm" aria-label="Close details">Close</button>}
      </div>
      <div className="mt-3"><HazardMeta h={h} /></div>
      <p className="mt-3 text-sm">{h.description}</p>
      {photo && <img src={photo} alt={`Photo submitted with report ${h.id}`} className="mt-3 max-h-56 w-full rounded-lg object-cover" />}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-mute">
        <div><dt>Confirmations</dt><dd className="text-sm text-fog">{h.confirmations}</dd></div>
        <div><dt>Flagged resolved or wrong</dt><dd className="text-sm text-fog">{h.resolved_flags}</dd></div>
        <div className="col-span-2"><dt>Reported</dt><dd className="text-sm text-fog">{new Date(h.created_at).toLocaleString()}</dd></div>
        <div className="col-span-2"><dt>Location</dt><dd className="text-sm text-fog">{h.lat.toFixed(5)}, {h.lng.toFixed(5)}</dd></div>
      </dl>
      <p className="mt-2 text-xs text-mute">{VERIFICATION_NOTE[h.verification]}</p>
      {h.status !== 'resolved' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={busy || confirmed} onClick={() => act('c')} className="rounded-lg bg-route px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50">
            {confirmed ? 'You confirmed this' : 'Still there, confirm'}
          </button>
          <button disabled={busy || flagged} onClick={() => act('f')} className="rounded-lg border border-line px-3 py-2 text-sm disabled:opacity-50">
            {flagged ? 'You flagged this' : 'Resolved or incorrect'}
          </button>
        </div>
      )}
      {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-route' : 'text-signal'}`} role="status">{msg.text}</p>}
      {onClose && <Link to={`/hazard/${h.id}`} className="mt-3 inline-block text-sm text-route underline">Open full page</Link>}
    </section>
  )
}
