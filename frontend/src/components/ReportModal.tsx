import { useEffect, useState } from 'react'
import type { Category, CreateResult, Hazard, LatLng, Severity } from '../types'
import { CATEGORIES, SEVERITIES } from '../lib/constants'
import { analyzeHazardPhoto, createHazard, type ImageAnalysis } from '../lib/api'

interface Props {
  hidden: boolean
  pickedLocation: LatLng | null
  userLocation: LatLng | null
  onPickRequest: () => void
  onClose: () => void
  onSubmitted: (h: Hazard) => void
}

type Step = 'form' | 'review' | 'done'

export default function ReportModal({ hidden, pickedLocation, userLocation, onPickRequest, onClose, onSubmitted }: Props) {
  const [step, setStep] = useState<Step>('form')
  const [category, setCategory] = useState<Category | null>(null)
  const [severity, setSeverity] = useState<Severity>('medium')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loc, setLoc] = useState<LatLng | null>(userLocation)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [result, setResult] = useState<CreateResult | null>(null)
  const [locMsg, setLocMsg] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<ImageAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { if (pickedLocation) setLoc(pickedLocation) }, [pickedLocation])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !hidden) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hidden, onClose])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  function useMyLocation() {
    setLocMsg('Finding your location…')
    navigator.geolocation?.getCurrentPosition(
      (p) => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocMsg(null) },
      () => setLocMsg('Could not get your location. Allow location access, or pick the spot on the map.'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
    if (!navigator.geolocation) setLocMsg('This browser does not support location. Pick the spot on the map.')
  }

  function onPhoto(f: File | undefined) {
    if (!f) return
    const e: Record<string, string> = { ...errors }
    delete e.photo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) e.photo = 'Use a JPEG, PNG or WebP image.'
    else if (f.size > 5 * 1024 * 1024) e.photo = 'The photo must be under 5 MB.'
    setErrors(e)
    if (e.photo) return
    setPhoto(f)
    setAiResult(null)
    setPreview(URL.createObjectURL(f))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!category) e.category = 'Choose a hazard type.'
    if (description.trim().length < 10) e.description = 'Describe the hazard in at least 10 characters.'
    if (description.length > 500) e.description = 'Keep the description under 500 characters.'
    if (!loc) e.location = 'Set the hazard location.'
    setErrors((prev) => ({ ...e, ...(prev.photo ? { photo: prev.photo } : {}) }))
    return Object.keys(e).length === 0
  }

  async function submit() {
    if (!category || !loc) return
    setSubmitting(true); setServerErr(null)
    const fd = new FormData()
    fd.append('category', category)
    fd.append('severity', severity)
    fd.append('description', description.trim())
    fd.append('lat', String(loc.lat))
    fd.append('lng', String(loc.lng))
    if (photo) fd.append('photo', photo)
    try {
      const r = await createHazard(fd)
      setResult(r)
      onSubmitted(r.hazard)
      setStep('done')
    } catch (e) {
      setServerErr(e instanceof Error ? e.message : 'Could not submit the report.')
    } finally { setSubmitting(false) }
  }

  const cat = CATEGORIES.find((c) => c.id === category)
  return (
    <div className={`${hidden ? 'hidden' : 'flex'} fixed inset-0 z-[60] items-end justify-center bg-black/60 sm:items-center`} role="dialog" aria-modal="true" aria-label="Report a road hazard">
      <div className="max-h-[92vh] w-full overflow-auto rounded-t-2xl border border-line bg-panel p-5 sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{step === 'done' ? 'Report submitted' : step === 'review' ? 'Review your report' : 'Report a road hazard'}</h2>
          <button onClick={onClose} className="rounded-md border border-line px-2 py-1 text-sm">Close</button>
        </div>

        {step === 'form' && (
          <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); if (validate()) setStep('review') }} noValidate>
            <fieldset>
              <legend className="mb-1 text-sm font-semibold">Hazard type</legend>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => (
                  <button type="button" key={c.id} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${category === c.id ? 'border-signal bg-raise' : 'border-line'}`}>
                    {c.glyph} {c.label}
                  </button>
                ))}
              </div>
              {errors.category && <p className="mt-1 text-xs text-signal" role="alert">{errors.category}</p>}
            </fieldset>

            <div>
              <label htmlFor="sev" className="mb-1 block text-sm font-semibold">How severe does it look?</label>
              <select id="sev" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} className="w-full rounded-lg border border-line bg-raise px-3 py-2 text-sm">
                {SEVERITIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <p className="mt-1 text-xs text-mute">This is your own estimate. No AI assesses severity yet.</p>
            </div>

            <div>
              <label htmlFor="desc" className="mb-1 block text-sm font-semibold">Description</label>
              <textarea id="desc" rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="What is it, and where exactly on the road?" className="w-full rounded-lg border border-line bg-raise px-3 py-2 text-sm placeholder:text-mute" />
              {errors.description && <p className="mt-1 text-xs text-signal" role="alert">{errors.description}</p>}
            </div>

            <div>
              <label htmlFor="photo" className="mb-1 block text-sm font-semibold">Photo (optional)</label>
              <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onPhoto(e.target.files?.[0])} className="block w-full text-sm" />
              {preview && <img src={preview} alt="Selected hazard" className="mt-2 max-h-40 rounded-lg" />}
              {errors.photo && <p className="mt-1 text-xs text-signal" role="alert">{errors.photo}</p>}
              <div className="mt-2 space-y-2">
                <button type="button" disabled={!photo || aiLoading} onClick={async () => { if (!photo) return; setAiLoading(true); setAiResult(null); try { setAiResult(await analyzeHazardPhoto(photo)) } catch (err) { setAiResult({ available: false, status: 'error', message: err instanceof Error ? err.message : 'AI analysis failed.', predictions: [] }) } finally { setAiLoading(false) } }} className="rounded-lg border border-line px-3 py-2 text-sm disabled:opacity-50">{aiLoading ? 'Analysing photo…' : '✨ Analyse photo with AI'}</button>
                {aiResult && <div className="rounded-lg border border-line bg-raise p-3 text-xs" role="status"><p className="font-semibold">{aiResult.available ? 'AI suggestion' : 'AI unavailable'}</p><p className="mt-1">{aiResult.message}</p>{aiResult.predictions.map((item, i) => <div key={i} className="mt-2 space-y-1"><p>Possible hazard: {item.hazard_detected ? 'Detected' : 'Not clearly detected'}</p><p>Suggested category: {item.category ?? 'Unknown'}</p><p>Suggested severity: {item.severity_suggestion ?? 'Unknown'}</p>{typeof item.confidence === 'number' && <p>Confidence: {Math.round(item.confidence * 100)}%</p>}<p>{item.explanation}</p></div>)}<p className="mt-2 text-mute">AI output is an unverified suggestion. Check the image and choose the report details yourself.</p></div>}
                <p className="text-xs text-mute">AI photo analysis is optional and requires a Gemini API key in the backend. Manual reporting works without it.</p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm font-semibold">Location</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={useMyLocation} className="rounded-lg border border-line px-3 py-2 text-sm">Use my location</button>
                <button type="button" onClick={onPickRequest} className="rounded-lg border border-line px-3 py-2 text-sm">Pick on the map</button>
              </div>
              <p className="mt-1 text-sm">{loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : 'No location set yet.'}</p>
              {locMsg && <p className="text-xs text-mute" role="status">{locMsg}</p>}
              {errors.location && <p className="mt-1 text-xs text-signal" role="alert">{errors.location}</p>}
            </div>

            <button type="submit" className="w-full rounded-lg bg-signal py-3 font-semibold text-ink">Review report</button>
          </form>
        )}

        {step === 'review' && (
          <div className="mt-4 space-y-3 text-sm">
            <p><span className="text-mute">Type: </span>{cat?.glyph} {cat?.label}</p>
            <p><span className="text-mute">Severity (your estimate): </span>{severity}</p>
            <p><span className="text-mute">Description: </span>{description.trim()}</p>
            <p><span className="text-mute">Location: </span>{loc?.lat.toFixed(5)}, {loc?.lng.toFixed(5)}</p>
            {preview && <img src={preview} alt="Selected hazard" className="max-h-40 rounded-lg" />}
            <p className="text-xs text-mute">Your report will appear as unverified until other people confirm it.</p>
            {serverErr && <p className="text-signal" role="alert">{serverErr}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep('form')} disabled={submitting} className="flex-1 rounded-lg border border-line py-3">Edit</button>
              <button onClick={submit} disabled={submitting} className="flex-1 rounded-lg bg-signal py-3 font-semibold text-ink disabled:opacity-60">
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-route" role="status">Your report is in. Report ID: <strong>{result.hazard.id}</strong></p>
            <p className="text-mute">Status: Active · Unverified. It shows on the map now.</p>
            {result.possible_duplicates.length > 0 && (
              <p className="rounded-lg border border-line bg-raise p-3">
                Heads up: {result.possible_duplicates.length} similar report(s) of the same type exist within 50 m
                ({result.possible_duplicates.map((d) => d.id).join(', ')}). Matching uses distance only.
              </p>
            )}
            <button onClick={onClose} className="w-full rounded-lg bg-signal py-3 font-semibold text-ink">Back to the map</button>
          </div>
        )}
      </div>
    </div>
  )
}
