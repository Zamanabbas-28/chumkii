/**
 * Delivery info for Chumki (Sylhet, Bangladesh) — edit here only.
 */
export const SHIPPING = {
  coverage: 'We deliver across Bangladesh.',
  sylhet: {
    label: 'Within Sylhet',
    days: '6–7 days',
  },
  outsideSylhet: {
    label: 'Outside Sylhet',
    days: '10–12 days',
  },
  note: 'Timelines begin after your order details are confirmed. Handmade pieces may take a little extra care depending on the design.',
}

export function getShippingSummaryText() {
  return `${SHIPPING.coverage} ${SHIPPING.sylhet.label}: about ${SHIPPING.sylhet.days}. ${SHIPPING.outsideSylhet.label}: about ${SHIPPING.outsideSylhet.days}.`
}
