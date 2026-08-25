/**
 * Centralized advance payment configuration for Chumki.
 * Launch rule: advance = delivery charge only.
 * Future: switch advancePaymentType to 'fixed' or 'percentage'.
 */
export const PAYMENT_CONFIG = {
  /** 'delivery_charge' | 'fixed' | 'percentage' */
  advancePaymentType: 'delivery_charge',
  /** Used when type is fixed (BDT) or percentage (0–100) */
  advancePaymentValue: null,
  methods: [
    { id: 'bkash', label: 'bKash' },
    { id: 'rocket', label: 'Rocket' },
  ],
  payToNumber: '01328030704',
  maxProofBytes: 5 * 1024 * 1024,
  acceptedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
}

/**
 * Calculate advance / remaining from order totals.
 * @returns {{ advance: number, remaining: number, total: number, deliveryCharge: number }}
 */
export function calculateAdvancePayment({ total = 0, deliveryCharge = 0 } = {}) {
  const orderTotal = Math.max(0, Number(total) || 0)
  const delivery = Math.max(0, Number(deliveryCharge) || 0)
  const type = PAYMENT_CONFIG.advancePaymentType
  const value = Number(PAYMENT_CONFIG.advancePaymentValue)

  let advance = 0
  if (type === 'delivery_charge') {
    advance = delivery
  } else if (type === 'fixed') {
    advance = Math.max(0, value || 0)
  } else if (type === 'percentage') {
    const pct = Math.min(100, Math.max(0, value || 0))
    advance = Math.round((orderTotal * pct) / 100)
  }

  advance = Math.min(advance, orderTotal)
  const remaining = Math.max(0, orderTotal - advance)

  return {
    advance,
    remaining,
    total: orderTotal,
    deliveryCharge: delivery,
  }
}

export function isAcceptedProofFile(file) {
  if (!file) return false
  if (file.size > PAYMENT_CONFIG.maxProofBytes) return false
  const mime = (file.type || '').toLowerCase()
  if (PAYMENT_CONFIG.acceptedMimeTypes.includes(mime)) return true
  const name = (file.name || '').toLowerCase()
  return PAYMENT_CONFIG.acceptedExtensions.some((ext) => name.endsWith(ext))
}

export function proofFileError(file) {
  if (!file) return 'Please upload a payment screenshot.'
  if (file.size > PAYMENT_CONFIG.maxProofBytes) {
    return 'That image is a bit large — please use a file under 5 MB.'
  }
  const mime = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  const okMime = PAYMENT_CONFIG.acceptedMimeTypes.includes(mime)
  const okExt = PAYMENT_CONFIG.acceptedExtensions.some((ext) =>
    name.endsWith(ext),
  )
  if (!okMime && !okExt) {
    return 'Please upload a JPG, PNG, or WEBP screenshot.'
  }
  return null
}
