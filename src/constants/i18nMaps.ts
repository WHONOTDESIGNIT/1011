import type { AppLocale } from '@/i18n';

export const LANGUAGE_SWITCHER_LOCALE_MAP: Record<AppLocale, 'languageSwitcher.locale_en'> = {
  en: 'languageSwitcher.locale_en',
} as const;

export type ContactInfoTitle = 'Address' | 'Email' | 'Phone' | 'Business Hours';

export const CONTACT_INFO_HEADING_MAP: Record<ContactInfoTitle, 'contact.info.address' | 'contact.info.email' | 'contact.info.phone' | 'contact.info.businessHours'> = {
  Address: 'contact.info.address',
  Email: 'contact.info.email',
  Phone: 'contact.info.phone',
  'Business Hours': 'contact.info.businessHours',
} as const;

export const PRODUCT_STATUS_MAP = {
  inStock: 'products.status.inStock',
  outOfStock: 'products.status.outOfStock',
  preOrder: 'products.status.preOrder',
} as const;

export const ERROR_CODE_MAP = {
  404: 'errors.pageNotFound',
  500: 'errors.serverError',
} as const;
