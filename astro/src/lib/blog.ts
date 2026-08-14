type BlogFrontmatter = {
  title: string;
  excerpt: string;
  date: string;
  author: string;
  authorAvatar?: string;
  category?: string;
  image?: string;
  /** 当前语言下的独立 slug（不同语言可不同，如 /tr/blog/sifirdan-bir-beauty-markasi） */
  slug: string;
  /** 英文 slug，用于跨语言关联同一篇文章 */
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
  /** 当前语言的完整路径（en 无前缀，tr/ar 带语言前缀） */
  href: string;
  /** 英文 slug，跨语言关联标识 */
  canonicalSlug: string;
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

export const SUPPORTED_LOCALES = ['en', 'tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'pt-BR', 'nl', 'pl', 'ja', 'ko'] as const;
export type BlogLocale = (typeof SUPPORTED_LOCALES)[number];

// 站点 i18n 回退设计：未提供内容的小语种回退到 en 内容，
// 与 astro.config 的 fallback rewrite 行为保持一致，避免 /tr/blog/* 渲染 "Not found"
function resolveBlogLocale(locale: string): BlogLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? (locale as BlogLocale) : 'en';
}

// 同时匹配两个内容目录：
// 1) astro 子项目内的 src/content/blog（三语新文章：en/tr/ar）
// 2) 工作区根目录的 src/content/blog（35 篇英文旧文章）
const allPostModules = import.meta.glob<BlogMdxModule>(['../content/blog/**/*.mdx', '../../../src/content/blog/**/*.mdx']);

function extractLocaleFromPath(path: string): string | null {
  const match = path.match(/\/blog\/([^/]+)\//);
  return match ? match[1] : null;
}

/** 生成某语言下文章的完整路径：en 无前缀，tr/ar 带前缀 */
export function postHref(locale: string, slug: string): string {
  const l = resolveBlogLocale(locale);
  return l === 'en' ? `/blog/${slug}` : `/${l}/blog/${slug}`;
}

type RawPost = { locale: string; path: string; mod: BlogMdxModule };

async function loadAllPosts(): Promise<RawPost[]> {
  const result: RawPost[] = [];
  for (const [path, load] of Object.entries(allPostModules)) {
    const fileLocale = extractLocaleFromPath(path);
    if (!fileLocale) continue;
    const mod = await load();
    result.push({ locale: fileLocale, path, mod });
  }
  return result;
}

function normalizeSummary(locale: string, fm: BlogFrontmatter): BlogPostSummary {
  const canonicalSlug = fm.canonicalSlug || fm.slug;
  return {
    title: fm.title ?? fm.slug,
    excerpt: fm.excerpt ?? '',
    date: fm.date ?? '',
    author: fm.author ?? 'iShine Team',
    authorAvatar: fm.authorAvatar ?? '',
    category: fm.category ?? '',
    image: fm.image ?? '',
    slug: fm.slug,
    href: postHref(locale, fm.slug),
    canonicalSlug,
    readTime: fm.readTime ?? '',
  };
}

function compareByDateDesc(a: BlogPostSummary, b: BlogPostSummary) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

/** 某语言下的全部文章列表 */
export async function getAllPosts(locale: string): Promise<BlogPostSummary[]> {
  const effectiveLocale = resolveBlogLocale(locale);
  const posts: BlogPostSummary[] = [];
  for (const { locale: fileLocale, mod } of await loadAllPosts()) {
    if (fileLocale !== effectiveLocale) continue;
    posts.push(normalizeSummary(effectiveLocale, mod.frontmatter));
  }
  return posts.sort(compareByDateDesc);
}

/** 按 (locale, slug) 或 canonicalSlug 查找文章；未命中返回 null */
export async function getPostBySlug(locale: string, slug: string): Promise<BlogPost | null> {
  const effectiveLocale = resolveBlogLocale(locale);
  for (const { locale: fileLocale, mod } of await loadAllPosts()) {
    if (fileLocale !== effectiveLocale) continue;
    const fm = mod.frontmatter;
    if (fm.slug === slug || fm.canonicalSlug === slug) {
      return {
        meta: normalizeSummary(effectiveLocale, fm),
        Content: mod.default,
      };
    }
  }
  return null;
}

/** 全站所有文章版本（用于 getStaticPaths：每语言独立 slug） */
export async function getAllArticleVersions(): Promise<{ locale: string; slug: string; canonicalSlug: string }[]> {
  const versions: { locale: string; slug: string; canonicalSlug: string }[] = [];
  for (const { locale, mod } of await loadAllPosts()) {
    const fm = mod.frontmatter;
    versions.push({ locale, slug: fm.slug, canonicalSlug: fm.canonicalSlug || fm.slug });
  }
  return versions;
}

export type PostTranslationLink = {
  locale: string;
  href: string;
  title: string;
};

/**
 * 给定任一语言文章的 slug，返回同一篇文章在 en/tr/ar 下的路径映射。
 * 用于文章页 hreflang、语言切换与跨语言 301 重定向。
 */
export async function getPostTranslations(slug: string): Promise<PostTranslationLink[]> {
  const posts = await loadAllPosts();
  // 找到包含该 slug 的文章组（按 canonicalSlug 分组）
  const target = posts.find(({ mod }) => mod.frontmatter.slug === slug || mod.frontmatter.canonicalSlug === slug);
  if (!target) return [];
  const canonicalSlug = target.mod.frontmatter.canonicalSlug || target.mod.frontmatter.slug;
  return posts
    .filter(({ mod }) => (mod.frontmatter.canonicalSlug || mod.frontmatter.slug) === canonicalSlug)
    .map(({ locale, mod }) => ({
      locale,
      href: postHref(locale, mod.frontmatter.slug),
      title: mod.frontmatter.title ?? mod.frontmatter.slug,
    }));
}

export async function getRelatedPosts(locale: string, currentSlug: string, category?: string, limit = 3) {
  const all = await getAllPosts(locale);
  return all
    .filter((p) => p.slug !== currentSlug && (!category || p.category === category))
    .slice(0, limit);
}
