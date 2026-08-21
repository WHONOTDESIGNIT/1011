// 语言显示名（用于语言切换器）
export const languages = {
  en: 'English',
  tr: 'Türkçe',
} as const;

export const defaultLang = 'en';

// 翻译字典：en 与 tr 的 key 集合必须完全一致
// 用法：const translate = useTranslations(Astro.currentLocale); translate('nav.home')
export const ui = {
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.services': 'Services',
    'lang.switch': 'Switch language',
    'hero.title': 'Welcome to the iShine i18n Prototype',
    'hero.desc':
      'A minimal two-language prototype powered by Astro official i18n routing. English is the default language and has no URL prefix.',
    'about.title': 'About',
    'about.desc':
      'This page exists in both English and Turkish. Turkish pages live under the /tr/ URL prefix.',
    'services.title': 'Services',
    'services.desc':
      'This page exists ONLY in English. The fallback config (tr → en) makes /tr/services redirect here instead of returning a 404.',
    'fallback.link': 'Open /tr/services to test the fallback →',
    'meta.current': 'Astro.currentLocale',
    'meta.url': 'URL',
    'footer.text':
      'i18n prototype · defaultLocale=en · prefixDefaultLocale=false · fallback tr → en',
  },
  tr: {
    'nav.home': 'Ana Sayfa',
    'nav.about': 'Hakkımızda',
    'nav.services': 'Hizmetler',
    'lang.switch': 'Dil değiştir',
    'hero.title': 'iShine i18n Prototipine Hoş Geldiniz',
    'hero.desc':
      'Astro resmi i18n yönlendirmesiyle oluşturulmuş iki dilli minimal bir prototip. İngilizce varsayılan dildir ve URL öneki yoktur.',
    'about.title': 'Hakkımızda',
    'about.desc':
      'Bu sayfa hem İngilizce hem Türkçe olarak mevcuttur. Türkçe sayfalar /tr/ URL öneki altında yer alır.',
    'services.title': 'Hizmetler',
    'services.desc':
      'Bu sayfa SADECE İngilizce olarak mevcuttur. fallback ayarı (tr → en) sayesinde /tr/services adresi 404 yerine bu sayfaya yönlendirilir.',
    'fallback.link': 'Fallback testi için /tr/services adresini açın →',
    'meta.current': 'Astro.currentLocale',
    'meta.url': 'URL',
    'footer.text':
      'i18n prototipi · defaultLocale=en · prefixDefaultLocale=false · fallback tr → en',
  },
} as const;

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}
