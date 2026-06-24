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
  void locale;
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export function buildBreadcrumbs(locale: string, items: BreadcrumbInput[]): BreadcrumbItem[] {
  return items.map((item) => ({
    label: item.label,
    href: item.href ?? (item.path ? getLocalizedPath(locale, item.path) : undefined),
  }));
}
