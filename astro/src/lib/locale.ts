// URL 路径段 ↔ 内部 locale ↔ hreflang 输出 三层解耦映射：
// 路径段全小写（/pt-br/，Netlify Linux 文件系统友好），
// 内部 locale 保持 BCP 47（pt-BR，与内容目录/messages 一致），
// hreflang 属性值输出 BCP 47（pt-BR，符合规范可读性）。
export const pathToLocale: Record<string, string> = {
  'pt-br': 'pt-BR',
  'pt-pt': 'pt-PT',
  es: 'es-ES',
};

export const localeToPath: Record<string, string> = {
  'pt-BR': 'pt-br',
  'pt-PT': 'pt-pt',
  'es-ES': 'es',
};

export const localeToHreflang: Record<string, string> = {
  'pt-BR': 'pt-BR',
  'pt-PT': 'pt-PT',
  'es-ES': 'es-ES',
};

const PATH_TO_LOCALE: Array<{ prefix: string; locale: string }> = [
  { prefix: 'pt-br', locale: 'pt-BR' },
  { prefix: 'pt-pt', locale: 'pt-PT' },
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
