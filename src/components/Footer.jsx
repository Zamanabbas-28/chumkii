import { Link, useNavigate, useLocation } from 'react-router-dom'
import { CONTACT } from '../data/contact'
import { scrollToId } from '../utils/format'
import InstagramIcon from './InstagramIcon'

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()

  const go = (id) => {
    if (location.pathname === '/') scrollToId(id)
    else navigate(`/#${id}`)
  }

  return (
    <footer className="border-t border-border-soft bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div>
          <Link to="/" className="font-display text-3xl text-ink">
            Chumki<span className="text-gold">✦</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
            Handcrafted with a little sparkle in Sylhet, Bangladesh ✨
            Delivery nationwide — Sylhet 6–7 days, elsewhere 10–12 days.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-soft">
          {[
            ['Shop', 'designs'],
            ['Custom Orders', 'customize'],
            ['Size Guide', 'size-guide'],
            ['About', 'about'],
            ['Contact', 'contact'],
          ].map(([label, id]) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className="transition hover:text-ink"
            >
              {label}
            </button>
          ))}
        </div>

        <a
          href={CONTACT.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition hover:text-dusty-rose"
        >
          <InstagramIcon size={18} />
          {CONTACT.instagramHandle}
        </a>
      </div>

      <div className="border-t border-border-soft/80 py-5 text-center text-xs text-ink-soft">
        © 2026 Chumki. All rights reserved.
      </div>
    </footer>
  )
}
