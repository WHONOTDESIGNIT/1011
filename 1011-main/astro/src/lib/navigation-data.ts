import { getLocalizedPath } from './breadcrumbs';
import { t } from './i18n';

export type NavigationLink = {
  label: string;
  href: string;
};

function normalizeLocalizedHref(locale: string, href: string): string {
  if (!href) return '/';
  const prefix = `/${locale}`;
  if (href === prefix) return '/';
  if (href.startsWith(`${prefix}/`)) return href.slice(prefix.length) || '/';
  return href;
}

export function getSubNavigation(locale: string, href: string): NavigationLink[] {
  const path = normalizeLocalizedHref(locale, href);

  if (path === '/products') {
    const items = [
      { path: '/products/lumi', label: t(locale, 'nav.lumi') },
      { path: '/products/venus', label: t(locale, 'nav.venus') },
      { path: '/products/hestia', label: t(locale, 'nav.hestia') },
      { path: '/products/alpha', label: t(locale, 'nav.alpha') },
      { path: '/products/emerald', label: t(locale, 'nav.emerald') },
      { path: '/products/euno', label: t(locale, 'nav.euno') },
      { path: '/products/themis', label: t(locale, 'nav.themis') },
      { path: '/products/hebe', label: t(locale, 'nav.hebe') },
      { path: '/products/eirene', label: t(locale, 'nav.eirene') },
      { path: '/products/wooden', label: t(locale, 'nav.wooden') },
    ];

    return items.map((item) => ({
      label: item.label,
      href: getLocalizedPath(locale, item.path),
    }));
  }

  if (path === '/components') {
    const items = [
      { path: '/components', label: t(locale, 'nav.components') },
      { path: '/components/lamp-cartridges', label: t(locale, 'nav.lampCartridges') },
      { path: '/components/optical-filters', label: t(locale, 'nav.opticalFilters') },
      { path: '/components/cooling-system', label: t(locale, 'nav.coolingSystem') },
      { path: '/components/power-supply', label: t(locale, 'nav.powerSupply') },
    ];

    return items.map((item) => ({
      label: item.label,
      href: getLocalizedPath(locale, item.path),
    }));
  }

  if (path === '/services') {
    const items = [
      { path: '/services', label: t(locale, 'nav.services') },
      { path: '/services/oem-odm', label: t(locale, 'nav.oemOdm') },
      { path: '/services/product-design', label: t(locale, 'nav.productDesign') },
      { path: '/services/production-assembly', label: t(locale, 'nav.production') },
      { path: '/services/packaging-logistics', label: t(locale, 'nav.packaging') },
    ];

    return items.map((item) => ({
      label: item.label,
      href: getLocalizedPath(locale, item.path),
    }));
  }

  if (path === '/about') {
    const items = [
      { path: '/about', label: t(locale, 'nav.about') },
      { path: '/about/brand-story', label: t(locale, 'nav.brandStory') },
      { path: '/about/company-profile', label: t(locale, 'nav.companyProfile') },
      { path: '/about/manufacturing-capabilities', label: t(locale, 'nav.manufacturing') },
      { path: '/about/quality-control', label: t(locale, 'nav.quality') },
    ];

    return items.map((item) => ({
      label: item.label,
      href: getLocalizedPath(locale, item.path),
    }));
  }

  if (path === '/clients') {
    const items = [
      { path: '/clients', label: t(locale, 'nav.clients') },
      { path: '/clients/costco-canada-ipl', label: 'Costco Canada' },
      { path: '/clients/roseskin-ipl', label: 'RoseSkinCo' },
      { path: '/clients/ku2-ipl', label: 'KU-2 Cosmetic' },
      { path: '/clients/happyskinco-ipl', label: 'HappySkinCo' },
    ];

    return items.map((item) => ({
      label: item.label,
      href: getLocalizedPath(locale, item.path),
    }));
  }

  if (path === '/blog') {
    return [
      { label: t(locale, 'nav.blog'), href: getLocalizedPath(locale, '/blog') },
    ];
  }

  return [];
}

