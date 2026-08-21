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

// Pages that embed /videos/head-video.mp4 (paths relative to each locale prefix).
// These URLs get a video:video extension (video sitemap protocol) - the most
// reliable way to get Google to index the videos on these pages.
const VIDEO_PAGES = new Set([
  '',
  '/meet-the-team',
  '/services/private-label',
  '/services/build-a-new-ipl',
  '/services/find-a-technology-partner',
  '/services/maintain-or-fix-ipl-project',
]);
const VIDEO = {
  contentLoc: '/videos/head-video.mp4',
  thumbnailLoc: '/images/home/head-video-poster.webp',
  title: 'iShine IPL Hair Removal Device Showcase',
  description:
    'iShine IPL hair removal device showcase - OEM/ODM manufacturing, sapphire cooling technology and private label production.',
  publicationDate: '2026-07-30',
  duration: '26',
};

export async function GET() {
  const base = resolveBaseUrl().replace(/\/$/, '');
  const videoContentLoc = `${base}${VIDEO.contentLoc}`;
  const videoThumbLoc = `${base}${VIDEO.thumbnailLoc}`;

  type Entry = { url: string; hasVideo: boolean };
  const entries: Entry[] = [];

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
      '/return-policy',
      '/blog',
    ];

    for (const p of staticPaths) {
      entries.push({ url: `${root}${p}`, hasVideo: VIDEO_PAGES.has(p) });
    }

    const posts = await getAllPosts(locale);
    // blog.ts 的 href 已含语言前缀（en 无前缀，tr/ar 带前缀）
    entries.push(...posts.map((p) => ({ url: `${base}${p.href}`, hasVideo: false })));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n` +
    entries.map((e) => {
      const head = `  <url><loc>${escapeXml(e.url)}</loc>`;
      if (!e.hasVideo) return `${head}</url>`;
      return `${head}\n` +
        `    <video:video>\n` +
        `      <video:thumbnail_loc>${videoThumbLoc}</video:thumbnail_loc>\n` +
        `      <video:title>${escapeXml(VIDEO.title)}</video:title>\n` +
        `      <video:description>${escapeXml(VIDEO.description)}</video:description>\n` +
        `      <video:content_loc>${videoContentLoc}</video:content_loc>\n` +
        `      <video:publication_date>${VIDEO.publicationDate}</video:publication_date>\n` +
        `      <video:duration>${VIDEO.duration}</video:duration>\n` +
        `      <video:family_friendly>yes</video:family_friendly>\n` +
        `    </video:video>\n` +
        `  </url>`;
    }).join('\n') +
    `\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
