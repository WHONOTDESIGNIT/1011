// 博客分类规范词表（Title Case，frontmatter `category` 的唯一样式，也是 content.config.ts 的 z.enum 取值）。
// 历史变体（SAFETY/TECHNOLOGY/MARKET/Regulation & Compliance/GUIDE…）由 scripts/normalize-categories.mjs 一次性归一至此表。
// 展示用词保留 Title Case（列表页/详情页 badge 直接展示），聚合页 URL 使用 toCategorySlug 派生的小写 kebab 段。
export const BLOG_CATEGORIES = [
  'Safety',
  'Technology',
  'Market',
  'Marketing',
  'Manufacturing',
  'Regulatory',
  'Education',
  'Buying Guide',
  'OEM/ODM',
  'Science',
  'Sustainability',
  'Business',
  'Research',
  'Innovation',
  'Components',
  'Sourcing',
  'B2B',
  'Industry Insights',
  'Brand Building',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export function toCategorySlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SLUG_TO_LABEL: Record<string, string> = Object.fromEntries(BLOG_CATEGORIES.map((c) => [toCategorySlug(c), c]));

export function categoryLabelFromSlug(slug: string): string | undefined {
  return SLUG_TO_LABEL[slug];
}
