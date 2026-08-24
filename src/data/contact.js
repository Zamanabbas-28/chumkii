/**
 * Contact & social links — replace WhatsApp when ready.
 * Instagram is live: @chumkii.ii
 */
export const CONTACT = {
  // Replace with your number in international format without + (e.g. 8801XXXXXXXXX)
  whatsappNumber: 'YOUR_WHATSAPP_NUMBER',
  instagramUrl: 'https://www.instagram.com/chumkii.ii/',
  instagramHandle: '@chumkii.ii',
  email: '', // optional
}

export function getWhatsAppUrl(message = '') {
  const num = CONTACT.whatsappNumber
  if (!num || num === 'YOUR_WHATSAPP_NUMBER') {
    return null
  }
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
