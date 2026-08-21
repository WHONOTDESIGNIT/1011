// 为 LanguageSwitcher 与 StickyContact 本地化新增键（三语）
const fs = require('fs');

const additions = {
  en: {
    common: {
      breadcrumb: 'Breadcrumb',
      close: 'Close',
      explore: 'Explore',
    },
    languageSwitcher: {
      chooseLanguage: 'Choose your language',
      close: 'Close language picker',
      comingSoon: 'Soon',
    },
    stickyContact: {
      wechatTip: 'Chat on WeChat — get a reply within 10 minutes',
      whatsappTip: 'Chat on WhatsApp — get a reply within 10 minutes',
      wechatQrAlt: 'WeChat QR Code',
    },
  },
  tr: {
    common: {
      breadcrumb: 'İçerik Haritası',
      close: 'Kapat',
      explore: 'Keşfet',
    },
    languageSwitcher: {
      chooseLanguage: 'Dil Seçin',
      close: 'Dil seçiciyi kapat',
      comingSoon: 'Yakında',
    },
    stickyContact: {
      wechatTip: 'WeChat üzerinden yazın — 10 dakika içinde yanıt alın',
      whatsappTip: 'WhatsApp üzerinden yazın — 10 dakika içinde yanıt alın',
      wechatQrAlt: 'WeChat QR Kodu',
    },
  },
  ar: {
    common: {
      breadcrumb: 'مسار التنقل',
      close: 'إغلاق',
      explore: 'استكشف',
    },
    languageSwitcher: {
      chooseLanguage: 'اختر لغتك',
      close: 'إغلاق منتقي اللغة',
      comingSoon: 'قريبًا',
    },
    stickyContact: {
      wechatTip: 'تحدث عبر WeChat — ستحصل على رد خلال 10 دقائق',
      whatsappTip: 'تحدث عبر WhatsApp — ستحصل على رد خلال 10 دقائق',
      wechatQrAlt: 'رمز WeChat QR',
    },
  },
};

for (const lang of ['en', 'tr', 'ar']) {
  const file = `messages/${lang}.json`;
  const o = JSON.parse(fs.readFileSync(file, 'utf8'));
  const add = additions[lang];
  // common 命名空间
  o.common = Object.assign({}, add.common, o.common);
  // languageSwitcher 命名空间
  o.languageSwitcher = Object.assign({}, add.languageSwitcher, o.languageSwitcher);
  // stickyContact 命名空间
  o.stickyContact = Object.assign({}, add.stickyContact, o.stickyContact || {});
  fs.writeFileSync(file, JSON.stringify(o, null, 2));
  console.log(`${lang}.json 已更新`);
}
