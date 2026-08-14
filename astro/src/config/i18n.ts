export const SUPPORTED_LANGUAGES = ["en", "tr", "ro", "ar", "es", "fr", "ru", "he", "pt-BR", "nl", "pl", "ja", "ko"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface LanguageMeta {
  /** 语言代码（Astro 路由前缀 / getRelativeLocaleUrl 使用） */
  code: string;
  /** 国旗对应的国家代码（flagcdn.com 资源） */
  countryCode: string;
  /** 英文名称 */
  label: string;
  /** 语种原生名称（弹窗内展示） */
  nativeName: string;
  /** 国旗图标 URL（CDN 外链，高清可缩放 SVG） */
  flagUrl: string;
  /** 当前站点是否已启用该语言（仅启用语言可点击切换） */
  enabled: boolean;
}

const flag = (cc: string) => `https://flagcdn.com/${cc}.svg`;

export const LANGUAGE_CONFIG: LanguageMeta[] = [
  { code: "en",    countryCode: "us", label: "English",     nativeName: "English",                flagUrl: flag("us"), enabled: true },
  { code: "tr",    countryCode: "tr", label: "Turkish",     nativeName: "Türkçe",                 flagUrl: flag("tr"), enabled: true },
  { code: "ro",    countryCode: "ro", label: "Romanian",    nativeName: "Română",                 flagUrl: flag("ro"), enabled: true },
  { code: "ar",    countryCode: "sa", label: "Arabic",      nativeName: "العربية",                flagUrl: flag("sa"), enabled: true },
  { code: "he",    countryCode: "il", label: "Hebrew",      nativeName: "עברית",                  flagUrl: flag("il"), enabled: true },
  { code: "fr",    countryCode: "fr", label: "French",      nativeName: "Français",               flagUrl: flag("fr"), enabled: true },
  { code: "da",    countryCode: "dk", label: "Danish",      nativeName: "Dansk",                  flagUrl: flag("dk"), enabled: false },
  { code: "lt",    countryCode: "lt", label: "Lithuanian",  nativeName: "Lietuvių",               flagUrl: flag("lt"), enabled: false },
  { code: "sv",    countryCode: "se", label: "Swedish",     nativeName: "Svenska",                flagUrl: flag("se"), enabled: false },
  { code: "nl",    countryCode: "nl", label: "Dutch",       nativeName: "Nederlands",             flagUrl: flag("nl"), enabled: true },
  { code: "pt-BR", countryCode: "br", label: "Portuguese (Brazil)", nativeName: "Português (Brasil)", flagUrl: flag("br"), enabled: true },
  { code: "id",    countryCode: "id", label: "Indonesian",  nativeName: "Bahasa Indonesia",       flagUrl: flag("id"), enabled: false },
  { code: "th",    countryCode: "th", label: "Thai",        nativeName: "ไทย",                    flagUrl: flag("th"), enabled: false },
  { code: "ko",    countryCode: "kr", label: "Korean",      nativeName: "한국어",                  flagUrl: flag("kr"), enabled: true },
  { code: "ja",    countryCode: "jp", label: "Japanese",    nativeName: "日本語",                  flagUrl: flag("jp"), enabled: true },
  { code: "af",    countryCode: "za", label: "Afrikaans",   nativeName: "Afrikaans",              flagUrl: flag("za"), enabled: false },
  { code: "it",    countryCode: "it", label: "Italian",     nativeName: "Italiano",               flagUrl: flag("it"), enabled: false },
  { code: "ru",    countryCode: "ru", label: "Russian",     nativeName: "Русский",                flagUrl: flag("ru"), enabled: true },
  { code: "es",    countryCode: "es", label: "Spanish",     nativeName: "Español",                flagUrl: flag("es"), enabled: true },
  { code: "pl",    countryCode: "pl", label: "Polish",      nativeName: "Polski",                 flagUrl: flag("pl"), enabled: true },
];

// 国家/地区 → 语言 映射（Edge Function 地理检测用）
export const COUNTRY_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  TR: "tr",
};

// 语言 → 区域格式化规则（Intl 日期/时间/数字/货币、时区、日历）
export interface RegionConfig {
  locale: string;
  timeZone: string;
  calendar: string;
  numberingSystem: string;
  currency: string;
}

export const REGION_CONFIG: Record<string, RegionConfig> = {
  "pt-BR": {
    locale: "pt-BR",
    timeZone: "America/Sao_Paulo",
    calendar: "gregory",
    numberingSystem: "latn",
    currency: "BRL",
  },
  pl: {
    locale: "pl-PL",
    timeZone: "Europe/Warsaw",
    calendar: "gregory",
    numberingSystem: "latn",
    currency: "PLN",
  },
  ja: {
    locale: "ja-JP",
    timeZone: "Asia/Tokyo",
    calendar: "gregory",
    numberingSystem: "latn",
    currency: "JPY",
  },
  ko: {
    locale: "ko-KR",
    timeZone: "Asia/Seoul",
    calendar: "gregory",
    numberingSystem: "latn",
    currency: "KRW",
  },
};
