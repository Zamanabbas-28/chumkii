import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CONTACT } from '../data/contact'
import { scrollToId } from '../utils/format'
import { useCart } from '../context/CartContext'
import InstagramIcon from './InstagramIcon'

const links = [
  { label: 'Shop', id: 'designs' },
  { label: 'Customize', id: 'customize' },
  { label: 'Size Guide', id: 'size-guide' },
  { label: 'About', id: 'about' },
  { label: 'Contact', id: 'contact' },
]

export default function Navbar({ solid = false }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { itemCount, setCartOpen, justAdded } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const onHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const go = (id) => {
    setOpen(false)
    if (onHome) {
      scrollToId(id)
    } else {
      navigate(`/#${id}`)
    }
  }

  const elevated = solid || scrolled || open

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        elevated
          ? 'bg-ivory/95 shadow-sm backdrop-blur-md'
          : 'bg-ivory/80 backdrop-blur-sm'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="font-display text-2xl tracking-wide text-ink sm:text-3xl"
          aria-label="Chumki home"
        >
          Chumki
          <span className="ml-0.5 text-gold">✦</span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => go(link.id)}
                className="text-sm font-medium text-ink-soft transition hover:text-ink"
              >
                {link.label}
              </button>
            </li>
          ))}
          <li>
            <a
              href={CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-ink-soft transition hover:text-dusty-rose"
              aria-label="Follow Chumki on Instagram"
            >
              <InstagramIcon size={18} strokeWidth={1.75} />
            </a>
          </li>
          <li>
            <motion.button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-cream"
              aria-label={`Open cart (${itemCount} items)`}
              animate={justAdded ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <ShoppingBag size={20} strokeWidth={1.75} />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-dusty-rose px-1 text-[10px] font-bold text-ivory">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </motion.button>
          </li>
        </ul>

        <div className="flex items-center gap-1 md:hidden">
          <motion.button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink"
            aria-label={`Open cart (${itemCount} items)`}
            animate={justAdded ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-dusty-rose px-1 text-[10px] font-bold text-ivory">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </motion.button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border-soft bg-ivory md:hidden"
          >
            <ul className="flex flex-col px-4 py-4">
              {links.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => go(link.id)}
                    className="w-full py-3.5 text-left text-base font-medium text-ink"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li className="pt-2">
                <a
                  href={CONTACT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 py-3 text-dusty-rose"
                >
                  <InstagramIcon size={18} />
                  {CONTACT.instagramHandle}
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
