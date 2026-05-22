type BlogFrontmatter = {
  title: string;
  excerpt: string;
  date: string;
  author: string;
  authorAvatar?: string;
  category?: string;
  image?: string;
  slug: string;
  canonicalSlug?: string;
  readTime?: string;
};

export type BlogPostSummary = {
  title: string;
  excerpt: string;
  date: string;
  author: string;
  authorAvatar: string;
  category: string;
  image: string;
  slug: string;
  href: string;
  readTime: string;
};

export type BlogPost = {
  meta: BlogPostSummary;
  Content: unknown;
};

type BlogMdxModule = {
  frontmatter: BlogFrontmatter;
  default: unknown;
};

const SUPPORTED_LOCALES = ['en', 'de', 'es'];

const allPostModules = import.meta.glob<BlogMdxModule>('../../../src/content/blog/**/*.mdx');

function extractLocaleFromPath(path: string): string | null {
  const match = path.match(/\/blog\/([^/]+)\//);
  return match ? match[1] : null;
}

function normalizeSummary(locale: string, fm: BlogFrontmatter): BlogPostSummary {
  return {
    title: fm.title ?? fm.slug,
    excerpt: fm.excerpt ?? '',
    date: fm.date ?? '',
    author: fm.author ?? 'iShine Team',
    authorAvatar: fm.authorAvatar ?? '',
    category: fm.category ?? '',
    image: fm.image ?? '',
    slug: fm.slug,
    href: `/${locale}/blog/${fm.canonicalSlug || fm.slug}`,
    readTime: fm.readTime ?? '',
  };
}

function compareByDateDesc(a: BlogPostSummary, b: BlogPostSummary) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export async function getAllPosts(locale: string): Promise<BlogPostSummary[]> {
  if (!SUPPORTED_LOCALES.includes(locale)) return [];
  const posts: BlogPostSummary[] = [];
  for (const [path, load] of Object.entries(allPostModules)) {
    const fileLocale = extractLocaleFromPath(path);
    if (fileLocale !== locale) continue;
    const mod = await load();
    posts.push(normalizeSummary(locale, mod.frontmatter));
  }
  return posts.sort(compareByDateDesc);
}

export async function getPostBySlug(locale: string, slug: string): Promise<BlogPost | null> {
  if (!SUPPORTED_LOCALES.includes(locale)) return null;
  for (const [path, load] of Object.entries(allPostModules)) {
    const fileLocale = extractLocaleFromPath(path);
    if (fileLocale !== locale) continue;
    const mod = await load();
    if (mod.frontmatter.slug === slug || mod.frontmatter.canonicalSlug === slug) {
      return {
        meta: normalizeSummary(locale, mod.frontmatter),
        Content: mod.default,
      };
    }
  }
  return null;
}

export async function getRelatedPosts(locale: string, currentSlug: string, category?: string, limit = 3) {
  const all = await getAllPosts(locale);
  return all
    .filter((p) => p.slug !== currentSlug && (!category || p.category === category))
    .slice(0, limit);
}
