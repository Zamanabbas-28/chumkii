import { STYLES, DETAIL_PREFERENCES, SIZES, COLORS, STONE_COLORS } from './colors'

export { STYLES, DETAIL_PREFERENCES, SIZES, COLORS, STONE_COLORS }

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
    big: 75,
    small: 50,
  },
  square: {
    small: 50,
  },
}

/**
 * Style add-ons — same for Round Big, Round Small, and Square
 * (only the base price differs by shape/size).
 */
export const STYLE_ADDON_PRICES = {
  'simple-thread': 10,
  'mirror-work': 20,
  'stone-work': 25,
  heavy: 30,
  minimal: 15,
  surprise: 0, // confirm via WhatsApp DM
}

export const DETAIL_OPTIONS = [
  { id: 'matching', name: 'Matching stones', price: 0 },
  { id: 'contrasting', name: 'Contrasting stones', price: 0 },
  { id: 'minimal', name: 'Minimal stones', price: 0 },
  { id: 'extra', name: 'Extra embellishment', price: 50 },
]
