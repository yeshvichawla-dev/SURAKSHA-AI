import { FEATURE_STATUS } from '../lib/constants'

const email = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? 'you@example.com'

export default function About() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <h1 className="text-3xl font-bold">About Suraksha AI</h1>
      <section><h2 className="text-xl font-bold text-signal">Mission</h2><p className="mt-2 text-mute">Help people travel with better information about the road ahead, using routing from Google Maps and hazard reports from the community.</p></section>
      <section><h2 className="text-xl font-bold text-signal">The problem</h2><p className="mt-2 text-mute">Potholes, waterlogging, blocked lanes and construction cause delays, vehicle damage and accidents. Navigation apps mostly show traffic, not the condition of the road itself.</p></section>
      <section><h2 className="text-xl font-bold text-signal">Product vision</h2><p className="mt-2 text-mute">A citizen navigation app first, with a hazard intelligence layer that grows with reports. Later: image-based damage detection, duplicate matching with real models, and a dashboard road authorities can use to prioritise repairs.</p></section>
      <section>
        <h2 className="text-xl font-bold text-signal">Honest status</h2>
        <ul className="mt-2 space-y-1 text-sm">{FEATURE_STATUS.map((f) => <li key={f.name}><strong>{f.state}:</strong> {f.name}. <span className="text-mute">{f.note}</span></li>)}</ul>
        <p className="mt-3 text-sm text-mute">Suraksha AI has no government partnership, no satellite data and no live traffic source of its own. This is a web prototype. Native turn-by-turn navigation would need the Android or iOS Navigation SDK.</p>
      </section>
      <section><h2 className="text-xl font-bold text-signal">Contact</h2><p className="mt-2"><a className="text-route underline" href={`mailto:${email}`}>{email}</a></p></section>
    </main>
  )
}
