import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { AppLocale } from '@/i18n';
import { locales, defaultLocale } from '@/i18n';

export type PostFrontmatter = {
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

export type PostSummary = {
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  authorAvatar: string;
  category: string;
  href: string;
  slug: string;
  locale: AppLocale;
};

const contentRoot = path.join(process.cwd(), 'src', 'content', 'blog');

function withLocaleDir(locale: AppLocale) {
  return path.join(contentRoot, locale);
}

function listMdxFiles(locale: AppLocale) {
  const dir = withLocaleDir(locale);
  if (!fs.existsSync(dir)) return [] as string[];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'));
}

function calcReadTime(body: string) {
  const words = body.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function getPostBySlug(slug: string, locale: AppLocale): { content: string; meta: PostFrontmatter } {
  // Try given locale first
  const localizedFiles = listMdxFiles(locale);
  let fallbackCanonical: string | undefined;
  for (const file of localizedFiles) {
    const fullPath = path.join(withLocaleDir(locale), file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parsed = matter(raw);
    const fm = parsed.data as PostFrontmatter;
    if (fm.slug === slug) {
      const isPlaceholder = parsed.content.trim().length < 50 || /\[Placeholder\]/i.test(parsed.content);
      if (isPlaceholder) {
        fallbackCanonical = fm.canonicalSlug || undefined;
        break;
      }
      const meta: PostFrontmatter = {
        ...fm,
        readTime: fm.readTime || calcReadTime(parsed.content),
      };
      return { content: parsed.content, meta };
    }
  }

  // Fallback to English when locale content is missing
  const enFiles = listMdxFiles(defaultLocale);
  for (const file of enFiles) {
    const fullPath = path.join(withLocaleDir(defaultLocale), file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parsed = matter(raw);
    const fm = parsed.data as PostFrontmatter;
    if (fm.slug === (fallbackCanonical || slug)) {
      const meta: PostFrontmatter = {
        ...fm,
        readTime: fm.readTime || calcReadTime(parsed.content),
      };
      return { content: parsed.content, meta };
    }
  }
  // Graceful fallback if content is not found in any locale
  const now = new Date().toISOString().split('T')[0];
  const meta: PostFrontmatter = {
    title: slug,
    excerpt: 'Content pending translation. Showing placeholder.',
    date: now,
    author: 'iShine Team',
    category: 'General',
    image: '',
    slug,
    canonicalSlug: fallbackCanonical || slug,
    readTime: '1 min read',
  };
  const content = 'Content will be available soon.';
  return { content, meta };
}

export function getAllPosts(locale: AppLocale): PostSummary[] {
  const files = listMdxFiles(locale);
  const out: PostSummary[] = [];
  for (const file of files) {
    const fullPath = path.join(withLocaleDir(locale), file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parsed = matter(raw);
    const fm = parsed.data as PostFrontmatter;
    if (!fm.slug) continue;
    out.push({
      title: fm.title,
      excerpt: fm.excerpt,
      image: fm.image || '',
      date: fm.date,
      author: fm.author,
      authorAvatar: fm.authorAvatar || '',
      category: fm.category || '',
      href: `/blog/${fm.slug}`,
      slug: fm.slug,
      locale,
    });
  }
  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllPostParams(): Array<{ locale: AppLocale; slug: string }> {
  const out: Array<{ locale: AppLocale; slug: string }> = [];
  for (const locale of locales) {
    const files = listMdxFiles(locale);
    for (const file of files) {
      const fullPath = path.join(withLocaleDir(locale), file);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const parsed = matter(raw);
      const fm = parsed.data as PostFrontmatter;
      if (fm.slug) out.push({ locale, slug: fm.slug });
    }
  }
  return out;
}

export function getRelatedPosts(
  currentSlug: string,
  locale: AppLocale,
  category?: string,
  limit: number = 3
): PostSummary[] {
  const allPosts = getAllPosts(locale);

  return allPosts
    .filter((post) => post.slug !== currentSlug && (!category || post.category === category))
    .slice(0, limit);
}
