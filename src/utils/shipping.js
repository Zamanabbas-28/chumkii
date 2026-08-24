import {
  PICKUP,
  PLATFORM_FEE,
  WEIGHT_RULES,
  DESTINATION_RATES,
  getDistrictById,
} from '../data/shippingRates'

/** Sum of all line quantities in the cart */
export function getCartItemQuantity(items = []) {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
}

/**
 * Assign parcel weight (kg) from total item quantity.
 * 1–2 → 0.25, 3+ → 0.5 (from WEIGHT_RULES)
 */
export function calculateOrderWeight(totalItemQuantity) {
  const qty = Math.max(0, Number(totalItemQuantity) || 0)
  if (qty < 1) return 0
  const sorted = [...WEIGHT_RULES].sort((a, b) => a.maxQty - b.maxQty)
  for (const rule of sorted) {
    if (qty <= rule.maxQty) return rule.kg
  }
  return sorted[sorted.length - 1]?.kg ?? 0.5
}

export function getDestinationZone(districtId) {
  const district = getDistrictById(districtId)
  return district?.zone || null
}

/**
 * Calculate customer-facing delivery charge.
 * Returns ready:false until a valid district is selected.
 * Does not expose courier names — UI should only show `delivery`.
 */
export function calculateDeliveryCharge({ districtId, itemQuantity }) {
  const qty = Math.max(0, Number(itemQuantity) || 0)
  const weightKg = calculateOrderWeight(qty)
  const zone = getDestinationZone(districtId)

  if (!districtId || !zone || qty < 1) {
    return {
      ready: false,
      zone: null,
      weightKg,
      base: 0,
      platformFee: PLATFORM_FEE,
      delivery: null,
      pickup: PICKUP.label,
    }
  }

  const rate = DESTINATION_RATES[zone] || DESTINATION_RATES.other
  const base = rate.base
  const delivery = base + PLATFORM_FEE

  return {
    ready: true,
    zone,
    weightKg,
    base,
    platformFee: PLATFORM_FEE,
    delivery,
    pickup: PICKUP.label,
  }
}

/** Generate CHM-YYYY-XXXXX style order id */
export function generateOrderId() {
  const year = new Date().getFullYear()
  const rand = Math.floor(10000 + Math.random() * 90000)
  return `CHM-${year}-${rand}`
}

export const LAST_ORDER_KEY = 'chumki-last-order'
export const CHECKOUT_STORAGE_KEY = 'chumki-checkout-v1'
