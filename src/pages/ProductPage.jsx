import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Check } from 'lucide-react'
import { COLORS } from '../data/colors'
import { calcProductPrice } from '../utils/pricing'
import { formatBDT } from '../utils/format'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useProduct } from '../hooks/useProducts'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CartDrawer from '../components/CartDrawer'
import ProductGallery from '../components/ProductGallery'
import ProductSelector from '../components/ProductSelector'
import SizeSelector from '../components/SizeSelector'
import WishlistButton from '../components/WishlistButton'
import ProductPlaceholder from '../components/ProductPlaceholder'
import ColorPreferenceSelector from '../components/ColorPreferenceSelector'
import DmCustomizationCta from '../components/DmCustomizationCta'

function ProductPageSkeleton() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-ivory">
      <Navbar solid />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-28 sm:px-6 lg:px-8">
        <div className="h-4 w-16 animate-pulse rounded bg-cream" />
        <div className="mt-6 grid min-w-0 gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-cream" />
          <div className="space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded bg-cream" />
            <div className="h-4 w-full animate-pulse rounded bg-cream" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-cream" />
            <div className="mt-8 h-32 animate-pulse rounded-2xl bg-cream" />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ProductPage() {
  const { id } = useParams()
  const { product, related, loading, notFound } = useProduct(id)
  const { addItem } = useCart()
  const { trackView } = useWishlist()

  const [variantId, setVariantId] = useState('stack')
  const [size, setSize] = useState('')
  const [bigColorPref, setBigColorPref] = useState('original')
  const [mediumColorPref, setMediumColorPref] = useState('original')
  const [smallColorPref, setSmallColorPref] = useState('original')
  const [pieceColorPref, setPieceColorPref] = useState('original')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!product) return
    trackView(product.id)
    const initialVariant = product.variants?.stack
      ? 'stack'
      : Object.keys(product.variants || {})[0] || 'stack'
    setVariantId(initialVariant)
    setSize('')
    setBigColorPref('original')
    setMediumColorPref('original')
    setSmallColorPref('original')
    setPieceColorPref('original')
    setQty(1)
    setAdded(false)
    window.scrollTo(0, 0)
  }, [product?.id])

  const currentVariant = product?.variants?.[variantId]
  const availableSizes = currentVariant?.availableSizes || product?.sizes

  // When variant changes, ensure selected size is still valid
  const handleVariantChange = (newVariantId) => {
    setVariantId(newVariantId)
    const nextVariant = product?.variants?.[newVariantId]
    const nextSizes = nextVariant?.availableSizes || product?.sizes || []
    if (size && !nextSizes.includes(size)) {
      setSize('')
    }
  }

  const pricing = useMemo(
    () =>
      product
        ? calcProductPrice({ product, variantId, quantity: qty })
        : null,
    [product, variantId, qty],
  )

  // Predefined available color options from product data
  const availableColorList = useMemo(() => {
    if (!product?.availableColors?.length) return []
    return COLORS.filter((c) => product.availableColors.includes(c.id))
  }, [product])

  const isStack = variantId === 'stack'
  const isBig = variantId === 'big'
  const isMedium = variantId === 'medium'
  const isSmall = variantId === 'small'
  const isPiece = variantId === 'piece'
  const threeColorSections = Boolean(product?.threeColorSections)
  const mediumSmallSections = Boolean(
    product?.mediumSmallSections ||
      (product?.variants?.medium && !product?.variants?.big && !product?.threeColorSections),
  )

  const canAdd = Boolean(product && variantId && size)

  if (loading) {
    return <ProductPageSkeleton />
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-ivory">
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

  const handleAdd = () => {
    if (!canAdd) return

    const bigColorObj = COLORS.find((c) => c.id === bigColorPref)
    const mediumColorObj = COLORS.find((c) => c.id === mediumColorPref)
    const smallColorObj = COLORS.find((c) => c.id === smallColorPref)
    const pieceColorObj = COLORS.find((c) => c.id === pieceColorPref)

    const bigColorLabel =
      bigColorPref === 'original' || !bigColorPref
        ? 'Keep Original Color'
        : bigColorObj?.name || bigColorPref

    const mediumColorLabel =
      mediumColorPref === 'original' || !mediumColorPref
        ? 'Keep Original Color'
        : mediumColorObj?.name || mediumColorPref

    const smallColorLabel =
      smallColorPref === 'original' || !smallColorPref
        ? 'Keep Original Color'
        : smallColorObj?.name || smallColorPref

    const pieceColorLabel =
      pieceColorPref === 'original' || !pieceColorPref
        ? 'Keep Original Color'
        : pieceColorObj?.name || pieceColorPref

    const isOriginal = isStack
      ? threeColorSections
        ? bigColorPref === 'original' &&
          mediumColorPref === 'original' &&
          smallColorPref === 'original'
        : mediumSmallSections
          ? mediumColorPref === 'original' && smallColorPref === 'original'
          : bigColorPref === 'original' && smallColorPref === 'original'
      : isBig
      ? bigColorPref === 'original'
      : isMedium
      ? mediumColorPref === 'original'
      : isSmall
      ? smallColorPref === 'original'
      : pieceColorPref === 'original'

    addItem({
      kind: 'catalog',
      productId: product.id,
      name: product.name,
      variantId,
      variantLabel: currentVariant?.label || variantId,
      size,
      bigColorPreference: isStack || isBig ? bigColorPref : null,
      mediumColorPreference: isStack || isMedium ? mediumColorPref : null,
      smallColorPreference: isStack || isSmall ? smallColorPref : null,
      pieceColorPreference: isPiece ? pieceColorPref : null,
      bigColorLabel: isStack || isBig ? bigColorLabel : null,
      mediumColorLabel: isStack || isMedium ? mediumColorLabel : null,
      smallColorLabel: isStack || isSmall ? smallColorLabel : null,
      pieceColorLabel: isPiece ? pieceColorLabel : null,
      isOriginalColor: isOriginal,
      colorHex:
        (isBig || isStack) && bigColorObj
          ? bigColorObj.hex
          : product.colorPalette?.[0]?.hex || '#c4a574',
      accentHex:
        (isMedium || isStack) && mediumColorObj
          ? mediumColorObj.hex
          : (isSmall || isStack) && smallColorObj
            ? smallColorObj.hex
            : product.colorPalette?.[1]?.hex || product.colorPalette?.[0]?.hex || '#d4a5a5',
      threadingId: 'none',
      price: pricing.unit,
      quantity: qty,
      image: product.image || product.images?.[0] || null,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-ivory text-ink">
      <Navbar solid />
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-24 sm:px-6 sm:pb-28 sm:pt-28 lg:px-8">
        <Link to="/#designs" className="text-sm text-ink-soft hover:text-ink">
          ← Shop collection
        </Link>

        <div className="mt-6 grid min-w-0 gap-10 lg:grid-cols-2">
          {/* Product Gallery */}
          <div className="min-w-0">
            <ProductGallery product={product} />
          </div>

          {/* Product Details & Purchase Form */}
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl text-ink sm:text-4xl md:text-5xl">
                  {product.name}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {product.shortDescription}
                </p>
              </div>
              <WishlistButton productId={product.id} />
            </div>

            <div className="mt-6 space-y-6">
              {/* Variant Selector: Full Stack / Big / Small */}
              <ProductSelector
                variants={product.variants}
                value={variantId}
                onChange={handleVariantChange}
              />

              {/* Size Selector */}
              <SizeSelector
                sizes={product.sizes}
                availableSizes={availableSizes}
                value={size}
                onChange={setSize}
              />

              {/* Color Preference Section */}
              <div className="rounded-3xl border border-border-soft bg-cream/30 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg text-ink">
                    Color Preferences
                  </h3>
                  <span className="text-xs text-ink-soft">
                    Default: Keep original
                  </span>
                </div>

                {/* Full Stack: color preferences per bangle section */}
                {isStack && threeColorSections && (
                  <div className="space-y-5">
                    <ColorPreferenceSelector
                      label="Big Bangle Color"
                      description="Choose silk thread color for the thick magenta statement bangles."
                      colorOptions={availableColorList}
                      originalPalette={product.colorPalette?.slice(0, 1)}
                      value={bigColorPref}
                      onChange={setBigColorPref}
                      productName={product.name}
                      targetPart="Big Bangles"
                    />

                    <ColorPreferenceSelector
                      label="Medium Bangle Color"
                      description="Choose silk thread color for the lime green medium bangles."
                      colorOptions={availableColorList}
                      originalPalette={product.colorPalette?.slice(1, 2)}
                      value={mediumColorPref}
                      onChange={setMediumColorPref}
                      productName={product.name}
                      targetPart="Medium Bangles"
                    />

                    <ColorPreferenceSelector
                      label="Small Bangle Color"
                      description="Choose silk thread color for the maroon and pearl companion bangles."
                      colorOptions={availableColorList}
                      originalPalette={product.colorPalette?.slice(2, 3)}
                      value={smallColorPref}
                      onChange={setSmallColorPref}
                      productName={product.name}
                      targetPart="Small Bangles"
                      showDmPrompt={true}
                    />
                  </div>
                )}

                {/* Full Stack: Medium + Small only (e.g. Pori) */}
                {isStack && mediumSmallSections && !threeColorSections && (
                  <div className="space-y-5">
                    <ColorPreferenceSelector
                      label="Medium Bangle Color"
                      description="Choose silk thread color preference for the magenta medium bangles."
                      colorOptions={availableColorList}
                      originalPalette={product.colorPalette?.slice(0, 1)}
                      value={mediumColorPref}
                      onChange={setMediumColorPref}
                      productName={product.name}
                      targetPart="Medium Bangles"
                    />

                    <ColorPreferenceSelector
                      label="Small Bangle Color"
                      description="Choose silk thread color preference for the silver companion bangles."
                      colorOptions={availableColorList}
                      originalPalette={product.colorPalette?.slice(1, 2)}
                      value={smallColorPref}
                      onChange={setSmallColorPref}
                      productName={product.name}
                      targetPart="Small Bangles"
                      showDmPrompt={true}
                    />
                  </div>
                )}

                {/* Full Stack: standard Big + Small preferences */}
                {isStack && !threeColorSections && !mediumSmallSections && (
                  <div className="space-y-5">
                    <ColorPreferenceSelector
                      label="Big Bangle Color"
                      description="Choose silk thread color preference for the larger statement bangle."
                      colorOptions={availableColorList}
                      originalPalette={product.colorPalette}
                      value={bigColorPref}
                      onChange={setBigColorPref}
                      productName={product.name}
                      targetPart="Big Bangle"
                    />

                    <ColorPreferenceSelector
                      label="Small Bangle Color"
                      description="Choose silk thread color preference for the smaller companion bangles."
                      colorOptions={availableColorList}
                      originalPalette={product.colorPalette}
                      value={smallColorPref}
                      onChange={setSmallColorPref}
                      productName={product.name}
                      targetPart="Small Bangles"
                      showDmPrompt={true}
                    />
                  </div>
                )}

                {/* Medium Bangle Only */}
                {isMedium && (
                  <ColorPreferenceSelector
                    label="Medium Bangle Color Preference"
                    description="Choose silk thread color preference for your medium bangles."
                    colorOptions={availableColorList}
                    originalPalette={
                      product.mediumSmallSections
                        ? product.colorPalette?.slice(0, 1)
                        : product.colorPalette?.slice(1, 2)
                    }
                    value={mediumColorPref}
                    onChange={setMediumColorPref}
                    productName={product.name}
                    targetPart="Medium Bangles"
                    showDmPrompt={true}
                  />
                )}

                {/* Big Bangle Only */}
                {isBig && (
                  <ColorPreferenceSelector
                    label="Big Bangle Color Preference"
                    description="Choose silk thread color preference for your statement bangle."
                    colorOptions={availableColorList}
                    originalPalette={product.colorPalette}
                    value={bigColorPref}
                    onChange={setBigColorPref}
                    productName={product.name}
                    targetPart="Big Bangle"
                    showDmPrompt={true}
                  />
                )}

                {/* Small Bangle Only */}
                {isSmall && (
                  <ColorPreferenceSelector
                    label="Small Bangle Color Preference"
                    description="Choose silk thread color preference for your companion bangle."
                    colorOptions={availableColorList}
                    originalPalette={product.colorPalette}
                    value={smallColorPref}
                    onChange={setSmallColorPref}
                    productName={product.name}
                    targetPart="Small Bangle"
                    showDmPrompt={true}
                  />
                )}

                {/* Single Piece (e.g. Charkona) */}
                {isPiece && (
                  <ColorPreferenceSelector
                    label="Bangle Color Preference"
                    description="Choose silk thread color preference for this piece."
                    colorOptions={availableColorList}
                    originalPalette={product.colorPalette}
                    value={pieceColorPref}
                    onChange={setPieceColorPref}
                    productName={product.name}
                    targetPart="Per Piece Bangle"
                    showDmPrompt={true}
                  />
                )}
              </div>

              {/* Quantity */}
              <div>
                <p className="mb-2 text-sm font-semibold">Quantity</p>
                <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-cream px-2">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold">{qty}</span>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center"
                    onClick={() => setQty((q) => Math.min(20, q + 1))}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-2xl border border-border-soft bg-cream/50 p-4 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <span>Unit price ({currentVariant?.label || 'Item'})</span>
                  <span>{formatBDT(pricing.unit)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border-soft pt-2 font-semibold text-ink">
                  <span>Total</span>
                  <span>{formatBDT(pricing.total)}</span>
                </div>
              </div>

              {/* Add to Cart Button (Desktop & Tablet) */}
              <button
                type="button"
                disabled={!canAdd}
                onClick={handleAdd}
                className="hidden min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-ivory transition hover:bg-ink/90 active:scale-[0.99] disabled:opacity-40 sm:inline-flex"
              >
                {added ? (
                  <>
                    <Check size={18} /> Added to bag ✨
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Add to bag
                  </>
                )}
              </button>
              {!size && (
                <p className="text-xs text-dusty-rose">Please select your size to continue.</p>
              )}
            </div>

            {/* Design Details & Information */}
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

              {/* Soft DM Customization CTA */}
              <DmCustomizationCta
                compact
                title="Want a different design or color?"
                description="If you're looking for an intricate custom motif, specific stone detailing, or a different colorway, send us a quick DM."
                customMessage={`Hi Chumki! ✨ I was looking at "${product.name}" and wanted to ask about a custom variation.`}
              />
            </div>
          </div>
        </div>

        {/* Related Designs */}
        {related.filter((p) => p.image).length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-3xl text-ink">Related designs</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {related
                .filter((p) => p.image)
                .map((p) => (
                  <Link key={p.id} to={`/product/${p.id}`} className="group">
                    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-border-soft/60 bg-cream/30 p-3">
                      <img
                        src={p.image}
                        alt={`${p.name} bangle set by Chumki`}
                        className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
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

      {/* Sticky Mobile Add To Cart Bar */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-ivory/95 px-3 pt-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div>
            <p className="text-[11px] text-ink-soft">Total</p>
            <p className="font-semibold text-ink">{formatBDT(pricing.total)}</p>
          </div>
          <button
            type="button"
            disabled={!canAdd}
            onClick={handleAdd}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-ivory transition active:scale-98 disabled:opacity-40"
          >
            {added ? (
              <>
                <Check size={18} /> Added ✨
              </>
            ) : (
              <>
                <ShoppingBag size={18} /> Add to bag
              </>
            )}
          </button>
        </div>
      </div>

      <Footer />
      <CartDrawer />
    </div>
  )
}
