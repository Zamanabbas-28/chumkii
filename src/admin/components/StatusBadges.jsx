import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getOrderStatusTone,
} from '../../utils/orderStatus'

const TONE = {
  soft: 'bg-cream text-ink-soft border-border-soft',
  awaiting: 'bg-soft-lavender/50 text-ink border-lavender/40',
  positive: 'bg-emerald/10 text-emerald border-emerald/30',
  muted: 'bg-cream/60 text-ink-soft border-border-soft',
}

export function OrderStatusBadge({ status }) {
  const tone = TONE[getOrderStatusTone(status)] || TONE.soft
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}
    >
      {getOrderStatusLabel(status)}
    </span>
  )
}

export function PaymentStatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex rounded-full border border-border-soft bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
        Unpaid
      </span>
    )
  }
  const tone =
    status === 'verified'
      ? TONE.positive
      : status === 'rejected'
        ? 'bg-blush/20 text-dusty-rose border-dusty-rose/30'
        : status === 'verification_pending'
          ? TONE.awaiting
          : TONE.soft
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}
    >
      {getPaymentStatusLabel(status)}
    </span>
  )
}
