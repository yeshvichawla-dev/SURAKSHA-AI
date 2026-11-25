import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../lib/maps'

export interface Place { name: string; address: string; lat: number; lng: number }
type Item = { label: string; pred: google.maps.places.PlacePrediction }

export default function SearchBox({ onSelect }: { onSelect: (p: Place) => void }) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const justPicked = useRef(false)

  useEffect(() => {
    if (justPicked.current) { justPicked.current = false; return }
    if (q.trim().length < 3) { setItems([]); return }
    let dead = false
    const t = setTimeout(async () => {
      try {
        await loadGoogleMaps()
        token.current ??= new google.maps.places.AutocompleteSessionToken()
        const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q, sessionToken: token.current,
        })
        if (dead) return
        setErr(null)
        setItems(
          suggestions
            .filter((s) => s.placePrediction)
            .map((s) => ({ label: s.placePrediction!.text.toString(), pred: s.placePrediction! })),
        )
      } catch (e) {
        if (!dead) setErr(e instanceof Error ? e.message : 'Search failed.')
      }
    }, 300)
    return () => { dead = true; clearTimeout(t) }
  }, [q])

  async function choose(it?: Item) {
    if (!it) return
    setBusy(true)
    try {
      const place = it.pred.toPlace()
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] })
      if (!place.location) throw new Error('That place has no map location.')
      token.current = null
      justPicked.current = true
      setQ(it.label)
      setItems([])
      setErr(null)
      onSelect({
        name: place.displayName ?? it.label,
        address: place.formattedAddress ?? '',
        lat: place.location.lat(),
        lng: place.location.lng(),
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load that place.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <label htmlFor="dest" className="mb-1 block text-sm font-semibold">Where to?</label>
      <input
        id="dest" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); choose(items[0]) } }}
        placeholder="Search a destination or address"
        className="w-full rounded-lg border border-line bg-raise px-3 py-2.5 text-sm placeholder:text-mute"
      />
      {busy && <p className="mt-1 text-xs text-mute">Loading place…</p>}
      {err && <p className="mt-1 text-xs text-signal" role="alert">{err}</p>}
      {items.length > 0 && (
        <ul role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-panel shadow-xl">
          {items.map((it) => (
            <li key={it.label} role="option" aria-selected={false}>
              <button type="button" onClick={() => choose(it)} className="w-full px-3 py-2 text-left text-sm hover:bg-raise">
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
