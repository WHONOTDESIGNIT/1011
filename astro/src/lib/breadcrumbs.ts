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
  if (!path || path === '/') {
    return `/${locale}`;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalizedPath}`;
}

export function buildBreadcrumbs(locale: string, items: BreadcrumbInput[]): BreadcrumbItem[] {
  return items.map((item) => ({
    label: item.label,
    href: item.href ?? (item.path ? getLocalizedPath(locale, item.path) : undefined),
  }));
}
