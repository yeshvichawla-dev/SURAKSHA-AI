import type { Hazard } from '../types'
import { CAT, SEV, STATUS_LABEL, VERIFICATION_LABEL } from '../lib/constants'
import { freshness } from '../lib/format'

export function Pill({ color, children }: { color?: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={color ? { background: color, color: '#0b1623' } : { background: '#24405f', color: '#e6edf5' }}
    >
      {children}
    </span>
  )
}

export const SeverityPill = ({ s }: { s: Hazard['severity'] }) => <Pill color={SEV[s].color}>{SEV[s].label}</Pill>
export const CategoryLabel = ({ c }: { c: Hazard['category'] }) => <span>{CAT[c].glyph} {CAT[c].label}</span>

export function HazardMeta({ h }: { h: Hazard }) {
  const f = freshness(h.created_at)
  const tone = f.tone === 'good' ? '#6ee7b7' : f.tone === 'ok' ? '#fbbf24' : '#f43f5e'
  return (
    <div className="flex flex-wrap gap-1.5">
      <SeverityPill s={h.severity} />
      <Pill>{STATUS_LABEL[h.status]}</Pill>
      <Pill>{VERIFICATION_LABEL[h.verification]}</Pill>
      <Pill color={tone}>{f.label}</Pill>
      {h.is_demo && <Pill color="#ff7a1a">DEMO DATA</Pill>}
    </div>
  )
}
