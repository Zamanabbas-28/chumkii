import { motion, useReducedMotion } from 'framer-motion'
import {
  getOrderStatusLabel,
  getOrderStatusSupport,
  getOrderStatusTone,
} from '../utils/orderStatus'

const TONE_CLASS = {
  soft: 'bg-cream text-ink border-border-soft',
  awaiting: 'bg-soft-lavender/50 text-ink border-soft-lavender',
  positive: 'bg-emerald/10 text-ink border-emerald/25',
  muted: 'bg-cream/80 text-ink-soft border-border-soft',
}

/**
 * Reusable customer-facing order status badge + support copy.
 */
export default function OrderStatus({
  status,
  supportText,
  showSparkle = false,
  className = '',
}) {
  const reduceMotion = useReducedMotion()
  const label = getOrderStatusLabel(status)
  const support = supportText ?? getOrderStatusSupport(status)
  const tone = getOrderStatusTone(status)
  const badgeClass = TONE_CLASS[tone] || TONE_CLASS.soft

  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-gold">
        Order Status
      </p>
      <motion.div
        key={status}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`mt-2 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${badgeClass}`}
      >
        {(showSparkle || status === 'payment_verification' || status === 'confirmed') && (
          <span aria-hidden>✨</span>
        )}
        <span>{label}</span>
      </motion.div>
      {support ? (
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          {support}
        </p>
      ) : null}
    </div>
  )
}
