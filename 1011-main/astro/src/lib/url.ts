const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const FILE_PATH_PATTERN = /\/[^/]+\.[^/]+$/;

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  if (pathname.endsWith('/') || FILE_PATH_PATTERN.test(pathname)) {
    return pathname;
  }

  return `${pathname}/`;
}

export function needsTrailingSlash(pathname: string): boolean {
  return normalizePathname(pathname) !== pathname;
}

export function ensureTrailingSlash(value: string): string {
  if (!value) {
    return '/';
  }

  if (ABSOLUTE_URL_PATTERN.test(value)) {
    const url = new URL(value);
    url.pathname = normalizePathname(url.pathname);
    return url.toString();
  }

  const [pathAndSearch, hash = ''] = value.split('#', 2);
  const [pathname, search = ''] = pathAndSearch.split('?', 2);
  const normalizedPath = normalizePathname(pathname || '/');

  return `${normalizedPath}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
}

export function getSiteBaseUrl(): string {
  return (process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? process.env.SITE_URL ?? 'https://iplmanufacturer.com').replace(/\/$/, '');
}

export function toAbsoluteUrl(pathOrUrl: string, baseUrl = getSiteBaseUrl()): string {
  if (ABSOLUTE_URL_PATTERN.test(pathOrUrl)) {
    return ensureTrailingSlash(pathOrUrl);
  }

  const normalizedPath = ensureTrailingSlash(pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);
  return `${baseUrl}${normalizedPath}`;
}
