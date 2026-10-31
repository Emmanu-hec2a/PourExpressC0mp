import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { once } from 'node:events';
import { runInNewContext } from 'node:vm';
import { createPreviewServer } from '../scripts/preview.mjs';
import { androidIntentFor, parseAppLink, playStoreUrl } from '../public/open/app-link-target.js';

test('only canonical, approved stores and order destinations can be opened', () => {
  assert.deepEqual(parseAppLink('/open/stores'), { path: '/open/stores', kind: 'stores' });
  assert.equal(parseAppLink('https://pourexpress.co.ke/open/orders/42/')?.path, '/open/orders/42');
  assert.equal(parseAppLink('/open/orders/9223372036854775807')?.kind, 'order');
  for (const value of [
    '//evil.example/open/stores', 'http://pourexpress.co.ke/open/stores',
    'https://pourexpress.co.ke.evil.example/open/stores',
    'https://user@pourexpress.co.ke/open/stores', '/open/stores?token=secret',
    '/open/stores#x', '/open/%73tores', '/open/nope/../stores', '/open/orders/0',
    '/open/orders/01', '/open/orders/-1', '/open/orders/9223372036854775808',
    '/open/orders/42/other', '/OPEN/stores', '/open/stores\n', '/open/stores?',
    '/open/stores#', '/open/orders/42?redirect=https://evil.example',
  ]) assert.equal(parseAppLink(value), null, value);
});

test('explicit Android intent is package-scoped with a fixed Play Store fallback', () => {
  const intent = androidIntentFor('/open/orders/42');
  assert.ok(intent.startsWith('intent://pourexpress.co.ke/open/orders/42#Intent;scheme=https;'));
  assert.ok(intent.includes('package=com.pourexpress.sip;'));
  assert.ok(intent.includes('S.browser_fallback_url=' + encodeURIComponent(playStoreUrl) + ';end'));
  assert.equal(androidIntentFor('/open/stores?redirect=evil'), null);
});

test('built association contains exactly the owner-approved Play signing certificate', async () => {
  const association = JSON.parse(await readFile(new URL('../dist/.well-known/assetlinks.json', import.meta.url)));
  assert.deepEqual(association, [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.pourexpress.sip',
      sha256_cert_fingerprints: ['C0:72:52:06:21:2B:39:8A:5B:6B:01:C3:CA:CF:A9:9D:5A:BF:5E:89:D1:41:AB:34:8C:F1:9E:10:4E:8A:09:C8'],
    },
  }]);
});

test('fallbacks work without React and disclose no transaction or route data', async () => {
  for (const destination of ['stores', 'orders']) {
    const html = await readFile(new URL('../dist/open/' + destination + '/index.html', import.meta.url), 'utf8');
    assert.ok(html.includes('name="robots" content="noindex, nofollow"'));
    assert.ok(html.includes('name="referrer" content="no-referrer"'));
    assert.ok(html.includes(playStoreUrl));
    assert.ok(html.includes('App Store release is coming soon'));
    assert.ok(html.includes('id="open-app" class="button" hidden'));
    assert.ok(!html.includes('api.pourexpress') && !html.includes('order_id='));
    assert.ok(!html.includes('google-analytics') && !html.includes('location.replace'));
  }
  const script = await readFile(new URL('../dist/open/app-link.js', import.meta.url), 'utf8');
  assert.ok(!/\b(fetch|XMLHttpRequest|setTimeout|localStorage|sessionStorage)\b/.test(script));
});

test('deployment rewrite and headers retain numeric order paths and privacy', async () => {
  const redirects = await readFile(new URL('../dist/_redirects', import.meta.url), 'utf8');
  assert.ok(redirects.includes('/open/orders/* /open/orders/index.html 200'));
  const headers = await readFile(new URL('../dist/_headers', import.meta.url), 'utf8');
  assert.ok(headers.includes('Content-Type: application/json'));
  assert.ok(headers.includes('Referrer-Policy: no-referrer'));
  assert.ok(headers.includes('X-Robots-Tag: noindex, nofollow'));
  assert.ok(headers.includes('Cache-Control: no-store'));
});

test('local HTTP mirrors the Cloudflare order fallback and association rules', async (t) => {
  const server = createPreviewServer();
  t.after(() => { server.closeAllConnections(); server.close(); });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  for (const path of ['/open/stores', '/open/orders/42', '/open/orders/42/']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    const html = await response.text();
    assert.ok(html.includes('PourXpress') && html.includes(playStoreUrl));
  }
  for (const path of ['/open/app-link.css', '/open/app-link.js', '/open/app-link-target.js']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    await response.text();
  }
  const association = await fetch(origin + '/.well-known/assetlinks.json');
  assert.equal(association.status, 200);
  assert.match(association.headers.get('content-type'), /application\/json/);
  assert.equal((await association.json())[0].target.package_name, 'com.pourexpress.sip');
});

test('fallback DOM logic shows an explicit launch only for valid Android links', async () => {
  const source = (await readFile(new URL('../public/open/app-link.js', import.meta.url), 'utf8'))
    .replace(/^import [^\n]+\n/, '');
  for (const [pathname, search, userAgent, visible] of [
    ['/open/orders/42', '', 'Mozilla/5.0 Android', true],
    ['/open/stores', '', 'Mozilla/5.0 Android', true],
    ['/open/orders/42', '', 'Mozilla/5.0 Desktop', false],
    ['/open/orders/nope', '', 'Mozilla/5.0 Android', false],
    ['/open/orders/42', '?redirect=evil', 'Mozilla/5.0 Android', false],
  ]) {
    const elements = {
      'open-app': { hidden: true },
      'link-status': { textContent: '' },
      'copyright-year': { textContent: '' },
    };
    runInNewContext(source, {
      parseAppLink, androidIntentFor,
      window: { location: { pathname, search, hash: '' } },
      navigator: { userAgent },
      document: { getElementById: (id) => elements[id] },
    });
    assert.equal(elements['open-app'].hidden, !visible);
    if (visible) assert.equal(elements['open-app'].href, androidIntentFor(pathname));
    else assert.equal(elements['open-app'].href, undefined);
    assert.match(elements['copyright-year'].textContent, /^\d{4}$/);
  }
});
