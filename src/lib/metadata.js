import { site } from '../config/site.js';

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const serialize = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const structuredDataTag = (id, value) =>
  '<script type="application/ld+json" id="' + id + '">' + serialize(value) + '</script>';

export const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': site.origin + '/#organization',
  name: site.name,
  alternateName: site.alternateNames,
  url: site.origin + '/',
  logo: site.origin + '/images/brand-logo.png',
};
export const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': site.origin + '/#website',
  name: site.name,
  alternateName: site.alternateNames,
  url: site.origin + '/',
  publisher: { '@id': organization['@id'] },
};

export function renderHead(page, { preview = false } = {}) {
  const url = page.path === null ? null : site.origin + page.path;
  return [
    '<title>' + escape(page.title) + '</title>',
    '<meta name="application-name" content="' + escape(site.name) + '">',
    '<meta name="description" content="' + escape(page.description) + '">',
    '<meta name="robots" content="' +
      (preview || !url ? 'noindex, nofollow' : 'index, follow') +
      '">',
    url ? '<link rel="canonical" href="' + escape(url) + '">' : '',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="' + escape(site.name) + '">',
    '<meta property="og:locale" content="en_KE">',
    '<meta property="og:title" content="' + escape(page.title) + '">',
    '<meta property="og:description" content="' + escape(page.description) + '">',
    url ? '<meta property="og:url" content="' + escape(url) + '">' : '',
    '<meta property="og:image" content="' + site.origin + '/images/social-card.png">',
    '<meta property="og:image:alt" content="' + escape(site.name) + ' — local stores, connected">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + escape(page.title) + '">',
    '<meta name="twitter:description" content="' + escape(page.description) + '">',
    '<meta name="twitter:image" content="' + site.origin + '/images/social-card.png">',
    structuredDataTag('organization-data', organization),
    // Site-name preference belongs to the canonical homepage, not each subpage.
    page.path === '/' ? structuredDataTag('website-data', website) : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function updateMetadata(page) {
  document.title = page.title;
  const set = (attribute, key, value) => {
    let element = document.head.querySelector('meta[' + attribute + '="' + key + '"]');
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', value);
  };
  set('name', 'application-name', site.name);
  set('name', 'description', page.description);
  set(
    'name',
    'robots',
    page.path === null || document.documentElement.dataset.environment === 'preview'
      ? 'noindex, nofollow'
      : 'index, follow',
  );
  for (const [key, value] of [
    ['og:site_name', site.name],
    ['og:title', page.title],
    ['og:description', page.description],
    ['og:url', site.origin + (page.path || '')],
  ])
    set('property', key, value);
  set('name', 'twitter:title', page.title);
  set('name', 'twitter:description', page.description);

  let siteData = document.getElementById('website-data');
  if (page.path !== '/') siteData?.remove();
  else {
    if (!siteData) {
      siteData = document.createElement('script');
      siteData.id = 'website-data';
      siteData.type = 'application/ld+json';
      document.head.appendChild(siteData);
    }
    siteData.textContent = serialize(website);
  }

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (page.path === null) canonical?.remove();
  else {
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = site.origin + page.path;
  }
}
