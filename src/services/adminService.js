import { supabase, isSupabaseConfigured } from '../lib/supabase'

function friendlyAdminError(err) {
  const msg = String(err?.message || err || '')
  if (msg.includes('UNAUTHORIZED')) return 'You are not authorized to perform this action.'
  if (msg.includes('ORDER_NOT_FOUND')) return 'Order not found.'
  if (msg.includes('PAYMENT_NOT_FOUND')) return 'Payment not found.'
  if (msg.includes('INVALID_TRANSITION')) return 'That status change is not allowed.'
  if (msg.includes('INVALID_PAYMENT_STATUS')) return 'This payment is not awaiting verification.'
  if (msg.includes('PAYMENT_NOT_VERIFIED')) return 'Verify payment before confirming this order.'
  if (msg.includes('INVALID_STATUS')) return 'Invalid order status.'
  if (msg.includes('INVALID_NOTE')) return 'Please enter a note.'
  if (!isSupabaseConfigured()) return 'Admin services are temporarily unavailable.'
  return 'Something went wrong. Please try again.'
}

async function rpc(name, args = {}) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: friendlyAdminError(new Error('not configured')) }
  }
  try {
    const { data, error } = await supabase.rpc(name, args)
    if (error) return { ok: false, error: friendlyAdminError(error) }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: friendlyAdminError(err) }
  }
}

export async function fetchAdminProfile() {
  if (!isSupabaseConfigured()) return { ok: false, profile: null }
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { ok: false, profile: null }
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userData.user.id)
    .maybeSingle()
  if (error) return { ok: false, profile: null, error: error.message }
  return {
    ok: true,
    profile: data,
    user: userData.user,
    isAdmin: data?.role === 'admin',
  }
}

export async function getDashboardStats() {
  return rpc('admin_dashboard_stats')
}

export async function listOrders(params = {}) {
  return rpc('admin_list_orders', {
    p_search: params.search || null,
    p_status: params.status || null,
    p_payment_status: params.paymentStatus || null,
    p_date_from: params.dateFrom || null,
    p_date_to: params.dateTo || null,
    p_page: params.page || 1,
    p_page_size: params.pageSize || 20,
  })
}

export async function getOrder(orderId) {
  return rpc('admin_get_order', { p_order_id: orderId })
}

export async function listPaymentQueue(page = 1, pageSize = 20) {
  return rpc('admin_list_payment_queue', {
    p_page: page,
    p_page_size: pageSize,
  })
}

export async function verifyPayment(paymentId) {
  return rpc('admin_verify_payment', { p_payment_id: paymentId })
}

export async function rejectPayment(paymentId, reason) {
  return rpc('admin_reject_payment', {
    p_payment_id: paymentId,
    p_reason: reason || null,
  })
}

export async function updateOrderStatus(orderId, newStatus, note) {
  return rpc('admin_update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_note: note || null,
  })
}

export async function addOrderNote(orderId, note) {
  return rpc('admin_add_order_note', {
    p_order_id: orderId,
    p_note: note,
  })
}

export async function listNotifications(limit = 30, unreadOnly = false) {
  return rpc('admin_list_notifications', {
    p_limit: limit,
    p_unread_only: unreadOnly,
  })
}

export async function markNotificationsRead(ids) {
  return rpc('admin_mark_notifications_read', { p_ids: ids })
}

export async function markAllNotificationsRead() {
  return rpc('admin_mark_all_notifications_read')
}

export async function getAdminSettings() {
  return rpc('admin_get_settings')
}

export async function updateAdminSetting(key, value) {
  return rpc('admin_update_setting', { p_key: key, p_value: value })
}

/** Create a short-lived signed URL for a private payment proof. */
export async function getPaymentProofSignedUrl(path, expiresIn = 180) {
  if (!isSupabaseConfigured() || !path) {
    return { ok: false, error: 'Screenshot unavailable.' }
  }
  try {
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(path, expiresIn)
    if (error || !data?.signedUrl) {
      return { ok: false, error: 'Could not load payment screenshot.' }
    }
    return { ok: true, url: data.signedUrl }
  } catch {
    return { ok: false, error: 'Could not load payment screenshot.' }
  }
}

export { friendlyAdminError }
