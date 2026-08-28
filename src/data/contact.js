import {
  contactConfig,
  CONTACT_CONFIG,
  toWhatsAppIntl,
  getWhatsAppUrl,
  getInstagramUrl,
  getPrimaryDmUrl,
  buildInquiryMessage,
} from '../config/contact'

export {
  contactConfig,
  CONTACT_CONFIG,
  toWhatsAppIntl,
  getWhatsAppUrl,
  getInstagramUrl,
  getPrimaryDmUrl,
  buildInquiryMessage,
}

export const CONTACT = {
  whatsappNumber: contactConfig.whatsappNumber,
  instagramUrl: contactConfig.instagramUrl || 'https://www.instagram.com/chumkii.ii/',
  instagramHandle: contactConfig.instagramHandle || '@chumkii.ii',
  email: contactConfig.email,
}
