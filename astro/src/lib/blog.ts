import fs from 'node:fs';
import path from 'node:path';
import { load as loadYaml } from 'js-yaml';
import { toCategorySlug } from './blog-categories';
type BlogFaq = { question: string; answer: string };

export type BlogPostSummary = {
  title: string;
  excerpt: string;
  date: string;
  updatedDate: string;
  author: string;
  authorAvatar: string;
  category: string;
  image: string;
  slug: string;
  href: string;
  translationKey: string;
  locale: string;
  readTime: string;
};

export type BlogPost = {
  meta: BlogPostSummary;
  Content: unknown;
  faqs: BlogFaq[];
};

type BlogIndexRecord = {
  localePath: BlogLocale;
  locale: string;
  slug: string;
  translationKey: string;
  meta: BlogPostSummary;
  faqs: BlogFaq[];
  filePath: string;
};

type BlogFrontmatterRecord = {
  title?: string;
  description?: string;
  pubDate?: string | Date;
  updatedDate?: string | Date;
  author?: string;
  authorAvatar?: string;
  category?: string;
  heroImage?: string;
  ogImage?: string;
  slug?: string;
  translationKey?: string;
  readTime?: string | number;
  faqs?: { question?: string; answer?: string }[];
};

export const SUPPORTED_LOCALES = ['en', 'tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'fa', 'el', 'pt-BR', 'pt-PT', 'nl', 'id', 'th', 'pl', 'ja', 'ko', 'cs', 'vi', 'de', 'it'] as const;
export type BlogLocale = (typeof SUPPORTED_LOCALES)[number];

// 三层解耦（与 src/lib/locale.ts 同构，作用域为博客层）：
// 内容目录名（pt-BR，大小写敏感）↔ 内部 locale（BCP47）↔ URL path（小写，/pt-br/）。
// 页面 locale 输入可能是：currentLocale 的内部 code（pt-BR / es-ES）、URL path（pt-br）、
// 或简单 code（es）。统一经 resolveBlogLocale 归一化为「博客目录名」（BlogLocale）。
const BLOG_DIR_TO_URL_PATH: Record<string, string> = {
  'pt-BR': 'pt-br',
  'pt-PT': 'pt-pt',
};
const URL_PATH_TO_BLOG_DIR: Record<string, string> = {
  'pt-br': 'pt-BR',
  'pt-pt': 'pt-PT',
};
// 注意：es 的博客目录名/内部 code 是 es，而 currentLocale 返回 BCP47 的 es-ES，需归一到 es
const BCP47_TO_BLOG_DIR: Record<string, string> = {
  'es-ES': 'es',
};
const blogContentRoot = path.resolve(process.cwd(), 'src/content/blog');
const blogContentModules = import.meta.glob('../content/blog/**/*.mdx');

let blogIndexCache: Promise<BlogIndexRecord[]> | undefined;

/** 任意 locale 形态 → 博客目录名（未识别回退 en） */
function resolveBlogLocale(input: string): BlogLocale {
  const fromUrlPath = URL_PATH_TO_BLOG_DIR[input];
  if (fromUrlPath) return fromUrlPath as BlogLocale;
  const fromBcp47 = BCP47_TO_BLOG_DIR[input];
  if (fromBcp47) return fromBcp47 as BlogLocale;
  return (SUPPORTED_LOCALES as readonly string[]).includes(input) ? (input as BlogLocale) : 'en';
}

/** 博客目录名 / 内部 locale → 小写 URL path（sitemap 等 URL 输出用；en 返回原值） */
export const blogUrlPath = (locale: string) => BLOG_DIR_TO_URL_PATH[locale] ?? locale;

function extractLocaleFromPath(filePath: string): BlogLocale {
  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(
    /(?:^|\/)(en|tr|ro|ar|es|fr|ru|he|fa|el|pt-BR|pt-PT|nl|id|th|pl|ja|ko|cs|vi|de|it)(?:\/)/
  );
  return match ? (match[1] as BlogLocale) : 'en';
}

function formatDateValue(value: Date | string | undefined) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '';
  }

  return date.toISOString().slice(0, 10);
}

function postHref(localeOrDir: string, slug: string): string {
  const dir = resolveBlogLocale(localeOrDir);
  if (dir === 'en') return `/blog/${slug}`;
  const urlPath = BLOG_DIR_TO_URL_PATH[dir] ?? dir;
  return `/${urlPath}/blog/${slug}`;
}

/** 分类聚合页 URL：en 无前缀，其余语言带小写 /<locale>/ 前缀。label 为规范词（Title Case）。 */
export function categoryHref(localeOrDir: string, label: string): string {
  const dir = resolveBlogLocale(localeOrDir);
  const slug = toCategorySlug(label);
  if (dir === 'en') return `/blog/category/${slug}`;
  const urlPath = BLOG_DIR_TO_URL_PATH[dir] ?? dir;
  return `/${urlPath}/blog/category/${slug}`;
}

