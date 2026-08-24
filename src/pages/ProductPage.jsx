import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Check } from 'lucide-react'
import { getProductById, getRelatedProducts } from '../data/products'
import { COLORS } from '../data/colors'
import { calcProductPrice } from '../utils/pricing'
import { formatBDT } from '../utils/format'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CartDrawer from '../components/CartDrawer'
import ProductGallery from '../components/ProductGallery'
import ProductSelector from '../components/ProductSelector'
import SizeSelector from '../components/SizeSelector'
import WishlistButton from '../components/WishlistButton'
import ProductPlaceholder from '../components/ProductPlaceholder'
import ColorSelector from '../components/ColorSelector'

export default function ProductPage() {
  const { id } = useParams()
  const product = getProductById(id)
  const { addItem } = useCart()
  const { trackView } = useWishlist()

  const [variantId, setVariantId] = useState('stack')
  const [size, setSize] = useState('')
  const [colorId, setColorId] = useState(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!product) return
    trackView(product.id)
    setVariantId(product.variants?.stack ? 'stack' : Object.keys(product.variants || {})[0])
    setSize('')
    setColorId(product.availableColors?.[0] || null)
    setQty(1)
    setAdded(false)
    window.scrollTo(0, 0)
  }, [product?.id])

  const pricing = useMemo(
    () =>
      product
        ? calcProductPrice({ product, variantId, quantity: qty })
        : null,
    [product, variantId, qty],
  )

  const colorOptions = COLORS.filter((c) =>
    product?.availableColors?.includes(c.id),
  )
  const selectedColor = COLORS.find((c) => c.id === colorId)
  const related = product ? getRelatedProducts(product) : []
  const canAdd = Boolean(product && variantId && size)

  const handleAdd = () => {
    if (!canAdd) return
    const variant = product.variants[variantId]
    addItem({
      kind: 'catalog',
      productId: product.id,
      name: product.name,
      variantId,
      variantLabel: variant?.label || variantId,
      size,
      color: selectedColor?.name || product.colorPalette?.[0]?.name || '',
      colorHex: selectedColor?.hex || product.colorPalette?.[0]?.hex,
      accentHex: product.colorPalette?.[1]?.hex || product.colorPalette?.[0]?.hex,
      threadingId: 'none',
      price: pricing.unit,
      quantity: qty,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navbar solid />
        <main className="mx-auto max-w-3xl px-4 py-32 text-center">
          <h1 className="font-display text-3xl">Design not found</h1>
          <Link to="/#designs" className="mt-4 inline-block text-dusty-rose">
            Back to shop
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory text-ink">
      <Navbar solid />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-28 sm:px-6 lg:px-8">
        <Link to="/#designs" className="text-sm text-ink-soft hover:text-ink">
          ← Shop
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <ProductGallery product={product} />

          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-4xl text-ink sm:text-5xl">
                  {product.name}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {product.shortDescription}
                </p>
              </div>
              <WishlistButton productId={product.id} />
            </div>

            {product.customizable && (
              <span className="mt-4 inline-block rounded-full bg-soft-lavender/60 px-3 py-1 text-xs font-semibold">
                Customizable
              </span>
            )}

            <div className="mt-8 space-y-6">
              <ProductSelector
                variants={product.variants}
                value={variantId}
                onChange={setVariantId}
              />
              <SizeSelector
                sizes={product.sizes}
                value={size}
                onChange={setSize}
              />
              {colorOptions.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold">Colour preference</p>
                  <ColorSelector
                    colors={colorOptions}
                    value={colorId}
                    onChange={setColorId}
                  />
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-semibold">Quantity</p>
                <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-cream px-2">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold">{qty}</span>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center"
                    onClick={() => setQty((q) => Math.min(20, q + 1))}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border-soft bg-cream/50 p-4 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <span>Base price</span>
                  <span>{formatBDT(pricing.base)}</span>
                </div>
                {pricing.customization > 0 && (
                  <div className="mt-1 flex justify-between text-ink-soft">
                    <span>Customization</span>
                    <span>{formatBDT(pricing.customization)}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-border-soft pt-2 font-semibold text-ink">
                  <span>Total</span>
                  <span>{formatBDT(pricing.total)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={!canAdd}
                onClick={handleAdd}
                className="hidden min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-ivory disabled:opacity-40 sm:inline-flex"
              >
                {added ? (
                  <>
                    <Check size={18} /> Added to cart
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Add to cart
                  </>
                )}
              </button>
              {!size && (
                <p className="text-xs text-dusty-rose">Please select a size to continue.</p>
              )}
            </div>

            <div className="mt-10 space-y-4 text-sm leading-relaxed text-ink-soft">
              <div>
                <h2 className="font-display text-xl text-ink">Design details</h2>
                <p className="mt-1">{product.designDetails || product.description}</p>
              </div>
              <p className="rounded-2xl bg-soft-lavender/30 px-4 py-3 text-xs">
                Each Chumki is carefully handcrafted. Small variations in handmade
                details are part of what makes every piece unique.
              </p>
              <p className="rounded-2xl border border-border-soft bg-cream/50 px-4 py-3 text-xs leading-relaxed">
                <span className="font-semibold text-ink">Delivery:</span> Across
                Bangladesh · Sylhet about 6–7 days · Outside Sylhet about 10–12
                days (after confirmation).
              </p>
              {product.customizable && (
                <Link
                  to="/#customize"
                  className="inline-block font-medium text-dusty-rose underline-offset-2 hover:underline"
                >
                  Prefer a fully custom colour? Create your own Chumki →
                </Link>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-3xl text-ink">Related designs</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="group">
                  <div className="aspect-square overflow-hidden rounded-2xl">
                    <ProductPlaceholder
                      name={p.name}
                      colors={p.colorPalette.map((c) => c.hex)}
                    />
                  </div>
                  <p className="mt-3 font-display text-xl group-hover:text-dusty-rose">
                    {p.name}
                  </p>
                  <p className="text-sm text-ink-soft">
                    From {formatBDT(p.variants?.stack?.price ?? p.price)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky mobile ATC */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-ivory/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div>
            <p className="text-xs text-ink-soft">Total</p>
            <p className="font-semibold">{formatBDT(pricing.total)}</p>
          </div>
          <button
            type="button"
            disabled={!canAdd}
            onClick={handleAdd}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-ivory disabled:opacity-40"
          >
            {added ? 'Added ✨' : 'Add to cart'}
          </button>
        </div>
      </div>

      <Footer />
      <CartDrawer />
    </div>
  )
}
