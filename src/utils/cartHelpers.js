/** Build a stable cart merge key from a full item config */
export function buildCartKey(item) {
  if (item.kind === 'custom') {
    return [
      'custom',
      item.shape,
      item.sizeType,
      item.size,
      item.baseColor,
      (item.accentColors || []).slice().sort().join('+'),
      item.styleId,
      item.detailId,
      item.threadingId || 'none',
    ].join('|')
  }

  return [
    'catalog',
    item.productId,
    item.variantId,
    item.size,
    item.color || '',
    item.threadingId || 'none',
  ].join('|')
}

export function normalizeCartItem(raw) {
  const quantity = Math.max(1, Math.min(20, Number(raw.quantity) || 1))
  const item = { ...raw, quantity }
  item.key = raw.key || buildCartKey(item)
  return item
}

export function lineTotal(item) {
  return (Number(item.price) || 0) * (Number(item.quantity) || 1)
}