function normalizeFaqs(rawFaqs: BlogFrontmatterRecord['faqs']) {
  return (rawFaqs ?? [])
    .filter((item): item is { question: string; answer: string } => Boolean(item?.question && item?.answer))
    .map((item) => ({ question: item.question, answer: item.answer }));
}

function listMdxFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMdxFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function readFrontmatter(filePath: string): BlogFrontmatterRecord | null {
  const source = fs.readFileSync(filePath, 'utf8');
  if (!source.startsWith('---')) return null;
  const end = source.indexOf('\n---', 3);
  if (end === -1) return null;
  const rawFrontmatter = source.slice(4, end);
  const parsed = loadYaml(rawFrontmatter);
  return parsed && typeof parsed === 'object' ? (parsed as BlogFrontmatterRecord) : null;
}

async function loadBlogIndex() {
  if (!blogIndexCache) {
    blogIndexCache = Promise.resolve(
      listMdxFiles(blogContentRoot)
        .map((filePath) => {
          const frontmatter = readFrontmatter(filePath);
          if (!frontmatter?.slug || !frontmatter.translationKey) return null;

          const localePath = extractLocaleFromPath(filePath);
          // 目录名 → BCP47 code（getPostTranslations 的 x.locale 用于与 currentLocale 比对）
          const locale = localePath === 'es' ? 'es-ES' : localePath;
          const slug = frontmatter.slug;
          const translationKey = frontmatter.translationKey;
          const excerpt = frontmatter.description ?? '';
          const date = formatDateValue(frontmatter.pubDate);
          const updatedDate = formatDateValue(frontmatter.updatedDate);
          const image = frontmatter.heroImage ?? frontmatter.ogImage ?? '';
          const faqs = normalizeFaqs(frontmatter.faqs);

          return {
            localePath,
            locale,
            slug,
            translationKey,
            filePath,
            faqs,
            meta: {
              title: frontmatter.title ?? slug,
              excerpt,
              date,
              updatedDate,
              author: frontmatter.author ?? 'iShine Team',
              authorAvatar: frontmatter.authorAvatar ?? '',
              category: frontmatter.category ?? '',
              image,
              slug,
              href: postHref(localePath, slug),
              translationKey,
              locale,
              readTime: frontmatter.readTime ? String(frontmatter.readTime) : '',
            },
          } satisfies BlogIndexRecord;
        })
        .filter((record): record is BlogIndexRecord => Boolean(record))
    );
  }

  return blogIndexCache;
}

function compareByDateDesc(a: BlogPostSummary, b: BlogPostSummary) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export async function getAllPosts(locale: string): Promise<BlogPostSummary[]> {
  const effectiveLocale = resolveBlogLocale(locale);
  const posts = await loadBlogIndex();
  return posts
    .filter((post) => post.localePath === effectiveLocale)
    .map((post) => post.meta)
    .sort(compareByDateDesc);
}

export async function getPostBySlug(locale: string, slug: string): Promise<BlogPost | null> {
  const effectiveLocale = resolveBlogLocale(locale);
  const posts = await loadBlogIndex();
  const record = posts.find((post) =>
    post.localePath === effectiveLocale &&
    (post.slug === slug || post.translationKey === slug)
  );
  if (!record) return null;

  const modulePath = `../content/blog/${record.localePath}/${path.basename(record.filePath)}`;
  const loadModule = blogContentModules[modulePath];
  if (!loadModule) return null;

  const mod = (await loadModule()) as { default?: unknown };
  const Content = mod.default;
  if (!Content) return null;

  return {
    meta: record.meta,
    Content,
    faqs: record.faqs,
  };
}

export async function getAllArticleVersions(): Promise<{ locale: string; slug: string; translationKey: string }[]> {
  const posts = await loadBlogIndex();
  return posts.map((post) => ({
    locale: post.locale,
    slug: post.slug,
    translationKey: post.translationKey,
  }));
}

export type PostTranslationLink = {
  locale: string;
  href: string;
  title: string;
  slug: string;
};

export async function getPostTranslations(slug: string): Promise<PostTranslationLink[]> {
  const posts = await loadBlogIndex();
  const target = posts.find((post) => post.slug === slug || post.translationKey === slug);
  if (!target) return [];

  return posts
    .filter((post) => post.translationKey === target.translationKey)
    .sort((a, b) => a.meta.href.localeCompare(b.meta.href))
    .map((post) => ({
      locale: post.locale,
      href: post.meta.href,
      title: post.meta.title,
      slug: post.slug,
    }));
}

export async function getRelatedPosts(locale: string, currentSlug: string, category?: string, limit = 3) {
  const all = await getAllPosts(locale);
  return all
    .filter((post) => post.slug !== currentSlug && (!category || post.category === category))
    .slice(0, limit);
}

export { postHref };
