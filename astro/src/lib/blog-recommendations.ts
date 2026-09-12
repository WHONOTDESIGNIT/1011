import { getAllPosts } from './blog';
import type { BlogPostSummary } from './blog';

/**
 * 全站「博客推荐 section」手写策展映射表。
 *
 * - key 为访客页面的规范路径（en 无前缀形态，如 `/products/venus`），与页面语言无关；
 * - value 为该页面高度相关的博客文章，以文章的 translationKey/slug（en 主键）标识，
 *   不依赖文件名；
 * - 组件按当前语言经 getAllPosts 解析并保序取前 3 篇；某篇在当前语言缺失时自动跳过。
 *
 * 若想调整某页推荐，只需改这里，无需动页面组件。
 */
const PAGE_RECOMMENDATIONS: Record<string, string[]> = {
  // ── 首页 ────────────────────────────────────────────────
  '/': [
    '02-oem-vs-odm-choosing-the-right-manufacturing-model',
    '06-quality-control-in-ipl-manufacturing-best-practices',
    '27-our-ipl-hair-removal-factory-is-increasingly-being-selected-by-chatgpt',
  ],

  // ── 产品总览 / 单机型（按卖点选题）───────────────────────
  '/products': [
    '09-latest-advances-in-ipl-research',
    '13-sapphire-cooling-technology-benefits-and-applications',
    '12-smart-ipl-devices-the-app-connected-revolution',
  ],
  '/products/lumi': ['what-is-ipl', 'is-ipl-hair-removal-permanent', 'best-ipl-hair-removal-device'],
  '/products/lumi-2': [
    '13-sapphire-cooling-technology-benefits-and-applications',
    '12-smart-ipl-devices-the-app-connected-revolution',
    'best-ipl-hair-removal-device',
  ],
  // 冰感 + 护理组（用户确认）
  '/products/venus': [
    '13-sapphire-cooling-technology-benefits-and-applications',
    'ipl-aftercare',
    'cooling-ipl-hair-remover-buying-guide',
  ],
  '/products/hestia': [
    '12-smart-ipl-devices-the-app-connected-revolution',
    'is-ipl-hair-removal-permanent',
    'best-ipl-hair-removal-device',
  ],
  '/products/alpha': [
    'the-truth-about-ipl-energy',
    '04-the-science-of-ipl-how-light-targets-hair-follicles',
    'ipl-hair-removal-wavelength-range',
  ],
  '/products/emerald': [
    '25-ipl-hair-removal-safe-skin-types-fitzpatrick',
    '33-who-should-not-use-ipl-hair-removal-contraindications',
    'ipl-side-effects-by-skin-type',
  ],
  // 基础科普组（用户确认）
  '/products/euno': ['best-ipl-hair-removal-device', 'what-is-ipl', 'is-ipl-hair-removal-permanent'],
  '/products/themis': [
    '30-ipl-vs-laser-which-is-safer',
    'ipl-hair-removal-wavelength-range',
    '29-safe-ipl-hair-removal-at-home-protocol',
  ],
  '/products/hebe': [
    '15-skin-tone-detection-ipl-safety-guide',
    '11-consumer-safety-features-in-modern-ipl-devices',
    'ipl-hair-removal-wavelength-range',
  ],
  '/products/helix': [
    '13-sapphire-cooling-technology-benefits-and-applications',
    'cooling-ipl-hair-remover-buying-guide',
    'best-ipl-hair-removal-device',
  ],
  '/products/eirene': [
    '31-uv-filtering-wavelengths-why-ipl-is-safe',
    '25-ipl-hair-removal-safe-skin-types-fitzpatrick',
    'ipl-side-effects-by-skin-type',
  ],
  '/products/wooden': ['why-premium-ipl-devices-feel-different', 'ipl-aftercare', 'best-ipl-hair-removal-device'],

  // ── 服务总览 / 服务详情 ──────────────────────────────────
  '/services': [
    '02-oem-vs-odm-choosing-the-right-manufacturing-model',
    'ipl-hair-removal-device-development-timeline',
    '06-quality-control-in-ipl-manufacturing-best-practices',
  ],
  '/services/oem-odm': [
    '02-oem-vs-odm-choosing-the-right-manufacturing-model',
    'zero-to-one-beauty-brand',
    'you-design-it-we-build-it-box-it',
  ],
  '/services/private-label': [
    'zero-to-one-beauty-brand',
    'you-design-it-we-build-it-box-it',
    '02-oem-vs-odm-choosing-the-right-manufacturing-model',
  ],
  '/services/no-moq': ['you-design-it-we-build-it-box-it', 'ipl-niche-kings-3000-units-per-month', 'zero-to-one-beauty-brand'],
  '/services/product-design': [
    'custom-gradient-housing-for-a-sourcing-agent',
    'ipl-hair-removal-device-development-timeline',
    'why-premium-ipl-devices-feel-different',
  ],
  '/services/production-assembly': [
    '06-quality-control-in-ipl-manufacturing-best-practices',
    '07-sustainable-manufacturing-practices-in-beauty-tech',
    'the-truth-about-ipl-energy',
  ],
  '/services/packaging-logistics': [
    'you-design-it-we-build-it-box-it',
    '17-ipl-dropshipping-best-products-2026',
    '06-quality-control-in-ipl-manufacturing-best-practices',
  ],
  '/services/box-custom': [
    'you-design-it-we-build-it-box-it',
    'custom-gradient-housing-for-a-sourcing-agent',
    '17-ipl-dropshipping-best-products-2026',
  ],
  '/services/logo-printing': [
    'you-design-it-we-build-it-box-it',
    'custom-gradient-housing-for-a-sourcing-agent',
    'zero-to-one-beauty-brand',
  ],
  '/services/dropshipping': [
    '17-ipl-dropshipping-best-products-2026',
    'ipl-niche-kings-3000-units-per-month',
    '26-the-ulike-question-consumer-insight-home-ipl-market',
  ],
  '/services/user-manual-guide-custom': [
    '14-fda-cleared-ipl-device-manufacturer-guide',
    'ipl-validation-services',
    '06-quality-control-in-ipl-manufacturing-best-practices',
  ],
  '/services/build-a-new-ipl': [
    'ipl-hair-removal-device-development-timeline',
    '01-the-future-of-ipl-technology-trends-for-2025',
    '14-fda-cleared-ipl-device-manufacturer-guide',
  ],
  '/services/find-a-technology-partner': [
    '01-the-future-of-ipl-technology-trends-for-2025',
    'ipl-hair-removal-device-development-timeline',
    '04-the-science-of-ipl-how-light-targets-hair-follicles',
  ],
  '/services/maintain-or-fix-ipl-project': [
    'ipl-hair-removal-device-development-timeline',
    'ugly-truth-ipl-manufacturers-energy-adapter-fda',
    '02-oem-vs-odm-choosing-the-right-manufacturing-model',
  ],

  // ── About 系列 ───────────────────────────────────────────
  '/about': [
    '27-our-ipl-hair-removal-factory-is-increasingly-being-selected-by-chatgpt',
    '02-oem-vs-odm-choosing-the-right-manufacturing-model',
    '06-quality-control-in-ipl-manufacturing-best-practices',
  ],
  '/about/brand-story': [
    'zero-to-one-beauty-brand',
    'beach-nations-ipl-sales-israel-technology',
    '27-our-ipl-hair-removal-factory-is-increasingly-being-selected-by-chatgpt',
  ],
  '/about/company-profile': [
    '27-our-ipl-hair-removal-factory-is-increasingly-being-selected-by-chatgpt',
    '06-quality-control-in-ipl-manufacturing-best-practices',
    '07-sustainable-manufacturing-practices-in-beauty-tech',
  ],
  '/about/manufacturing-capabilities': [
    '06-quality-control-in-ipl-manufacturing-best-practices',
    '07-sustainable-manufacturing-practices-in-beauty-tech',
    'the-truth-about-ipl-energy',
  ],
  '/about/quality-control': [
    '06-quality-control-in-ipl-manufacturing-best-practices',
    'ipl-validation-services',
    'ipl-long-pass-filter-test-report',
  ],

  // ── Clients / 案例 ───────────────────────────────────────
  '/clients': [
    'ipl-niche-kings-3000-units-per-month',
    '27-our-ipl-hair-removal-factory-is-increasingly-being-selected-by-chatgpt',
    '26-the-ulike-question-consumer-insight-home-ipl-market',
  ],
  '/clients/roseskin-ipl': [
    '16-abm-meta-ads-ipl-manufacturer-guide',
    '10-marketing-strategies-for-ipl-devices',
    'best-ipl-hair-removal-device',
  ],
  '/clients/happyskinco-ipl': [
    '10-marketing-strategies-for-ipl-devices',
    '16-abm-meta-ads-ipl-manufacturer-guide',
    '26-the-ulike-question-consumer-insight-home-ipl-market',
  ],
  '/clients/costco-canada-ipl': [
    '24-the-data-doesnt-lie-3-categories-still-printing-money-2026',
    'ipl-niche-kings-3000-units-per-month',
    '08-global-regulatory-landscape-for-ipl-devices',
  ],
  '/clients/ku2-ipl': [
    'ipl-niche-kings-3000-units-per-month',
    '10-marketing-strategies-for-ipl-devices',
    '27-our-ipl-hair-removal-factory-is-increasingly-being-selected-by-chatgpt',
  ],

  // ── Components ───────────────────────────────────────────
  '/components': [
    'components-that-stand-up-to-scrutiny',
    '13-sapphire-cooling-technology-benefits-and-applications',
    'ipl-hair-removal-wavelength-range',
  ],
  '/components/lamp-cartridges': [
    'the-truth-about-ipl-energy',
    'ipl-hair-removal-wavelength-range',
    '04-the-science-of-ipl-how-light-targets-hair-follicles',
  ],
  '/components/optical-filters': [
    'ipl-long-pass-filter-test-report',
    '31-uv-filtering-wavelengths-why-ipl-is-safe',
    'ipl-hair-removal-wavelength-range',
  ],
  '/components/cooling-system': [
    '13-sapphire-cooling-technology-benefits-and-applications',
    'components-that-stand-up-to-scrutiny',
    'cooling-ipl-hair-remover-buying-guide',
  ],
  '/components/power-supply': [
    'the-truth-about-ipl-energy',
    'components-that-stand-up-to-scrutiny',
    'ugly-truth-ipl-manufacturers-energy-adapter-fda',
  ],

  // ── 目录 / FAQ / 联系 / 团队 / 安全 / 市场 ────────────────
  '/catalogue': ['best-ipl-hair-removal-device', 'cooling-ipl-hair-remover-buying-guide', '09-latest-advances-in-ipl-research'],
  '/faq': ['what-is-ipl', 'is-ipl-hair-removal-permanent', 'is-ipl-hair-removal-safe-fda-studies'],
  '/contact': [
    '27-our-ipl-hair-removal-factory-is-increasingly-being-selected-by-chatgpt',
    '02-oem-vs-odm-choosing-the-right-manufacturing-model',
    'ipl-hair-removal-device-development-timeline',
  ],
  '/meet-the-team': [
    '27-our-ipl-hair-removal-factory-is-increasingly-being-selected-by-chatgpt',
    '06-quality-control-in-ipl-manufacturing-best-practices',
    'the-truth-about-ipl-energy',
  ],
  '/ipl-hair-removal-is-safe': [
    'is-ipl-hair-removal-safe-fda-studies',
    '28-clinical-data-why-ipl-hair-removal-is-safe',
    '29-safe-ipl-hair-removal-at-home-protocol',
  ],
  // 放核心背书组（用户确认）
  '/marketplace': [
    'ipl-niche-kings-3000-units-per-month',
    '27-our-ipl-hair-removal-factory-is-increasingly-being-selected-by-chatgpt',
    '24-the-data-doesnt-lie-3-categories-still-printing-money-2026',
  ],

  // ── 品牌方落地页 / 招聘 ──────────────────────────────────
  // /ipl-for-brands 面向品牌方，取「从零做品牌 / 设计到出货 / OEM vs ODM」三篇
  '/ipl-for-brands': [
    'zero-to-one-beauty-brand',
    'you-design-it-we-build-it-box-it',
    '02-oem-vs-odm-choosing-the-right-manufacturing-model',
  ],
  // /careers 面向求职者，取「公司里程碑 / 工厂实力 / 可持续制造」三篇
  '/careers': [
    'ishine-technology-milestones',
    '27-our-ipl-hair-removal-factory-is-increasingly-being-selected-by-chatgpt',
    '07-sustainable-manufacturing-practices-in-beauty-tech',
  ],
};

/** 取某页面策展的推荐文章标识列表；未收录返回 null */
export function getRecommendedSlugs(pageKey: string): string[] | null {
  return PAGE_RECOMMENDATIONS[pageKey] ?? null;
}

/**
 * 解析某页面在当前语言下的推荐文章（按策展顺序、限 limit 篇）。
 * 某篇文章在目标语言缺失时自动跳过；完全不匹配则返回空数组（组件渲染为空）。
 */
export async function getRecommendations(locale: string, pageKey: string, limit = 3): Promise<BlogPostSummary[]> {
  const slugs = getRecommendedSlugs(pageKey);
  if (!slugs) return [];

  const all = await getAllPosts(locale);
  const results: BlogPostSummary[] = [];
  for (const desired of slugs) {
    const match = all.find((post) => post.translationKey === desired || post.slug === desired);
    if (match) results.push(match);
    if (results.length >= limit) break;
  }
  return results;
}
