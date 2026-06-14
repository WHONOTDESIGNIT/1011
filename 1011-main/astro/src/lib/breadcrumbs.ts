import { getRelativeLocaleUrl } from 'astro:i18n';
import { ensureTrailingSlash } from './url';

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
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return ensureTrailingSlash(getRelativeLocaleUrl(locale, normalizedPath));
}

export function buildBreadcrumbs(locale: string, items: BreadcrumbInput[]): BreadcrumbItem[] {
  return items.map((item) => ({
    label: item.label,
    href: item.href ?? (item.path ? getLocalizedPath(locale, item.path) : undefined),
  }));
}
