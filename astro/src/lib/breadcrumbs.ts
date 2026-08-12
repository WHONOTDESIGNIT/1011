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
  // normalizeLocale:false 保留 locale 原始大小写（pt-PT），与构建目录一致，
  // 避免在 Linux（Netlify）上因 /pt-pt/ 与 dist/pt-PT 大小写不匹配导致 404
  const url = getRelativeLocaleUrl(locale, path, { normalizeLocale: false });
  // 站点链接规范：所有语种链接统一不带末尾斜杠（如 /tr/products/lumi，而非 /tr/products/lumi/）
  return url.length > 1 ? url.replace(/\/+$/, '') : url;
}

export function buildBreadcrumbs(locale: string, items: BreadcrumbInput[]): BreadcrumbItem[] {
  return items.map((item) => ({
    label: item.label,
    href: item.href ?? (item.path ? getLocalizedPath(locale, item.path) : undefined),
  }));
}
