import { SIZES } from './colors'

/** Full Stack + explicit Big/Small prices (no auto %). */
function variantsWithPrices(stackPrice, bigPrice, smallPrice) {
  return {
    stack: {
      label: 'Full Stack',
      price: stackPrice,
      description: 'Get the complete matching bangle set.',
    },
    big: {
      label: 'Big Bangle',
      price: bigPrice,
      description: 'Purchase only the larger statement bangle.',
    },
    small: {
      label: 'Small Bangle',
      price: smallPrice,
      description: 'Purchase only the smaller matching bangle.',
    },
  }
}

/** Single per-piece product (no Full Stack / Big / Small choice).
 * Uses frontend key `piece` (maps to DB `small`). */
function variantsPerPiece(piecePrice) {
  return {
    piece: {
      label: 'Per piece',
      price: piecePrice,
      description: 'One handmade square bangle — priced per piece.',
    },
  }
}

export const products = [
  {
    id: 'ohona',
    name: 'OHONA',
    price: 350,
    variants: variantsWithPrices(350, 150, 100),
    image: '/images/products/ohona-1.jpg',
    images: [
      '/images/products/ohona-1.jpg',
      '/images/products/ohona-2.jpg',
      '/images/products/ohona-3.jpg',
      '/images/products/ohona-4.jpg',
      '/images/products/ohona-5.jpg',
      '/images/products/ohona-6.jpg',
    ],
    shortDescription:
      'Smooth finishing thread work in a black and silver Y2K-inspired stack.',
    description:
      'Smooth finishing thread work with a black and silver combination in a soft Y2K style — made to match your everyday fit.',
    designDetails:
      'Silk-thread wrapped stack with silver sequin vine details and mirror accents. Handmade in Sylhet.',
    sizes: SIZES,
    colorPalette: [
      { name: 'Black', hex: '#1a1a1a' },
      { name: 'Silver', hex: '#c0c0c0' },
    ],
    customizable: true,
    category: 'modern-minimal',
    availableColors: ['black', 'silver', 'white', 'gold'],
    shape: 'round',
    inStock: true,
    featured: true,
  },
  {
    id: 'charkona-kakan',
    name: 'Charkona Kakan',
    price: 100,
    variants: variantsPerPiece(100),
    image: '/images/products/charkona-1.jpg',
    images: [
      '/images/products/charkona-1.jpg',
      '/images/products/charkona-2.jpg',
      '/images/products/charkona-3.jpg',
      '/images/products/charkona-4.jpg',
    ],
    shortDescription:
      'Square silk-wrapped bangles with silver chumki and soothing jhunjhuri.',
    description:
      'Beautifully sequenced with silver chumki and jhunjhuri, finished with smooth silk thread. Sold per piece.',
    designDetails:
      'Square frames with rounded corners, silver sequins, and corner bells. Priced ৳100 per piece.',
    sizes: SIZES,
    colorPalette: [
      { name: 'Lavender', hex: '#a78bbf' },
      { name: 'Fuchsia', hex: '#d9468f' },
      { name: 'Lime', hex: '#8fbf3a' },
      { name: 'Black', hex: '#1a1a1a' },
    ],
    customizable: true,
    category: 'traditional',
    availableColors: ['lavender', 'pink', 'lime', 'black', 'red', 'emerald', 'gold'],
    shape: 'square',
    inStock: true,
    featured: true,
  },
  {
    id: 'neela',
    name: 'NEELA',
    price: 250,
    variants: variantsWithPrices(250, 100, 75),
    image: '/images/products/neela-1.jpg',
    images: [
      '/images/products/neela-1.jpg',
      '/images/products/neela-2.jpg',
      '/images/products/neela-3.jpg',
    ],
    shortDescription:
      'Vibrant navy kundan work with soft off-white contrast stacks.',
    description:
      'Smooth finishing of thread work along with kundan in a vibrant blue, set against an off-white contrast.',
    designDetails:
      'Navy statement centre with cream companions and gold-toned kundan stone settings.',
    sizes: SIZES,
    colorPalette: [
      { name: 'Navy', hex: '#1a2744' },
      { name: 'Off-White', hex: '#f0e6d8' },
      { name: 'Gold', hex: '#c4a574' },
    ],
    customizable: true,
    category: 'stone-mirror',
    availableColors: ['navy', 'royal-blue', 'cream', 'gold', 'silver'],
    shape: 'round',
    inStock: true,
    featured: true,
  },
  {
    id: 'dahlia',
    name: 'DAHLIA',
    price: 250,
    variants: variantsWithPrices(250, 100, 75),
    image: '/images/products/dahlia-1.jpg',
    images: [
      '/images/products/dahlia-1.jpg',
      '/images/products/dahlia-2.jpg',
      '/images/products/dahlia-3.jpg',
      '/images/products/dahlia-4.jpg',
    ],
    shortDescription:
      'Fuchsia and lime stacks with kundan sparkle and ghungroo accents.',
    description:
      'Beautifully sequenced handmade bangles with kundan and smooth thread finishing.',
    designDetails:
      'Bold fuchsia and lime pairing with kundan stones, stars, and soft ghungroo details.',
    sizes: SIZES,
    colorPalette: [
      { name: 'Fuchsia', hex: '#d9468f' },
      { name: 'Lime', hex: '#8fbf3a' },
      { name: 'Gold', hex: '#c4a574' },
    ],
    customizable: true,
    category: 'colorful-threads',
    availableColors: ['fuchsia', 'lime', 'pink', 'emerald', 'gold'],
    shape: 'round',
    inStock: true,
    featured: false,
  },
  {
    id: 'emerald-bloom',
    name: 'Emerald Bloom',
    price: 300,
    variants: variantsWithPrices(300, 100, 75),
    image: null,
    images: [],
    shortDescription:
      'Deep green thread paired with delicate stones and metallic details.',
    description:
      'A rich emerald-inspired combination with soft metallic accents.',
    designDetails:
      'Deep green silk wrap with gold accents — elegant for everyday and occasion wear.',
    sizes: SIZES,
    colorPalette: [
      { name: 'Emerald', hex: '#2d5a4a' },
      { name: 'Gold', hex: '#c4a574' },
      { name: 'Cream', hex: '#f0e6d8' },
    ],
    customizable: true,
    category: 'stone-mirror',
    availableColors: ['emerald', 'lime', 'gold', 'cream'],
    shape: 'round',
    inStock: true,
    featured: false,
  },
  {
    id: 'lavender-spark',
    name: 'Lavender Spark',
    price: 300,
    variants: variantsWithPrices(300, 100, 75),
    image: null,
    images: [],
    shortDescription:
      'Soft lavender tones finished with delicate decorative stones.',
    description:
      'A soft lavender mood with gentle sparkle — perfect for lighter outfits.',
    designDetails:
      'Lavender thread with soft silver sparkle and blush accents.',
    sizes: SIZES,
    colorPalette: [
      { name: 'Lavender', hex: '#a78bbf' },
      { name: 'Silver', hex: '#c0c0c0' },
      { name: 'Blush', hex: '#d4a5a5' },
    ],
    customizable: true,
    category: 'colorful-threads',
    availableColors: ['lavender', 'purple', 'pink', 'silver'],
    shape: 'round',
    inStock: true,
    featured: false,
  },
  {
    id: 'blush-gold',
    name: 'Blush & Gold',
    price: 300,
    variants: variantsWithPrices(300, 100, 75),
    image: null,
    images: [],
    shortDescription:
      'A soft pink and gold combination designed for an elegant finish.',
    description:
      'Warm blush tones with muted gold accents — everyday to occasion.',
    designDetails:
      'Blush silk with muted gold metallic accents for a soft glamorous finish.',
    sizes: SIZES,
    colorPalette: [
      { name: 'Blush', hex: '#d4a5a5' },
      { name: 'Gold', hex: '#c4a574' },
      { name: 'Cream', hex: '#f0e6d8' },
    ],
    customizable: true,
    category: 'modern-minimal',
    availableColors: ['pink', 'gold', 'cream', 'white'],
    shape: 'round',
    inStock: true,
    featured: false,
  },
  {
    id: 'royal-muse',
    name: 'Royal Muse',
    price: 300,
    variants: variantsWithPrices(300, 100, 75),
    image: null,
    images: [],
    shortDescription:
      'Rich statement stack with bold stonework and metallic shine.',
    description:
      'A richer statement look for evenings and celebrations.',
    designDetails:
      'Royal blue with gold and silver accents — bold stonework for special occasions.',
    sizes: SIZES,
    colorPalette: [
      { name: 'Royal Blue', hex: '#1e3a8a' },
      { name: 'Gold', hex: '#c4a574' },
      { name: 'Silver', hex: '#c0c0c0' },
    ],
    customizable: true,
    category: 'stone-mirror',
    availableColors: ['royal-blue', 'navy', 'gold', 'silver'],
    shape: 'round',
    inStock: true,
    featured: true,
  },
]

export function getProductById(id) {
  return products.find((p) => p.id === id)
}

export function getRelatedProducts(product, limit = 4) {
  if (!product) return []
  return products
    .filter((p) => p.id !== product.id)
    .sort((a, b) => {
      const score = (p) =>
        (p.category === product.category ? 2 : 0) +
        (p.shape === product.shape ? 1 : 0)
      return score(b) - score(a)
    })
    .slice(0, limit)
}
