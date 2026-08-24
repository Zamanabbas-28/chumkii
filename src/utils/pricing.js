import { getThreadingById } from '../data/threadingOptions'
import {
  CUSTOM_BASE_PRICES,
  STYLE_ADDON_PRICES,
  DETAIL_OPTIONS,
} from '../data/customizationOptions'

export function getVariantPrice(product, variantId) {
  const v = product?.variants?.[variantId]
  return v?.price ?? product?.price ?? 0
}

/**
 * Catalog product line price (unit).
 * @param {{ product, variantId, threadingId?, quantity? }} opts
 */
export function calcProductPrice({
  product,
  variantId,
  threadingId = 'none',
  quantity = 1,
}) {
  const base = getVariantPrice(product, variantId)
  const threading = getThreadingById(threadingId).price || 0
  const unit = base + threading
  return {
    base,
    threading,
    customization: threading,
    unit,
    total: unit * quantity,
  }
}

/**
 * Custom bangle price (unit).
 */
export function calcCustomPrice({
  shape = 'round',
  sizeType = 'small',
  styleId = 'simple-thread',
  detailId = 'matching',
  threadingId = 'none',
  quantity = 1,
}) {
  const shapePrices = CUSTOM_BASE_PRICES[shape] || CUSTOM_BASE_PRICES.round
  const resolvedType =
    shape === 'square' ? 'small' : sizeType === 'big' ? 'big' : 'small'
  const base = shapePrices[resolvedType] ?? shapePrices.small ?? 350
  const styleAdd = STYLE_ADDON_PRICES[styleId] ?? 0
  const detailAdd = DETAIL_OPTIONS.find((d) => d.id === detailId)?.price ?? 0
  const threading = getThreadingById(threadingId).price || 0
  const customization = styleAdd + detailAdd + threading
  const unit = base + customization
  return {
    base,
    styleAdd,
    detailAdd,
    threading,
    customization,
    unit,
    total: unit * quantity,
  }
}
