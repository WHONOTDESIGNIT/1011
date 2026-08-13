import { getAllPosts, SUPPORTED_LOCALES } from '../lib/blog';

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function resolveBaseUrl() {
  return process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? process.env.SITE_URL ?? 'https://iplmanufacturer.com';
}

export async function GET() {
  const base = resolveBaseUrl().replace(/\/$/, '');
  const urls: string[] = [];

  for (const locale of SUPPORTED_LOCALES) {
    const prefix = locale === 'en' ? '' : `/${locale}`;
    const root = `${base}${prefix}`;

    const staticPaths = [
      '',
      '/about',
      '/about/brand-story',
      '/about/company-profile',
      '/about/manufacturing-capabilities',
      '/about/quality-control',
      '/services',
      '/services/oem-odm',
      '/services/product-design',
      '/services/production-assembly',
      '/services/packaging-logistics',
      '/services/no-moq',
      '/services/logo-printing',
      '/services/box-custom',
      '/services/user-manual-guide-custom',
      '/services/dropshipping',
      '/services/private-label',
      '/services/build-a-new-ipl',
      '/services/find-a-technology-partner',
      '/services/maintain-or-fix-ipl-project',
      '/products',
      '/products/venus',
      '/products/lumi',
      '/products/lumi-2',
      '/products/hestia',
      '/products/alpha',
      '/products/hebe',
      '/products/emerald',
      '/products/themis',
      '/products/eirene',
      '/products/euno',
      '/products/wooden',
      '/products/helix',
      '/components',
      '/components/lamp-cartridges',
      '/components/optical-filters',
      '/components/cooling-system',
      '/components/power-supply',
      '/clients',
      '/clients/costco-canada-ipl',
      '/clients/happyskinco-ipl',
      '/clients/ku2-ipl',
      '/clients/roseskin-ipl',
      '/catalogue',
      '/ipl-hair-removal-is-safe',
      '/faq',
      '/contact',
      '/meet-the-team',
      '/marketplace',
      '/privacy-policy',
      '/blog',
    ];

    urls.push(...staticPaths.map((p) => `${root}${p}`));

    const posts = await getAllPosts(locale);
    // blog.ts 的 href 已含语言前缀（en 无前缀，tr/ar 带前缀）
    urls.push(...posts.map((p) => `${base}${p.href}`));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n') +
    `\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
