export const SUPPORTED_LANGUAGES = ["en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_CONFIG = [
  { code: "en", label: "English", flag: "🇺🇸" },
] as const;

export const COUNTRY_LANGUAGE_MAP: Record<string, SupportedLanguage> = {};
