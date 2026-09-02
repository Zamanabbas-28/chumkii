import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  PAYMENT_CONFIG,
  isAcceptedProofFile,
  proofFileError,
} from '../config/paymentConfig'
import { LAST_ORDER_KEY } from '../utils/shipping'

function friendlyPaymentError(err) {
  const msg = String(err?.message || err || '')
  if (msg.includes('INVALID_TOKEN')) {
    return 'We could not find this order. Please use the link from checkout.'
  }
  if (msg.includes('INVALID_METHOD')) {
    return 'Please choose bKash or Rocket.'
  }
  if (msg.includes('INVALID_PROOF') || msg.includes('INVALID_PROOF_PATH')) {
    return 'Please upload a clear payment screenshot and try again.'
  }
  if (msg.includes('ALREADY_VERIFIED')) {
    return 'This payment has already been verified.'
  }
  if (msg.includes('ALREADY_SUBMITTED')) {
    return 'Your payment proof is already awaiting verification.'
  }
  if (msg.includes('ORDER_NOT_PAYABLE')) {
    return 'This order is no longer awaiting payment.'
  }
  if (!isSupabaseConfigured()) {
    return 'Payment is temporarily unavailable. Please try again shortly.'
  }
  return "We couldn't submit your payment proof right now. Please check your connection and try again."
}

function extFromFile(file) {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.png')) return 'png'
  if (name.endsWith('.webp')) return 'webp'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'jpg'
  const mime = (file.type || '').toLowerCase()
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  return 'jpg'
}

function contentTypeForFile(file, ext) {
  const mime = (file.type || '').toLowerCase()
  if (mime.startsWith('image/')) {
    if (mime === 'image/jpg') return 'image/jpeg'
    return mime
  }
  const map = {
    png: 'image/png',
    webp: 'image/webp',
    jpg: 'image/jpeg',
  }
  return map[ext] || 'image/jpeg'
}

/**
 * Load order summary for the payment page (token-gated RPC).
 */
export async function fetchOrderForPayment(orderNumber, paymentToken) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: friendlyPaymentError(new Error('not configured')) }
  }
  if (!orderNumber || !paymentToken) {
    return { ok: false, error: 'Missing order details. Please return to checkout.' }
  }

  try {
    const { data, error } = await supabase.rpc('get_order_for_payment', {
      p_order_number: orderNumber,
      p_payment_token: paymentToken,
    })

    if (error) {
      return { ok: false, error: friendlyPaymentError(error) }
    }
    if (!data) {
      return {
        ok: false,
        error: 'We could not find this order. Please use the link from checkout.',
      }
    }

    return { ok: true, order: data }
  } catch (err) {
    return { ok: false, error: friendlyPaymentError(err) }
  }
}

/**
 * Upload payment screenshot to private payment-proofs bucket.
 * Path: {orderId}/{timestamp}-{uuid}.{ext}
 */
export async function uploadPaymentProof({ orderId, file }) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: friendlyPaymentError(new Error('not configured')) }
  }

  const fileErr = proofFileError(file)
  if (fileErr) return { ok: false, error: fileErr }
  if (!isAcceptedProofFile(file)) {
    return { ok: false, error: 'Please upload a JPG, PNG, or WEBP screenshot.' }
  }
  if (!orderId) {
    return { ok: false, error: 'Missing order details.' }
  }

  const ext = extFromFile(file)
  const stamp = Date.now()
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${stamp}-${Math.random().toString(36).slice(2, 10)}`
  const path = `${orderId}/${stamp}-${id}.${ext}`

  try {
    const { error } = await supabase.storage
      .from('payment-proofs')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentTypeForFile(file, ext),
      })

    if (error) {
      return { ok: false, error: friendlyPaymentError(error) }
    }

    return { ok: true, path }
  } catch (err) {
    return { ok: false, error: friendlyPaymentError(err) }
  }
}

/**
 * Submit payment proof after successful storage upload.
 */
export async function submitPaymentProof({
  orderNumber,
  paymentToken,
  paymentMethod,
  transactionId,
  proofPath,
  paymentAmount,
}) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: friendlyPaymentError(new Error('not configured')) }
  }

  try {
    const { data, error } = await supabase.rpc('submit_payment_proof', {
      p_order_number: orderNumber,
      p_payment_token: paymentToken,
      p_payment_method: paymentMethod,
      p_transaction_id: transactionId || null,
      p_proof_path: proofPath,
      p_payment_amount: paymentAmount,
    })

    if (error) {
      return { ok: false, error: friendlyPaymentError(error) }
    }

    // Merge into session confirmation for Thank You page
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY)
      const prev = raw ? JSON.parse(raw) : {}
      const next = {
        ...prev,
        id: data.order_number || prev.id || orderNumber,
        orderId: data.order_id || prev.orderId,
        status: data.order_status || 'payment_verification',
        paymentStatus: data.payment_status || 'verification_pending',
        paymentMethod: data.payment_method || paymentMethod,
        advanceAmount: Number(data.advance_amount ?? prev.advanceAmount ?? paymentAmount),
        remainingAmount: Number(
          data.remaining_amount ?? prev.remainingAmount ?? 0,
        ),
        paymentToken: paymentToken || prev.paymentToken,
        proofSubmittedAt: new Date().toISOString(),
      }
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }

    return { ok: true, result: data }
  } catch (err) {
    return { ok: false, error: friendlyPaymentError(err) }
  }
}

/**
 * Full submit: upload file then record payment (keeps file for retry on DB failure).
 */
export async function submitAdvancePayment({
  orderNumber,
  paymentToken,
  orderId,
  paymentMethod,
  transactionId,
  file,
  paymentAmount,
  existingProofPath,
}) {
  let proofPath = existingProofPath || null

  if (!proofPath) {
    const uploaded = await uploadPaymentProof({ orderId, file })
    if (!uploaded.ok) return { ...uploaded, proofPath: null }
    proofPath = uploaded.path
  }

  const submitted = await submitPaymentProof({
    orderNumber,
    paymentToken,
    paymentMethod,
    transactionId,
    proofPath,
    paymentAmount,
  })

  if (!submitted.ok) {
    return { ...submitted, proofPath }
  }

  return { ok: true, result: submitted.result, proofPath }
}

export { PAYMENT_CONFIG, proofFileError, isAcceptedProofFile }
