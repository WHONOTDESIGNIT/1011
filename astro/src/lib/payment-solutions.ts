// 支付解决方案数据（2026-10-12）
//
// 用途：产品详情页「Accepted Payment Methods」区块下方的本地收款方案，按语种给出
// 该市场可用的清算网络与到账时效。
//
// ⚠️ 公开站原则：本文件只描述「币种 + 清算网络 + 到账时效」，**不写银行名、账号、SWIFT/IBAN**。
//    账户信息一律随 PI 提供（铁律：任何账户变更必须电话/视频复核，不得仅凭邮件）。
//    完整内部总表见 MD-PRODUCTS-INFOS/1011-main-支付方式与推荐收款账户.md。
//
// 译文键：messages/<locale>.json → productDetail.paymentSolutions.*
//   · regions.*  12 个区域名
//   · timings.*  7 个到账时效短语
// 网络名（SEPA Instant / NAPAS / Pix / PromptPay…）是专有名词，不翻译，故写在本文件里。
// 某语种缺译文时 t() 会回退到 en，不会渲染出 key 字符串。

export type PaymentTimingKey =
  | 'realTime'
  | 'sameDay'
  | 'oneDay'
  | 'oneToTwoDays'
  | 'oneToThreeDays'
  | 'oneToFiveDays'
  | 'twoHours';

export type PaymentRegionKey =
  | 'eurozone'
  | 'uk'
  | 'denmark'
  | 'latam'
  | 'brazil'
  | 'vietnam'
  | 'thailand'
  | 'indonesia'
  | 'india'
  | 'malaysia'
  | 'africa'
  | 'global';

export interface PaymentRow {
  /** 收款币种（ISO 4217，不翻译） */
  currency: string;
  /** 清算网络（专有名词，不翻译） */
  network: string;
  /** 到账时效的译文键 */
  timing: PaymentTimingKey;
}

/** 全部区域，顺序即折叠区内的展示顺序 */
export const ALL_PAYMENT_REGIONS: PaymentRegionKey[] = [
  'eurozone',
  'uk',
  'denmark',
  'latam',
  'brazil',
  'vietnam',
  'thailand',
  'indonesia',
  'india',
  'malaysia',
  'africa',
  'global',
];

const REGION_ROWS: Record<PaymentRegionKey, PaymentRow[]> = {
  eurozone: [
    { currency: 'EUR', network: 'SEPA Instant', timing: 'sameDay' },
    { currency: 'EUR', network: 'SEPA Credit Transfer', timing: 'oneToTwoDays' },
  ],
  uk: [
    { currency: 'GBP', network: 'Faster Payments (FPS)', timing: 'realTime' },
    { currency: 'GBP', network: 'CHAPS', timing: 'sameDay' },
    { currency: 'GBP', network: 'BACS', timing: 'oneToThreeDays' },
  ],
  denmark: [{ currency: 'DKK', network: 'DKK local payments', timing: 'oneToTwoDays' }],
  latam: [
    { currency: 'MXN', network: 'SPEI', timing: 'sameDay' },
    { currency: 'COP', network: 'Bre-B', timing: 'realTime' },
    { currency: 'COP', network: 'ACH', timing: 'sameDay' },
  ],
  brazil: [{ currency: 'BRL', network: 'Pix', timing: 'realTime' }],
  vietnam: [
    { currency: 'VND', network: 'NAPAS', timing: 'sameDay' },
    { currency: 'VND', network: 'CITAD', timing: 'oneToTwoDays' },
  ],
  thailand: [
    { currency: 'THB', network: 'PromptPay', timing: 'realTime' },
    { currency: 'THB', network: 'Bahtnet', timing: 'sameDay' },
  ],
  indonesia: [
    { currency: 'IDR', network: 'BI-FAST', timing: 'realTime' },
    { currency: 'IDR', network: 'LLG / RTGS', timing: 'sameDay' },
  ],
  india: [{ currency: 'INR', network: 'NEFT / IMPS / RTGS', timing: 'realTime' }],
  malaysia: [
    { currency: 'MYR', network: 'DuitNow', timing: 'twoHours' },
    { currency: 'MYR', network: 'IBG', timing: 'oneDay' },
  ],
  africa: [
    { currency: 'NGN', network: 'NIBSS / NIP', timing: 'twoHours' },
    { currency: 'GHS', network: 'GhIPSS Instant Pay (GIP)', timing: 'realTime' },
    { currency: 'KES', network: 'M-Pesa / Pesalink', timing: 'realTime' },
    { currency: 'ZAR', network: 'RTC / Instant EFT', timing: 'realTime' },
    { currency: 'XAF', network: 'NEFT / RTGS', timing: 'oneDay' },
  ],
  global: [
    { currency: 'USD / EUR / GBP / CNY / AUD / CAD / CHF / AED …', network: 'SWIFT (T/T)', timing: 'oneToFiveDays' },
  ],
};

/**
 * 语种 → 主推区域（其余区域进折叠区）。
 * 键为 Astro.currentLocale 的内部 code：西语是 'es-ES'，葡语是 'pt-BR' / 'pt-PT'。
 * 表里没有的语种（tr/ro/ru/he/fa/pl/cs/ja/ko/ar）表示当地没有本地清算网络可讲，默认主推全球电汇。
 */
const PRIMARY_BY_LOCALE: Record<string, PaymentRegionKey[]> = {
  en: ['global'],
  de: ['eurozone'],
  fr: ['eurozone'],
  it: ['eurozone'],
  nl: ['eurozone'],
  el: ['eurozone'],
  'pt-PT': ['eurozone'],
  // 西语跨两个区域：西班牙走 SEPA，墨西哥/哥伦比亚走 SPEI / Bre-B
  'es-ES': ['eurozone', 'latam'],
  'pt-BR': ['brazil'],
  vi: ['vietnam'],
  th: ['thailand'],
  id: ['indonesia'],
};

const DEFAULT_PRIMARY: PaymentRegionKey[] = ['global'];

/** locale 归一化：'es-ES' / 'es' / 'pt-br' 等形态都要能命中 */
function normalizeLocale(locale: string | undefined): string {
  if (!locale) return 'en';
  const raw = locale.trim();
  const alias: Record<string, string> = {
    es: 'es-ES',
    pt: 'pt-PT',
    'pt-br': 'pt-BR',
    'pt-pt': 'pt-PT',
  };
  return alias[raw.toLowerCase()] ?? raw;
}

/** 该语种的主推区域（展开显示，1–2 个） */
export function getPrimaryPaymentRegions(locale?: string): PaymentRegionKey[] {
  return PRIMARY_BY_LOCALE[normalizeLocale(locale)] ?? DEFAULT_PRIMARY;
}

/** 折叠区里的其余区域（不含主推区域，避免重复） */
export function getOtherPaymentRegions(locale?: string): PaymentRegionKey[] {
  const primary = getPrimaryPaymentRegions(locale);
  return ALL_PAYMENT_REGIONS.filter((region) => !primary.includes(region));
}

/** 某区域的收款行（币种 / 网络 / 到账时效） */
export function getPaymentRegionRows(region: PaymentRegionKey): PaymentRow[] {
  return REGION_ROWS[region];
}
