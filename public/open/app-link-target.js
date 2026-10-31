export const appOrigin = 'https://pourexpress.co.ke';
export const androidPackage = 'com.pourexpress.sip';
export const playStoreUrl = 'https://play.google.com/store/apps/details?id=' + androidPackage;

// Public navigation only. No order lookup, auth token, redirect parameter, or analytics.
export function parseAppLink(raw) {
  if (typeof raw !== 'string' || raw.includes('%') || raw.includes('\\') ||
      /[\x00-\x20\x7f?#]/.test(raw)) return null;
  if (!raw.startsWith('/') && !raw.startsWith(appOrigin + '/')) return null;
  let url;
  try { url = new URL(raw, appOrigin); } catch { return null; }
  if (url.origin !== appOrigin || url.username || url.password || url.search || url.hash) return null;
  // Reject normalized traversal, rather than treating it as a valid destination.
  const literalPath = raw.startsWith(appOrigin) ? raw.slice(appOrigin.length) : raw;
  if (literalPath !== url.pathname) return null;
  if (/^\/open\/stores\/?$/.test(url.pathname)) return { path: '/open/stores', kind: 'stores' };
  const match = /^\/open\/orders\/([1-9][0-9]{0,18})\/?$/.exec(url.pathname);
  if (!match || BigInt(match[1]) > 9223372036854775807n) return null;
  return { path: '/open/orders/' + match[1], kind: 'order' };
}

export function androidIntentFor(raw) {
  const target = parseAppLink(raw);
  if (!target) return null;
  return 'intent://pourexpress.co.ke' + target.path +
    '#Intent;scheme=https;package=' + androidPackage +
    ';S.browser_fallback_url=' + encodeURIComponent(playStoreUrl) + ';end';
}
