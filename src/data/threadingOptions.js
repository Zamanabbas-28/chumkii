/**
 * Decorative threading options — add new styles here; UI renders from this list.
 * Silver threading = thin metallic wrap over the base colour (not a base colour itself).
 */
export const THREADING_OPTIONS = [
  {
    id: 'none',
    name: 'No Decorative Threading',
    description: 'Clean coloured thread wrap without extra metallic detailing.',
    price: 0,
    preview: null,
  },
  {
    id: 'silver',
    name: 'Silver Threading',
    description:
      'Thin metallic silver thread wrapped over your base colour in a delicate spiral pattern.',
    price: 100,
    preview: '/images/threading-silver-ref.png',
  },
]

export function getThreadingById(id) {
  return THREADING_OPTIONS.find((t) => t.id === id) || THREADING_OPTIONS[0]
}
