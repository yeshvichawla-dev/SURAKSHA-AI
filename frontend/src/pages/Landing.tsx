import { Link } from 'react-router-dom'
import { FEATURE_STATUS } from '../lib/constants'

const features = [
  ['Map-first navigation', 'Open the map, see where you are, search a destination and compare routes.'],
  ['A hazard layer on top', 'Potholes, waterlogging, blockages, accidents and construction, reported by people on the road.'],
  ['Report in under a minute', 'Pick a type, describe it, add a photo and a location, submit.'],
  ['Hazards per route', 'See how many reported hazards sit within 150 m of each route before you leave.'],
]
const steps = [
  'Allow location and search where you are going.',
  'Compare routes. Each shows travel time, distance and reported hazards nearby.',
  'Tap a marker for details. Confirm it if it is still there.',
  'Report new hazards so the next driver knows.',
]
const tech = ['React + TypeScript + Tailwind', 'Google Maps JavaScript, Places (New) and Routes APIs', 'FastAPI (Python)', 'PostgreSQL, with an optional PostGIS spatial index', 'Python AI module (architecture only, no model yet)']
const email = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? 'you@example.com'

export default function Landing() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Navigate Smarter. Detect Hazards. Travel Safer.</h1>
          <p className="mt-5 max-w-md text-mute">
            Suraksha AI is a navigation app with a road-hazard layer. See what other people have reported on your route before you drive into it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/app" className="rounded-lg bg-signal px-6 py-3 font-semibold text-ink hover:brightness-110">Open the app</Link>
            <a href="#status" className="rounded-lg border border-line px-6 py-3 hover:bg-raise">What works today</a>
          </div>
        </div>
        <svg viewBox="0 0 420 320" role="img" aria-label="Illustration: a route with two hazard markers" className="w-full rounded-2xl border border-line bg-panel">
          <path d="M0 250 L420 90 M60 0 L150 320 M280 0 L330 320 M0 140 L420 200" stroke="#1b3350" strokeWidth="10" fill="none" />
          <path className="draw" d="M30 270 C 120 250, 130 150, 210 150 S 320 90, 392 56" fill="none" stroke="#2dd4bf" strokeWidth="7" strokeLinecap="round" />
          <circle cx="30" cy="270" r="9" fill="#3b82f6" stroke="#fff" strokeWidth="3" />
          <circle cx="392" cy="56" r="9" fill="#e6edf5" />
          <g transform="translate(140 175)"><circle r="17" fill="#ff7a1a" stroke="#fb923c" strokeWidth="3" /><text textAnchor="middle" y="6" fontSize="16">🕳️</text></g>
          <g transform="translate(292 108)"><circle r="17" fill="#3b9eff" stroke="#f43f5e" strokeWidth="3" /><text textAnchor="middle" y="6" fontSize="16">🌊</text></g>
          <text x="14" y="308" fill="#93a8be" fontSize="11">Illustration, not real data</text>
        </svg>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 md:grid-cols-2">
        <div className="rounded-xl border border-line p-6">
          <h2 className="text-xl font-bold text-signal">The problem</h2>
          <p className="mt-2 text-mute">Maps show traffic. They rarely show the pothole you cannot avoid, the flooded underpass or the lane blocked by a fallen tree.</p>
        </div>
        <div className="rounded-xl border border-line p-6">
          <h2 className="text-xl font-bold text-route">The solution</h2>
          <p className="mt-2 text-mute">Routing from Google Maps, plus a hazard layer built from community reports with severity, freshness and confirmations.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <h2 className="mb-5 text-2xl font-bold">What you can do</h2>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {features.map(([t, d]) => (
            <div key={t} className="border-l-2 border-signal pl-4"><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-mute">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <h2 className="mb-5 text-2xl font-bold">How it works</h2>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-raise text-sm font-bold text-route">{i + 1}</span><span className="pt-0.5 text-mute">{s}</span></li>
          ))}
        </ol>
      </section>

      <section id="status" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-14">
        <h2 className="mb-2 text-2xl font-bold">What works today, and what does not</h2>
        <p className="mb-5 max-w-2xl text-sm text-mute">This is a web prototype. AI features are planned, and no machine-learning model runs yet.</p>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel text-mute"><tr><th className="p-3">Feature</th><th className="p-3">State</th><th className="hidden p-3 sm:table-cell">Note</th></tr></thead>
            <tbody>
              {FEATURE_STATUS.map((f) => (
                <tr key={f.name} className="border-t border-line">
                  <td className="p-3">{f.name}</td>
                  <td className={`p-3 font-semibold ${f.state === 'Working' ? 'text-route' : f.state === 'Planned' || f.state === 'Future' ? 'text-mute' : 'text-signal'}`}>{f.state}</td>
                  <td className="hidden p-3 text-mute sm:table-cell">{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <h2 className="mb-3 text-2xl font-bold">Technology</h2>
        <ul className="list-disc space-y-1 pl-5 text-mute">{tech.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-2xl bg-raise p-8 text-center">
          <h2 className="text-2xl font-bold">See the hazards on your route</h2>
          <Link to="/app" className="mt-4 inline-block rounded-lg bg-signal px-6 py-3 font-semibold text-ink">Open the app</Link>
        </div>
      </section>

      <footer id="contact" className="border-t border-line py-8 text-center text-sm text-mute">
        Questions or feedback: <a className="text-route underline" href={`mailto:${email}`}>{email}</a>
        <p className="mt-1">Suraksha AI is an independent prototype. It has no government partnership.</p>
      </footer>
    </main>
  )
}
