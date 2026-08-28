import { STORE_CONFIG } from './store'

/**
 * Convert a BD local mobile (01XXXXXXXXX) to WhatsApp international digits.
 */
export function toWhatsAppIntl(localOrIntl) {
  const digits = String(localOrIntl || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('880')) return digits
  if (digits.startsWith('0')) return `88${digits}`
  return `880${digits}`
}

/**
 * Centralized Contact & Social DM Configuration for Chumki.
 * Store owner can configure WhatsApp and Instagram details here.
 */
export const contactConfig = {
  storeName: STORE_CONFIG.name,
  // Official Chumki WhatsApp number (local or intl format)
  whatsappNumber: toWhatsAppIntl(STORE_CONFIG.paymentNumber || '01328030704'),
  // Official Chumki Instagram URL and handle
  instagramUrl: 'https://www.instagram.com/chumkii.ii/',
  instagramHandle: '@chumkii.ii',
  email: '',
  channels: [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      type: 'chat',
      enabled: true,
      actionLabel: 'Chat with us',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      handle: '@chumkii.ii',
      type: 'social',
      enabled: true,
      url: 'https://www.instagram.com/chumkii.ii/',
      actionLabel: 'Send us a DM',
    },
  ],
}

export const CONTACT_CONFIG = contactConfig

/**
 * Get direct WhatsApp link with prefilled inquiry message.
 * Formats cleanly for mobile apps and WhatsApp Web on desktop.
 */
export function getWhatsAppUrl(message = '') {
  const num = contactConfig.whatsappNumber
  if (!num) return null
  const defaultMsg = message || "Hi Chumki! ✨ I'd like to ask about a customized bangle."
  const text = encodeURIComponent(defaultMsg)
  return `https://wa.me/${num}?text=${text}`
}

/**
 * Get official Instagram profile URL.
 */
export function getInstagramUrl() {
  return contactConfig.instagramUrl || 'https://www.instagram.com/chumkii.ii/'
}

/**
 * Primary DM URL helper.
 */
export function getPrimaryDmUrl(customMessage = '') {
  return getWhatsAppUrl(customMessage) || getInstagramUrl()
}

/**
 * Helper to build custom inquiry text.
 */
export function buildInquiryMessage(details = {}) {
  const lines = [
    'Hi Chumki! ✨ I have a custom design / color inquiry:',
    '',
    ...Object.entries(details)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}: ${v}`),
  ]
  return lines.join('\n')
}
