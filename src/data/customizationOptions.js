import { STYLES, DETAIL_PREFERENCES, SIZES, COLORS } from './colors'

export { STYLES, DETAIL_PREFERENCES, SIZES, COLORS }

export const SHAPES = [
  {
    id: 'round',
    name: 'Round',
    description: 'Classic round bangle.',
  },
  {
    id: 'square',
    name: 'Square',
    description: 'Square-shaped customized bangle (Small only).',
  },
]

export const SIZE_TYPES = [
  {
    id: 'big',
    name: 'Big',
    description: 'Larger statement bangle with richer presence.',
  },
  {
    id: 'small',
    name: 'Small',
    description: 'Delicate matching bangle for stacking.',
  },
]

/** Base prices for custom bangles by shape + size type (৳ BDT) — edit here */
export const CUSTOM_BASE_PRICES = {
  round: {
    big: 650,
    small: 350,
  },
  square: {
    small: 400,
  },
}

/** Optional add-on prices by design style (৳) — edit here */
export const STYLE_ADDON_PRICES = {
  'simple-thread': 0,
  'stone-work': 150,
  'mirror-work': 120,
  heavy: 200,
  minimal: 0,
  surprise: 100,
}

export const DETAIL_OPTIONS = [
  { id: 'matching', name: 'Matching stones', price: 0 },
  { id: 'contrasting', name: 'Contrasting stones', price: 50 },
  { id: 'minimal', name: 'Minimal stones', price: 0 },
  { id: 'extra', name: 'Extra embellishment', price: 100 },
]
