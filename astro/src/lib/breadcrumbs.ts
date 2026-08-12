import { getRelativeLocaleUrl } from 'astro:i18n';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbInput = {
  label: string;
  href?: string;
  path?: string;
};

export function getLocalizedPath(locale: string, path = '/'): string {
  if (!path) return '/';
  // 统一走官方 i18n URL 生成器：默认语言 en 无前缀，tr 自动加 /tr/ 前缀
  const url = getRelativeLocaleUrl(locale, path);
  // 站点链接规范：所有语种链接统一不带末尾斜杠（如 /tr/products/lumi，而非 /tr/products/lumi/）
  return url.length > 1 ? url.replace(/\/+$/, '') : url;
}

export function buildBreadcrumbs(locale: string, items: BreadcrumbInput[]): BreadcrumbItem[] {
  return items.map((item) => ({
    label: item.label,
    href: item.href ?? (item.path ? getLocalizedPath(locale, item.path) : undefined),
  }));
}
