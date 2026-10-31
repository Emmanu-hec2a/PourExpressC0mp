import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const websiteRoot = fileURLToPath(new URL('../', import.meta.url));
export const appLinkOrigin = 'https://pourexpress.co.ke';
export const signingFingerprint = 'C0:72:52:06:21:2B:39:8A:5B:6B:01:C3:CA:CF:A9:9D:5A:BF:5E:89:D1:41:AB:34:8C:F1:9E:10:4E:8A:09:C8';
export const requiredAppLinkAssets = Object.freeze([
  '.well-known/assetlinks.json', '_redirects', '_headers',
  'open/stores/index.html', 'open/orders/index.html',
  'open/app-link.js', 'open/app-link-target.js', 'open/app-link.css',
]);

export function validateAssociation(value) {
  assert.ok(Array.isArray(value) && value.length === 1, 'Association must be a JSON statement array, not homepage HTML.');
  const statement = value[0];
  assert.deepEqual(statement.relation, ['delegate_permission/common.handle_all_urls']);
  assert.equal(statement.target?.namespace, 'android_app');
  assert.equal(statement.target?.package_name, 'com.pourexpress.sip', 'Wrong Android application ID.');
  assert.deepEqual(statement.target?.sha256_cert_fingerprints, [signingFingerprint],
    'Association does not match the owner-approved Play signing fingerprint.');
}

function validateFallback(html, path) {
  assert.ok(html.includes('src="/open/app-link.js"'), path + ': app-link page is missing (possibly the homepage SPA fallback).');
  assert.ok(html.includes('id="open-app"'), path + ': explicit launch action missing.');
  assert.ok(html.includes('name="robots" content="noindex, nofollow"'), path + ': noindex missing.');
  assert.ok(html.includes('name="referrer" content="no-referrer"'), path + ': referrer protection missing.');
  assert.ok(html.includes('https://play.google.com/store/apps/details?id=com.pourexpress.sip'),
    path + ': approved Google Play fallback missing.');
}

export async function verifyBuild({ root = websiteRoot, production = false } = {}) {
  const config = JSON.parse(await readFile(resolve(root, 'wrangler.json'), 'utf8'));
  assert.equal(config.name, 'pourexpressc0mp', 'Unexpected deployment target; review before publishing.');
  assert.equal(config.assets?.directory, './dist', 'Cloudflare must upload the complete dist directory.');
  for (const asset of requiredAppLinkAssets) {
    const [source, built] = await Promise.all([
      readFile(resolve(root, 'public', asset)), readFile(resolve(root, 'dist', asset)),
    ]);
    assert.ok(source.equals(built), 'Missing or stale built app-link asset: ' + asset);
  }
  const readBuilt = (name) => readFile(resolve(root, 'dist', name), 'utf8');
  validateAssociation(JSON.parse(await readBuilt('.well-known/assetlinks.json')));
  for (const name of ['stores', 'orders']) {
    validateFallback(await readBuilt('open/' + name + '/index.html'), '/open/' + name);
  }
  const redirects = await readBuilt('_redirects');
  assert.ok(redirects.split(/\r?\n/).some((line) =>
    line.trim() === '/open/orders/* /open/orders/index.html 200'), 'Order fallback proxy rule missing.');
  const blocks = (await readBuilt('_headers')).replaceAll('\r\n', '\n').split(/\n\s*\n/);
  const associationHeaders = blocks.find((block) => block.startsWith('/.well-known/assetlinks.json\n')) || '';
  const privateHeaders = blocks.find((block) => block.startsWith('/open/*\n')) || '';
  assert.match(associationHeaders, /Content-Type:\s*application\/json/i);
  assert.match(privateHeaders, /Referrer-Policy:\s*no-referrer/i);
  assert.match(privateHeaders, /X-Robots-Tag:\s*noindex,\s*nofollow/i);
  assert.match(privateHeaders, /Cache-Control:\s*no-store/i);
  if (production) {
    assert.match(await readBuilt('index.html'), /data-environment="production"/,
      'Refusing to publish a preview/noindex build as production.');
  }
  return { assets: requiredAppLinkAssets.length, worker: config.name };
}

export async function verifyLive({ fetchImpl = globalThis.fetch } = {}) {
  async function get(path, contentType, allowCanonicalSlash = false) {
    const options = {
      method: 'GET', redirect: 'manual', cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(15000),
    };
    let response = await fetchImpl(appLinkOrigin + path, options);
    // Cloudflare's default HTML handling canonicalizes folder-index pages.
    // The association must NEVER redirect; only the exact fallback slash is safe.
    if (allowCanonicalSlash && [301, 302, 307, 308].includes(response.status)) {
      const location = new URL(response.headers.get('location') || '', appLinkOrigin + path);
      assert.equal(location.href, appLinkOrigin + path + '/',
        path + ': unexpected redirect; refusing to follow it.');
      response = await fetchImpl(location.href, options);
    }
    assert.equal(response.status, 200, path + ': expected HTTP 200 without a redirect.');
    assert.match(response.headers.get('content-type') || '', contentType,
      path + ': wrong content type (possibly homepage HTML).');
    return response;
  }
  const association = await get('/.well-known/assetlinks.json', /^application\/json\b/i);
  validateAssociation(await association.json());
  for (const path of ['/open/stores', '/open/orders/1']) {
    // /1 is a generic public fallback request, never an order API lookup.
    const response = await get(path, /^text\/html\b/i, true);
    validateFallback(await response.text(), path);
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer', path + ': referrer header missing.');
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/i);
    assert.equal(response.headers.get('cache-control'), 'no-store', path + ': no-store header missing.');
  }
  for (const [path, type] of [
    ['/open/app-link.js', /^(?:text|application)\/javascript\b/i],
    ['/open/app-link-target.js', /^(?:text|application)\/javascript\b/i],
    ['/open/app-link.css', /^text\/css\b/i],
  ]) {
    const response = await get(path, type);
    assert.ok((await response.text()).length > 30, path + ': empty app-link resource.');
  }
  return { origin: appLinkOrigin, checks: 6 };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const flags = process.argv.slice(2);
    assert.ok(flags.length === 1 && ['--build', '--live'].includes(flags[0]),
      'Usage: node scripts/verify-app-links.mjs --build|--live');
    const result = flags[0] === '--live' ? await verifyLive() : await verifyBuild();
    console.log('App-link verification passed: ' + JSON.stringify(result));
  } catch (error) {
    console.error('App-link verification failed: ' + error.message);
    process.exitCode = 1;
  }
}
