import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/app', label: 'Navigate' },
  { to: '/community', label: 'Community' },
  { to: '/admin', label: 'Authority' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const cls = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-raise text-signal' : 'text-mute hover:text-fog'}`
  return (
    <header className="sticky top-0 z-50 h-14 border-b border-line bg-ink/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-display text-lg font-extrabold text-fog" onClick={() => setOpen(false)}>
          Suraksha<span className="text-signal"> AI</span>
        </Link>
        <nav className="hidden gap-1 sm:flex" aria-label="Main">
          {links.map((l) => <NavLink key={l.to} to={l.to} className={cls}>{l.label}</NavLink>)}
        </nav>
        <button
          className="rounded-md border border-line px-3 py-1.5 text-sm sm:hidden"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      {open && (
        <nav className="absolute inset-x-0 top-14 flex flex-col gap-1 border-b border-line bg-ink p-3 sm:hidden" aria-label="Mobile">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={cls} onClick={() => setOpen(false)}>{l.label}</NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
