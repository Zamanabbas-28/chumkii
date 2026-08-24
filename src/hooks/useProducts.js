import { useCallback, useEffect, useState } from 'react'
import {
  fetchProducts,
  fetchProductBySlug,
  getRelatedFromList,
} from '../services/productService'

/**
 * Load the active catalog from Supabase (with local fallback).
 */
export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fromFallback, setFromFallback] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    const result = await fetchProducts()
    setProducts(result.products)
    setFromFallback(result.fromFallback)
    setError(result.error)
    setLoading(false)
    return result
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const result = await fetchProducts()
      if (cancelled) return
      setProducts(result.products)
      setFromFallback(result.fromFallback)
      setError(result.error)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { products, loading, error, fromFallback, reload }
}

/**
 * Load a single product by slug/id (route param).
 */
export function useProduct(slug) {
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fromFallback, setFromFallback] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) {
      setProduct(null)
      setRelated([])
      setLoading(false)
      setNotFound(true)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setNotFound(false)
      setError(null)

      const [{ product: found, fromFallback: fb, error: err }, catalog] =
        await Promise.all([fetchProductBySlug(slug), fetchProducts()])

      if (cancelled) return

      setProduct(found)
      setFromFallback(fb)
      setError(err)
      setNotFound(!found)
      setRelated(found ? getRelatedFromList(found, catalog.products) : [])
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [slug])

  return { product, related, loading, error, fromFallback, notFound }
}
