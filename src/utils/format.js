/** Format a number as Bangladeshi Taka, e.g. ৳1,200 */
export function formatBDT(amount) {
  return `৳${Number(amount).toLocaleString('en-BD')}`
}

export function scrollToId(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
