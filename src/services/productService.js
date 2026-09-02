import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  products as localProducts,
  getProductById as getLocalProductById,
  getRelatedProducts as getLocalRelatedProducts,
} from '../data/products'
import { SIZES } from '../data/colors'

/** Frontend cart/PDP key → DB variant_type */
export const VARIANT_TO_DB = {
  stack: 'full_stack',
  big: 'big',
  medium: 'medium',
  small: 'small',
  piece: 'small', // per-piece products (e.g. Charkona)
}

/** DB variant_type → frontend key */
export const DB_TO_VARIANT = {
  full_stack: 'stack',
  big: 'big',
  medium: 'medium',
  small: 'small',
}

const VARIANT_META = {
  stack: {
    label: 'Full Stack',
    description: 'Get the complete matching bangle set.',
  },
  big: {
    label: 'Big Bangle',
    description: 'Purchase only the larger statement bangle.',
  },
  small: {
    label: 'Small Bangle',
    description: 'Purchase only the smaller matching bangle.',
  },
  medium: {
    label: 'Medium Bangle',
    description: 'Purchase only the medium-width bangle.',
  },
  piece: {
    label: 'Per piece',
    description: 'One handmade bangle — priced per piece.',
  },
}

function parsePalette(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * Normalize a Supabase product row (+ nested variants) to the shape
 * ProductPage / cards already expect (id = slug, variants.stack/big/small).
 */
export function normalizeProduct(row) {
  if (!row) return null

  const variants = {}
  const rows = Array.isArray(row.product_variants) ? row.product_variants : []

  for (const v of rows) {
    if (!v || v.is_available === false) continue
    const key = DB_TO_VARIANT[v.variant_type] || v.variant_type
    const meta = VARIANT_META[key] || {}
    variants[key] = {
      label: v.name || meta.label || key,
      price: Number(v.price) || 0,
      description: v.description || meta.description || '',
      dbId: v.id,
      variantType: v.variant_type,
      image: v.image || null,
      availableSizes: v.available_sizes?.length ? v.available_sizes : SIZES,
    }
  }

  // Charkona (and similar): single available `small` row sold as per-piece
  if (
    row.slug === 'charkona-kakan' &&
    variants.small &&
    !variants.stack &&
    !variants.big
  ) {
    variants.piece = {
      ...variants.small,
      label: variants.small.label || 'Per piece',
      description:
        variants.small.description ||
        VARIANT_META.piece.description,
    }
    delete variants.small
  }

  const stackPrice = variants.stack?.price
  const unitPrice =
    stackPrice ??
    variants.piece?.price ??
    variants.big?.price ??
    variants.small?.price ??
    (Number(rows[0]?.price) || 0)
  const sizes =
    variants.stack?.availableSizes ||
    variants.piece?.availableSizes ||
    variants.big?.availableSizes ||
    variants.small?.availableSizes ||
    SIZES

  const local = getLocalProductById(row.slug)
  const dbImages = Array.isArray(row.images)
    ? row.images
    : typeof row.images === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(row.images)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        })()
      : []

  const images =
    dbImages.length > 0
      ? dbImages
      : row.base_image
        ? (local?.images?.length ? local.images : [row.base_image])
        : (local?.images || (local?.image ? [local.image] : []))

  const mainImage = row.base_image || local?.image || images[0] || null

  return {
    id: row.slug,
    dbId: row.id,
    name: row.name,
    price: unitPrice,
    variants,
    image: mainImage,
    images,
    shortDescription: row.short_description || '',
    description: row.description || '',
    designDetails: row.design_details || row.description || '',
    sizes,
    colorPalette: parsePalette(row.color_palette),
    customizable: Boolean(row.is_customizable),
    category: row.category || '',
    availableColors: row.available_colors || [],
    shape: row.shape || 'round',
    inStock: true,
    featured: Boolean(row.is_featured),
    threeColorSections: Boolean(local?.threeColorSections),
  }
}

const PRODUCT_SELECT = `
  id,
  slug,
  name,
  short_description,
  description,
  design_details,
  category,
  base_image,
  shape,
  color_palette,
  available_colors,
  is_customizable,
  is_active,
  is_featured,
  product_variants (
    id,
    variant_type,
    name,
    description,
    price,
    available_sizes,
    image,
    is_available
  )
`

