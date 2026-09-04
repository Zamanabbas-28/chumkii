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

/** Full Stack + Big / Medium / Small (e.g. Zaria). */
function variantsWithBigMediumSmall(stackPrice, bigPrice, mediumPrice, smallPrice) {
  return {
    stack: {
      label: 'Full Stack',
      price: stackPrice,
      description: 'Get the complete matching bangle set.',
    },
    big: {
      label: 'Big Bangle',
      price: bigPrice,
      description: 'Purchase only the larger statement bangles.',
    },
    medium: {
      label: 'Medium Bangle',
      price: mediumPrice,
      description: 'Purchase only the medium-width bangles.',
    },
    small: {
      label: 'Small Bangle',
      price: smallPrice,
      description: 'Purchase only the smaller companion bangles.',
    },
  }
}

/** Full Stack + Medium / Small only (e.g. Pori — no Big). */
function variantsWithMediumSmall(stackPrice, mediumPrice, smallPrice) {
  return {
    stack: {
      label: 'Full Stack',
      price: stackPrice,
      description: 'Get the complete matching bangle set.',
    },
    medium: {
      label: 'Medium Bangle',
      price: mediumPrice,
      description: 'Purchase only the medium-width bangles.',
    },
    small: {
      label: 'Small Bangle',
      price: smallPrice,
      description: 'Purchase only the smaller companion bangles.',
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
    id: 'ohona-2-0',
    name: 'OHONA 2.0',
    price: 350,
    variants: variantsWithPrices(350, 150, 100),
    image: '/images/products/ohona-2-0-1.jpg',
    images: [
      '/images/products/ohona-2-0-1.jpg',
      '/images/products/ohona-2-0-2.jpg',
    ],
    shortDescription:
      'Black and silver mirror-work stack with sequin florals and ghungroo side bangles.',
    description:
      'An updated OHONA look — thick black and silver statement bangle with shisha mirrors and sequin flower motifs, paired with slim black companion bangles finished with silver chumki and soft ghungroo bells.',
    designDetails:
      'Wide central bangle in alternating black and silver silk with circular mirrors ringed in sequins and four-petal sequin florals. Two thin black side bangles with vertical silver sequin rows and dangling ghungroo accents. Handmade in Sylhet.',
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
    featured: true,
  },
  {
    id: 'siya',
    name: 'SIYA',
    price: 250,
    variants: variantsWithPrices(250, 100, 75),
    image: '/images/products/siya-1.jpg',
    images: [
      '/images/products/siya-1.jpg',
      '/images/products/siya-2.jpg',
      '/images/products/siya-3.jpg',
      '/images/products/siya-4.jpg',
      '/images/products/siya-5.jpg',
    ],
    shortDescription:
      'Black silk stack with silver mirror work, ghungroo bells, and pearl accents.',
    description:
      'A striking black and silver combination finished with smooth thread work, geometric mirror pieces, and soft ghungroo details — made for everyday and festive wear.',
    designDetails:
      'Deep black silk wrap with silver wire bands, shisha mirror triangles and diamonds, pearl clusters, and dangling ghungroo accents. Handmade in Sylhet.',
    sizes: SIZES,
    colorPalette: [
      { name: 'Black', hex: '#1a1a1a' },
      { name: 'Silver', hex: '#c0c0c0' },
      { name: 'Pearl', hex: '#f5f0e8' },
    ],
    customizable: true,
    category: 'stone-mirror',
    availableColors: ['black', 'silver', 'white', 'cream', 'gold'],
    shape: 'round',
    inStock: true,
    featured: true,
  },
  {
    id: 'zaria',
    name: 'ZARIA',
    price: 600,
    variants: variantsWithBigMediumSmall(600, 100, 75, 50),
    threeColorSections: true,
    image: '/images/products/zaria-2.jpg',
    images: [
      '/images/products/zaria-2.jpg',
      '/images/products/zaria-1.jpg',
      '/images/products/zaria-3.jpg',
      '/images/products/zaria-4.jpg',
    ],
    shortDescription:
      'Magenta, lime, and maroon silk stack with kundan florals and pearl accents.',
    description:
      'A festive magenta and lime combination finished with smooth thread work, green kundan stones, pearl-lined spacers, and gold-toned settings — made for celebrations and special occasions.',
    designDetails:
      'Thick magenta statement bangles with floral kundan centres, lime green medium bands with teardrop stones, and maroon pearl companion bangles. Handmade in Sylhet.',
    sizes: SIZES,
    colorPalette: [
      { name: 'Magenta', hex: '#c2185b' },
      { name: 'Lime Green', hex: '#8fbf3a' },
      { name: 'Maroon', hex: '#7a2048' },
    ],
    customizable: true,
    category: 'stone-mirror',
    availableColors: ['fuchsia', 'pink', 'lime', 'maroon', 'red', 'gold', 'cream'],
    shape: 'round',
    inStock: true,
    featured: true,
  },
  {
    id: 'pori',
    name: 'PORI',
    price: 400,
    variants: variantsWithMediumSmall(400, 100, 50),
    mediumSmallSections: true,
    image: '/images/products/pori-1.jpg',
    images: [
      '/images/products/pori-1.jpg',
      '/images/products/pori-2.jpg',
      '/images/products/pori-3.jpg',
    ],
    shortDescription:
      'Magenta and silver mirror stack with sequins and jori shuta — a triple-tone everyday contrast.',
    description:
      'Smooth finishing of thread work along with mirror accents, a touch of sequins, and silver jori shuta. A triple colour combination you can match in contrast with your fit of the day.',
    designDetails:
      'Magenta silk medium bands with silver wire spiral and chumki, paired with silver jori-shuta companions set with diamond mirrors and sequins. Handmade in Sylhet.',
    sizes: SIZES,
    colorPalette: [
      { name: 'Magenta', hex: '#c2185b' },
      { name: 'Silver', hex: '#c0c0c0' },
    ],
    customizable: true,
    category: 'colorful-threads',
    availableColors: ['fuchsia', 'pink', 'silver', 'white', 'gold', 'black'],
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
