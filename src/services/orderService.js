import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getDistrictById } from '../data/shippingRates'
import {
  getCartItemQuantity,
  calculateDeliveryCharge,
  LAST_ORDER_KEY,
} from '../utils/shipping'
import { VARIANT_TO_DB, resolveCatalogIds } from './productService'

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function friendlyError(err) {
  const msg = String(err?.message || err || '')
  if (msg.includes('INVALID_CUSTOMER')) {
    return 'Please check your name and phone number.'
  }
  if (msg.includes('INVALID_DELIVERY')) {
    return 'Please check your delivery district and address.'
  }
  if (msg.includes('INVALID_ITEMS') || msg.includes('INVALID_ITEM')) {
    return 'Your cart looks incomplete. Refresh and try again.'
  }
  if (msg.includes('INVALID_TOTALS')) {
    return 'Order totals could not be verified. Please try again.'
  }
  if (!isSupabaseConfigured()) {
    return 'Ordering is temporarily unavailable. Please try again shortly.'
  }
  return 'We could not place your order. Please try again in a moment.'
}

/**
 * Build RPC line items from the cart. Catalog lines resolve DB UUIDs when possible.
 */
async function buildOrderItems(cartItems) {
  const lines = []

  for (const item of cartItems) {
    const qty = Math.max(1, Number(item.quantity) || 1)
    const unit = Number(item.price) || 0
    const customization = {
      kind: item.kind || 'catalog',
      key: item.key,
      variantLabel: item.variantLabel || null,
      color: item.color || null,
      colorHex: item.colorHex || null,
      accentHex: item.accentHex || null,
      accentLabel: item.accentLabel || null,
      threadingId: item.threadingId || null,
      shape: item.shape || null,
      sizeType: item.sizeType || null,
      styleId: item.styleId || null,
      detailId: item.detailId || null,
      productSlug: item.productId || null,
      frontendVariantId: item.variantId || null,
    }

    let productId = null
    let variantId = null
    let variantType = null

    if (item.kind === 'custom') {
      variantType = item.sizeType === 'big' ? 'big' : item.sizeType === 'small' ? 'small' : null
    } else {
      variantType = VARIANT_TO_DB[item.variantId] || item.variantId || null
      const ids = await resolveCatalogIds(item.productId, item.variantId)
      productId = ids.productId
      variantId = ids.variantId
    }

    lines.push({
      product_id: productId || '',
      variant_id: variantId || '',
      product_name: item.name || 'Chumki item',
      variant_type: variantType || '',
      size: item.size || '',
      quantity: qty,
      unit_price: unit,
      total_price: unit * qty,
      customization_data: customization,
    })
  }

  return lines
}

/**
 * Place a guest order via Supabase `place_order` RPC.
 * On success, writes confirmation payload to sessionStorage (Thank You page).
 *
 * @returns {{ ok: true, orderNumber, orderId, confirmation } | { ok: false, error }}
 */
export async function placeOrder({
  form,
  items,
  subtotal,
  deliveryInfo,
  idempotencyKey,
}) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: friendlyError(new Error('not configured')) }
  }

  if (!items?.length) {
    return { ok: false, error: 'Your cart is empty' }
  }

  if (!deliveryInfo?.ready || deliveryInfo.delivery == null) {
    return {
      ok: false,
      error: 'Select your delivery location to calculate delivery',
    }
  }

  const district = getDistrictById(form.districtId)
  const deliveryCharge = Number(deliveryInfo.delivery) || 0
  const sub = Number(subtotal) || 0
  const total = sub + deliveryCharge
  const key = idempotencyKey || newIdempotencyKey()

  const customer = {
    name: form.name.trim(),
    phone: form.whatsapp.trim(),
    email: (form.email || '').trim(),
  }

  const delivery = {
    district: district?.name || form.districtId,
    district_id: form.districtId,
    area: (form.city || '').trim(),
    full_address: form.address.trim(),
    notes: (form.notes || '').trim(),
  }

  const orderItems = await buildOrderItems(items)

  const meta = {
    pickup: deliveryInfo.pickup,
    weightKg: deliveryInfo.weightKg,
    zone: deliveryInfo.zone,
    currency: 'BDT',
    itemQuantity: getCartItemQuantity(items),
  }

  try {
    const { data, error } = await supabase.rpc('place_order', {
      p_customer: customer,
      p_delivery: delivery,
      p_items: orderItems,
      p_subtotal: sub,
      p_delivery_charge: deliveryCharge,
      p_total: total,
      p_meta: meta,
      p_idempotency_key: key,
    })

    if (error) {
      return { ok: false, error: friendlyError(error), idempotencyKey: key }
    }

    const orderNumber = data?.order_number
    const orderId = data?.order_id

    if (!orderNumber) {
      return {
        ok: false,
        error: friendlyError(new Error('missing order number')),
        idempotencyKey: key,
      }
    }

    const confirmation = {
      id: orderNumber,
      orderId,
      createdAt: new Date().toISOString(),
      status: data?.status || 'pending',
      currency: 'BDT',
      duplicate: Boolean(data?.duplicate),
      customer: {
        name: customer.name,
        whatsapp: customer.phone,
        email: customer.email,
      },
      delivery: {
        districtId: form.districtId,
        district: delivery.district,
        city: delivery.area,
        address: delivery.full_address,
        notes: delivery.notes,
      },
      items: items.map((i) => ({ ...i })),
      subtotal: sub,
      deliveryCharge,
      total,
      meta,
      idempotencyKey: key,
    }

    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(confirmation))
      const prev = JSON.parse(localStorage.getItem('chumki-orders-v1') || '[]')
      localStorage.setItem(
        'chumki-orders-v1',
        JSON.stringify([confirmation, ...prev].slice(0, 30)),
      )
    } catch {
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(confirmation))
      } catch {
        /* ignore */
      }
    }

    return {
      ok: true,
      orderNumber,
      orderId,
      confirmation,
      idempotencyKey: key,
    }
  } catch (err) {
    return {
      ok: false,
      error: friendlyError(err),
      idempotencyKey: key,
    }
  }
}

export { newIdempotencyKey, calculateDeliveryCharge, LAST_ORDER_KEY }
