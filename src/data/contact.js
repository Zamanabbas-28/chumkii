import { PAYMENT_CONFIG } from '../config/paymentConfig'

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
 * Contact & social links.
 * WhatsApp matches the bKash/Rocket payment number.
 * Instagram is live: @chumkii.ii
 */
export const CONTACT = {
  whatsappNumber: toWhatsAppIntl(PAYMENT_CONFIG.payToNumber),
  instagramUrl: 'https://www.instagram.com/chumkii.ii/',
  instagramHandle: '@chumkii.ii',
  email: '',
}

export function getWhatsAppUrl(message = '') {
  const num = CONTACT.whatsappNumber
  if (!num) return null
  const text = encodeURIComponent(message)
  return `https://wa.me/${num}${text ? `?text=${text}` : ''}`
}

export function buildInquiryMessage(details) {
  const lines = [
    'Hi Chumki! I have a customization / design inquiry:',
    '',
    ...Object.entries(details)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}: ${v}`),
  ]
  return lines.join('\n')
}
