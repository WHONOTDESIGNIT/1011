const PATH_TO_LOCALE: Array<{ prefix: string; locale: string }> = [
  { prefix: 'pt-BR', locale: 'pt-BR' },
  { prefix: 'pt-PT', locale: 'pt-PT' },
  { prefix: 'es', locale: 'es-ES' },
  { prefix: 'tr', locale: 'tr' },
  { prefix: 'ro', locale: 'ro' },
  { prefix: 'ar', locale: 'ar' },
  { prefix: 'fr', locale: 'fr' },
  { prefix: 'ru', locale: 'ru' },
  { prefix: 'he', locale: 'he' },
  { prefix: 'fa', locale: 'fa' },
  { prefix: 'el', locale: 'el' },
  { prefix: 'nl', locale: 'nl' },
  { prefix: 'id', locale: 'id' },
  { prefix: 'th', locale: 'th' },
  { prefix: 'pl', locale: 'pl' },
  { prefix: 'ja', locale: 'ja' },
  { prefix: 'ko', locale: 'ko' },
  { prefix: 'cs', locale: 'cs' },
  { prefix: 'vi', locale: 'vi' },
  { prefix: 'de', locale: 'de' },
  { prefix: 'it', locale: 'it' },
];

export function getPageLocale(currentLocale: string | undefined, pathname: string): string {
  if (currentLocale) return currentLocale;

  for (const { prefix, locale } of PATH_TO_LOCALE) {
    if (pathname === `/${prefix}` || pathname.startsWith(`/${prefix}/`)) {
      return locale;
    }
  }

  return 'en';
}
