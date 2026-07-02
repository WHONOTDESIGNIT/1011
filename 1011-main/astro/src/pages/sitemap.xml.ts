import { getAllPosts } from '../lib/blog';

const SUPPORTED_LOCALES = ['en'];

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
      '/products',
      '/products/venus',
      '/products/lumi-2',
      '/products/hestia',
      '/products/alpha',
      '/products/hebe',
      '/products/emerald',
      '/products/themis',
      '/products/eirene',
      '/products/euno',
      '/products/wooden',
      '/components',
      '/components/lamp-cartridges',
      '/components/optical-filters',
      '/components/cooling-system',
      '/components/power-supply',
      '/clients',
      '/catalogue',
      '/faq',
      '/contact',
      '/media',
      '/privacy-policy',
      '/blog',
    ];

    urls.push(...staticPaths.map((p) => `${root}${p}`));

    const posts = await getAllPosts(locale);
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
