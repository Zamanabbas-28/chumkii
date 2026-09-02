/**
 * Build a stable cart merge key from a full item configuration.
 * Distinct color preferences generate distinct keys so they never merge into one line.
 */
export function buildCartKey(item) {
  if (item.kind === 'custom') {
    return [
      'custom',
      item.shape || '',
      item.sizeType || '',
      item.size || '',
      item.baseColor || '',
      (item.accentColors || []).slice().sort().join('+'),
      item.styleId || '',
      item.detailId || '',
      item.threadingId || 'none',
    ].join('|')
  }

  return [
    'catalog',
    item.productId || '',
    item.variantId || '',
    item.size || '',
    item.bigColorPreference || item.bigColor || 'original',
    item.mediumColorPreference || item.mediumColor || 'original',
    item.smallColorPreference || item.smallColor || 'original',
    item.pieceColorPreference || item.pieceColor || 'original',
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

/**
 * Helper to produce a clean human-readable color preference summary
 */
export function formatColorPreferences(item) {
  const custom = item.customization_data || item

  if (custom.isOriginalColor || (custom.bigColorPreference === 'original' && custom.smallColorPreference === 'original')) {
    return 'Original Colors'
  }

  const parts = []
  if (custom.bigColorLabel && custom.bigColorLabel !== 'Keep Original Color') {
    parts.push(`Big: ${custom.bigColorLabel}`)
  } else if (custom.bigColorPreference && custom.bigColorPreference !== 'original') {
    parts.push(`Big: ${custom.bigColorPreference}`)
  }

  if (custom.mediumColorLabel && custom.mediumColorLabel !== 'Keep Original Color') {
    parts.push(`Medium: ${custom.mediumColorLabel}`)
  } else if (custom.mediumColorPreference && custom.mediumColorPreference !== 'original') {
    parts.push(`Medium: ${custom.mediumColorPreference}`)
  }

  if (custom.smallColorLabel && custom.smallColorLabel !== 'Keep Original Color') {
    parts.push(`Small: ${custom.smallColorLabel}`)
  } else if (custom.smallColorPreference && custom.smallColorPreference !== 'original') {
    parts.push(`Small: ${custom.smallColorPreference}`)
  }

  if (custom.pieceColorLabel && custom.pieceColorLabel !== 'Keep Original Color') {
    parts.push(`Color: ${custom.pieceColorLabel}`)
  } else if (custom.pieceColorPreference && custom.pieceColorPreference !== 'original') {
    parts.push(`Color: ${custom.pieceColorPreference}`)
  }

  if (!parts.length) {
    if (custom.color) return custom.color
    return 'Original Colors'
  }

  return parts.join(' · ')
}
