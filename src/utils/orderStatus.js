/**
 * Centralized customer-facing order & payment status labels.
 * Internal DB values must never be shown raw in the UI.
 */

export const ORDER_STATUS = {
  payment_pending: 'payment_pending',
  payment_verification: 'payment_verification',
  confirmed: 'confirmed',
  in_production: 'in_production',
  ready_for_delivery: 'ready_for_delivery',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
}

export const PAYMENT_STATUS = {
  pending_submission: 'pending_submission',
  verification_pending: 'verification_pending',
  verified: 'verified',
  rejected: 'rejected',
}

const ORDER_LABELS = {
  payment_pending: 'Payment Required',
  payment_verification: 'Awaiting Verification',
  confirmed: 'Order Confirmed',
  in_production: 'Preparing Your Chumki',
  ready_for_delivery: 'Ready for Delivery',
  shipped: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const ORDER_SUPPORT = {
  payment_pending:
    'To begin preparing your Chumki, please complete the advance payment and submit your payment proof.',
  payment_verification:
    "We've received your payment proof and it's currently awaiting verification. Once your payment is confirmed, we'll begin preparing your Chumki with care ✨",
  confirmed:
    "Your payment has been confirmed — we'll begin preparing your Chumki with care.",
  in_production: 'Your Chumki is being handcrafted with care.',
  ready_for_delivery: 'Your order is packed and ready to leave us.',
  shipped: 'Your Chumki is on its way to you.',
  delivered: 'Your order has been delivered. We hope you love it ✨',
  cancelled: 'This order has been cancelled.',
}

const PAYMENT_LABELS = {
  pending_submission: 'Payment Required',
  verification_pending: 'Awaiting Verification',
  verified: 'Payment Verified',
  rejected: 'Payment Not Verified',
}

const PAYMENT_SUPPORT = {
  pending_submission: 'Please submit your advance payment proof to continue.',
  verification_pending:
    'Your payment proof has been received and is being reviewed.',
  verified: 'Your payment has been verified.',
  rejected:
    "We couldn't verify this payment proof. Please check the details and submit your payment proof again.",
}

export function getOrderStatusLabel(status) {
  return ORDER_LABELS[status] || 'Order Update'
}

export function getOrderStatusSupport(status) {
  return ORDER_SUPPORT[status] || ''
}

export function getPaymentStatusLabel(status) {
  return PAYMENT_LABELS[status] || 'Payment Update'
}

export function getPaymentStatusSupport(status) {
  return PAYMENT_SUPPORT[status] || ''
}

/** Soft visual tone for badges — never alarm-style for verification. */
export function getOrderStatusTone(status) {
  switch (status) {
    case 'payment_pending':
      return 'soft'
    case 'payment_verification':
      return 'awaiting'
    case 'confirmed':
    case 'in_production':
    case 'ready_for_delivery':
    case 'shipped':
    case 'delivered':
      return 'positive'
    case 'cancelled':
      return 'muted'
    default:
      return 'soft'
  }
}
