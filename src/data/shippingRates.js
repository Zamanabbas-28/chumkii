/**
 * Internal shipping configuration for Chumki (Sylhet pickup).
 * Customers never see pickup, weight, courier names, or rate charts —
 * only a single "Delivery" line at checkout.
 *
 * Edit DESTINATION_RATES / PLATFORM_FEE / WEIGHT_RULES here when rates change.
 */

/** Fixed pickup — internal only */
export const PICKUP = {
  city: 'Sylhet',
  area: 'Sadar',
  label: 'Sadar, Sylhet',
}

/** Platform fee (৳) — included in customer-facing Delivery total */
export const PLATFORM_FEE = 10

/**
 * Weight by total cart quantity (sum of line quantities).
 * First matching tier wins (sorted by maxQty ascending).
 */
export const WEIGHT_RULES = [
  { maxQty: 2, kg: 0.25 },
  { maxQty: Infinity, kg: 0.5 },
]

/**
 * Base courier rates by destination zone (৳), before platform fee.
 * Customer-facing Delivery = base + PLATFORM_FEE
 *   sylhet → 70, dhaka → 115, other → 135
 */
export const DESTINATION_RATES = {
  sylhet: { base: 60 },
  dhaka: { base: 105 },
  other: { base: 125 },
}

/**
 * All Bangladesh districts with internal zone mapping.
 * zone: 'sylhet' | 'dhaka' | 'other'
 */
export const DISTRICTS = [
  { id: 'bagerhat', name: 'Bagerhat', zone: 'other' },
  { id: 'bandarban', name: 'Bandarban', zone: 'other' },
  { id: 'barguna', name: 'Barguna', zone: 'other' },
  { id: 'barishal', name: 'Barishal', zone: 'other' },
  { id: 'bhola', name: 'Bhola', zone: 'other' },
  { id: 'bogura', name: 'Bogura', zone: 'other' },
  { id: 'brahmanbaria', name: 'Brahmanbaria', zone: 'other' },
  { id: 'chandpur', name: 'Chandpur', zone: 'other' },
  { id: 'chattogram', name: 'Chattogram', zone: 'other' },
  { id: 'chuadanga', name: 'Chuadanga', zone: 'other' },
  { id: 'coxsbazar', name: "Cox's Bazar", zone: 'other' },
  { id: 'cumilla', name: 'Cumilla', zone: 'other' },
  { id: 'dhaka', name: 'Dhaka', zone: 'dhaka' },
  { id: 'dinajpur', name: 'Dinajpur', zone: 'other' },
  { id: 'faridpur', name: 'Faridpur', zone: 'other' },
  { id: 'feni', name: 'Feni', zone: 'other' },
  { id: 'gaibandha', name: 'Gaibandha', zone: 'other' },
  { id: 'gazipur', name: 'Gazipur', zone: 'other' },
  { id: 'gopalganj', name: 'Gopalganj', zone: 'other' },
  { id: 'habiganj', name: 'Habiganj', zone: 'sylhet' },
  { id: 'jamalpur', name: 'Jamalpur', zone: 'other' },
  { id: 'jashore', name: 'Jashore', zone: 'other' },
  { id: 'jhalokathi', name: 'Jhalokathi', zone: 'other' },
  { id: 'jhenaidah', name: 'Jhenaidah', zone: 'other' },
  { id: 'joypurhat', name: 'Joypurhat', zone: 'other' },
  { id: 'khagrachhari', name: 'Khagrachhari', zone: 'other' },
  { id: 'khulna', name: 'Khulna', zone: 'other' },
  { id: 'kishoreganj', name: 'Kishoreganj', zone: 'other' },
  { id: 'kurigram', name: 'Kurigram', zone: 'other' },
  { id: 'kushtia', name: 'Kushtia', zone: 'other' },
  { id: 'lakshmipur', name: 'Lakshmipur', zone: 'other' },
  { id: 'lalmonirhat', name: 'Lalmonirhat', zone: 'other' },
  { id: 'madaripur', name: 'Madaripur', zone: 'other' },
  { id: 'magura', name: 'Magura', zone: 'other' },
  { id: 'manikganj', name: 'Manikganj', zone: 'other' },
  { id: 'meherpur', name: 'Meherpur', zone: 'other' },
  { id: 'moulvibazar', name: 'Moulvibazar', zone: 'sylhet' },
  { id: 'munshiganj', name: 'Munshiganj', zone: 'other' },
  { id: 'mymensingh', name: 'Mymensingh', zone: 'other' },
  { id: 'naogaon', name: 'Naogaon', zone: 'other' },
  { id: 'narail', name: 'Narail', zone: 'other' },
  { id: 'narayanganj', name: 'Narayanganj', zone: 'other' },
  { id: 'narsingdi', name: 'Narsingdi', zone: 'other' },
  { id: 'natore', name: 'Natore', zone: 'other' },
  { id: 'netrokona', name: 'Netrokona', zone: 'other' },
  { id: 'nilphamari', name: 'Nilphamari', zone: 'other' },
  { id: 'noakhali', name: 'Noakhali', zone: 'other' },
  { id: 'pabna', name: 'Pabna', zone: 'other' },
  { id: 'panchagarh', name: 'Panchagarh', zone: 'other' },
  { id: 'patuakhali', name: 'Patuakhali', zone: 'other' },
  { id: 'pirojpur', name: 'Pirojpur', zone: 'other' },
  { id: 'rajbari', name: 'Rajbari', zone: 'other' },
  { id: 'rajshahi', name: 'Rajshahi', zone: 'other' },
  { id: 'rangamati', name: 'Rangamati', zone: 'other' },
  { id: 'rangpur', name: 'Rangpur', zone: 'other' },
  { id: 'satkhira', name: 'Satkhira', zone: 'other' },
  { id: 'shariatpur', name: 'Shariatpur', zone: 'other' },
  { id: 'sherpur', name: 'Sherpur', zone: 'other' },
  { id: 'sirajganj', name: 'Sirajganj', zone: 'other' },
  { id: 'sunamganj', name: 'Sunamganj', zone: 'sylhet' },
  { id: 'sylhet', name: 'Sylhet', zone: 'sylhet' },
  { id: 'tangail', name: 'Tangail', zone: 'other' },
  { id: 'thakurgaon', name: 'Thakurgaon', zone: 'other' },
]

export function getDistrictById(id) {
  return DISTRICTS.find((d) => d.id === id) || null
}
