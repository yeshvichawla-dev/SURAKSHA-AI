import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Hazard } from '../types'
import { getHazard } from '../lib/api'
import HazardPanel from '../components/HazardPanel'
import MapView from '../components/MapView'

export default function HazardDetail() {
  const { id = '' } = useParams()
  const [h, setH] = useState<Hazard | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setH(null); setErr(null)
    getHazard(id).then(setH).catch((e: Error) => setErr(e.message))
  }, [id])

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/community" className="text-sm text-route underline">Back to community reports</Link>
      {err && <p className="mt-6 text-signal" role="alert">{err}</p>}
      {!h && !err && <p className="mt-6 text-mute">Loading…</p>}
      {h && (
        <div className="mt-4 space-y-4">
          <HazardPanel hazard={h} onChange={setH} />
          <div className="h-72 overflow-hidden rounded-xl border border-line">
            <MapView center={{ lat: h.lat, lng: h.lng }} hazards={[h]} selectedId={h.id} zoom={16} />
          </div>
        </div>
      )}
    </main>
  )
}