function isValidProductImage(p) {
  if (!p) return false
  const img = p.image || (Array.isArray(p.images) && p.images[0])
  if (!img || typeof img !== 'string') return false
  const trimmed = img.trim()
  return (
    trimmed.length > 0 &&
    !trimmed.includes('placeholder') &&
    (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://'))
  )
}

function isStorefrontReady(p) {
  return (
    p &&
    isValidProductImage(p) &&
    Object.keys(p.variants || {}).length > 0
  )
}

/** Include local photographed products not yet synced to Supabase (e.g. new launches). */
function mergeLocalPhotographedProducts(dbProducts) {
  const byId = new Map((dbProducts || []).map((p) => [p.id, p]))

  for (const local of localProducts) {
    if (!byId.has(local.id) && isStorefrontReady(local)) {
      byId.set(local.id, { ...local, fromFallback: true })
    }
  }

  return Array.from(byId.values()).sort((a, b) =>
    (a.name || '').localeCompare(b.name || ''),
  )
}

function withLocalFallback(reason) {
  if (reason) {
    console.warn('[productService] using local catalog fallback:', reason)
  }
  const fallbackList = localProducts
    .filter(isStorefrontReady)
    .map((p) => ({ ...p, fromFallback: true }))

  return {
    products: fallbackList,
    fromFallback: true,
    error: reason || null,
  }
}

/**
 * Fetch all active products with variants and valid real photos.
 * Falls back to local `data/products.js` if Supabase is missing, errors, or empty.
 */
export async function fetchProducts() {
  if (!isSupabaseConfigured()) {
    return withLocalFallback('Supabase not configured')
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      return withLocalFallback(error.message)
    }

    const list = (data || [])
      .map(normalizeProduct)
      .filter(
        (p) =>
          p &&
          Object.keys(p.variants || {}).length > 0 &&
          isValidProductImage(p)
      )

    if (!list.length) {
      return withLocalFallback('No active products in database')
    }

    return {
      products: mergeLocalPhotographedProducts(list),
      fromFallback: false,
      error: null,
    }
  } catch (err) {
    return withLocalFallback(err?.message || 'Fetch failed')
  }
}

export async function fetchFeaturedProducts() {
  const { products, fromFallback, error } = await fetchProducts()
  const featured = products.filter((p) => p.featured)
  return {
    products: featured.length ? featured : products,
    fromFallback,
    error,
  }
}

export async function fetchProductBySlug(slug) {
  if (!slug) {
    return { product: null, fromFallback: false, error: null }
  }

  if (!isSupabaseConfigured()) {
    const local = getLocalProductById(slug)
    return {
      product: local ? { ...local, fromFallback: true } : null,
      fromFallback: true,
      error: local ? null : 'Not found',
    }
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      const local = getLocalProductById(slug)
      return {
        product: local ? { ...local, fromFallback: true } : null,
        fromFallback: true,
        error: error.message,
      }
    }

    const product = normalizeProduct(data)
    if (product && Object.keys(product.variants || {}).length > 0) {
      return { product, fromFallback: false, error: null }
    }

    const local = getLocalProductById(slug)
    return {
      product: local ? { ...local, fromFallback: true } : null,
      fromFallback: true,
      error: data ? 'Product has no variants' : 'Not found',
    }
  } catch (err) {
    const local = getLocalProductById(slug)
    return {
      product: local ? { ...local, fromFallback: true } : null,
      fromFallback: true,
      error: err?.message || 'Fetch failed',
    }
  }
}

export function getRelatedFromList(product, allProducts, limit = 4) {
  if (!product || !allProducts?.length) {
    return getLocalRelatedProducts(product, limit)
  }
  return allProducts
    .filter((p) => p.id !== product.id)
    .sort((a, b) => {
      const score = (p) =>
        (p.category === product.category ? 2 : 0) +
        (p.shape === product.shape ? 1 : 0)
      return score(b) - score(a)
    })
    .slice(0, limit)
}

/** Resolve DB UUIDs for a catalog line (slug + frontend variant key). */
export async function resolveCatalogIds(productSlug, variantKey) {
  if (!productSlug || !isSupabaseConfigured()) {
    return { productId: null, variantId: null }
  }

  const dbType = VARIANT_TO_DB[variantKey] || variantKey

  try {
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('slug', productSlug)
      .maybeSingle()

    if (!product?.id) return { productId: null, variantId: null }

    const { data: variant } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', product.id)
      .eq('variant_type', dbType)
      .maybeSingle()

    return {
      productId: product.id,
      variantId: variant?.id || null,
    }
  } catch {
    return { productId: null, variantId: null }
  }
}
