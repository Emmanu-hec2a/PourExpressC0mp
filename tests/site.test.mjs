import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import QRCode from 'qrcode';
import { site, riderApp, publication } from '../src/config/site.js';
import { pages, getPage, normalizePathname, notFoundPage } from '../src/config/routes.js';
import { plans } from '../src/content/pricing.js';
import { faqs } from '../src/content/faqs.js';
import { renderHead, updateMetadata, website, organization } from '../src/lib/metadata.js';

test('owner-approved public URLs and shared Android listing remain exact', () => {
  assert.equal(
    site.android.storeUrl,
    'https://play.google.com/store/apps/details?id=com.pourexpress.sip',
  );
  assert.equal(site.android.packageName, 'com.pourexpress.sip');
  assert.equal(riderApp, site.android);
  assert.equal(site.merchantUrl, 'https://merchants.pourexpress.co.ke');
  assert.equal(site.supportEmail, 'support@pourexpress.co.ke');
  assert.equal(site.whatsappUrl, 'https://wa.me/254718258821');
});

test('iOS remains honest coming-soon information with no guessed URL or date', () => {
  assert.deepEqual(site.ios, { status: 'coming_soon', storeUrl: null, releaseDate: null });
  assert.equal(publication.accountDeletion, false);
  assert.ok(!pages.some((page) => page.path === '/account-deletion'));
});

test('approved page manifest is unique, normalized and preserves public URLs', () => {
  assert.equal(pages.length, 11);
  assert.equal(new Set(pages.map((page) => page.path)).size, pages.length);
  assert.equal(new Set(pages.map((page) => page.title)).size, pages.length);
  for (const path of ['/', '/about', '/privacy', '/terms', '/merchants/pricing'])
    assert.notEqual(getPage(path), notFoundPage);
  assert.equal(normalizePathname('/app/?from=test#download'), '/app');
  assert.equal(getPage('/app/').path, '/app');
  assert.equal(getPage('/APP'), notFoundPage);
  assert.equal(getPage('/does-not-exist'), notFoundPage);
});

test('each static page gets unique metadata, one canonical and no iOS listing', () => {
  for (const page of pages) {
    const html = renderHead(page);
    assert.ok(html.includes('<title>' + page.title.replace(/&/g, '&amp;') + '</title>'));
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    assert.ok(html.includes('href="' + site.origin + page.path + '"'));
    assert.ok(html.includes('index, follow'));
    assert.ok(!html.includes('apps.apple.com'));
    assert.ok(!html.includes('aggregateRating'));
  }
  assert.ok(renderHead(notFoundPage).includes('noindex, nofollow'));
  assert.ok(!renderHead(notFoundPage).includes('rel="canonical"'));
  assert.ok(renderHead(pages[0], { preview: true }).includes('noindex, nofollow'));
});

test('metadata escapes markup rather than accepting HTML in page copy', () => {
  const html = renderHead({
    path: '/',
    title: '<img src=x onerror=alert(1)>',
    description: '"unsafe" & <script>',
  });
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('&quot;unsafe&quot; &amp; &lt;script&gt;'));
});

test('merchant fees match the owner-confirmed pricing', () => {
  assert.deepEqual(
    plans.map((plan) => [plan.name, plan.monthly, plan.commission]),
    [
      ['Free', '0', '10%'],
      ['Base', '3,000', '8%'],
      ['Pro', '5,000', '5%'],
      ['Enterprise', null, 'Negotiable'],
    ],
  );
  assert.ok(!plans.some((plan) => plan.description.includes('Most Popular')));
  assert.ok(
    faqs.find((item) => item.category === 'Riders').answer.includes('same Google Play listing'),
  );
});

test('built download QR is generated from the exact public URL, not a redirect', async () => {
  const expected = await QRCode.toString(site.android.storeUrl, {
    type: 'svg',
    width: 190,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: '#0d3b30', light: '#ffffff' },
  });
  const svg = await readFile(
    new URL('../dist/images/android-download-qr.svg', import.meta.url),
    'utf8',
  );
  assert.equal(svg.slice(svg.indexOf('<svg')).trim(), expected.trim());
});
test('preferred site name is consistent in page titles and social metadata', () => {
  assert.equal(site.name, 'PourXpress');
  assert.deepEqual(site.alternateNames, ['PourExpress']);
  for (const page of [...pages, notFoundPage]) {
    assert.ok(page.title.includes(site.name), page.path + ': preferred brand in title');
    const head = renderHead(page);
    assert.ok(head.includes('<meta property="og:site_name" content="PourXpress">'));
    assert.ok(head.includes('<meta name="application-name" content="PourXpress">'));
    assert.ok(head.includes('content="PourXpress — local stores, connected"'));
  }
});

test('one homepage WebSite node links the preferred name to the canonical organization', () => {
  for (const page of [...pages, notFoundPage]) {
    const blocks = [
      ...renderHead(page).matchAll(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
      ),
    ].map((match) => JSON.parse(match[1]));
    assert.equal(blocks.filter((node) => node['@type'] === 'Organization').length, 1);
    const nodes = blocks.filter((node) => node['@type'] === 'WebSite');
    assert.equal(nodes.length, page.path === '/' ? 1 : 0);
    if (nodes.length) {
      assert.equal(nodes[0].name, 'PourXpress');
      assert.deepEqual(nodes[0].alternateName, ['PourExpress']);
      assert.equal(nodes[0].url, 'https://pourexpress.co.ke/');
      assert.equal(nodes[0]['@id'], 'https://pourexpress.co.ke/#website');
      assert.equal(nodes[0].publisher['@id'], organization['@id']);
    }
  }
});

test('client navigation adds/removes one homepage WebSite node and preserves preview noindex', () => {
  const savedDocument = globalThis.document;
  const elements = [];
  const element = (tag) => ({
    tag,
    attributes: {},
    setAttribute(key, value) {
      this.attributes[key] = value;
    },
    remove() {
      const index = elements.indexOf(this);
      if (index >= 0) elements.splice(index, 1);
    },
  });
  const document = {
    title: '',
    documentElement: { dataset: { environment: 'production' } },
    createElement: element,
    getElementById: (id) => elements.find((node) => node.id === id),
    head: {
      appendChild(node) {
        elements.push(node);
      },
      querySelector(selector) {
        const meta = selector.match(/^meta\[(name|property)="([^"]+)"\]$/);
        if (meta)
          return elements.find(
            (node) => node.tag === 'meta' && node.attributes[meta[1]] === meta[2],
          );
        if (selector === 'link[rel="canonical"]')
          return elements.find((node) => node.tag === 'link' && node.rel === 'canonical');
        throw new Error('Unexpected selector: ' + selector);
      },
    },
  };
  globalThis.document = document;
  try {
    const homepage = getPage('/');
    updateMetadata(getPage('/app'));
    assert.equal(document.getElementById('website-data'), undefined);
    for (let index = 0; index < 3; index++) updateMetadata(homepage);
    assert.equal(elements.filter((node) => node.id === 'website-data').length, 1);
    const node = document.getElementById('website-data');
    assert.equal(node.type, 'application/ld+json');
    assert.deepEqual(JSON.parse(node.textContent), website);
    updateMetadata(getPage('/merchants'));
    assert.equal(document.getElementById('website-data'), undefined);
    updateMetadata(homepage);
    assert.equal(document.getElementById('website-data').id, 'website-data');
    document.documentElement.dataset.environment = 'preview';
    updateMetadata(homepage);
    assert.equal(
      document.head.querySelector('meta[name="robots"]').attributes.content,
      'noindex, nofollow',
    );
    assert.equal(
      document.head.querySelector('meta[property="og:site_name"]').attributes.content,
      'PourXpress',
    );
    updateMetadata(notFoundPage);
    assert.equal(document.head.querySelector('link[rel="canonical"]'), undefined);
    assert.equal(document.getElementById('website-data'), undefined);
  } finally {
    if (savedDocument === undefined) delete globalThis.document;
    else globalThis.document = savedDocument;
  }
});

test('dedicated favicon/touch PNGs are square and match declared sizes at stable paths', async () => {
  const template = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const [name, size, relation] of [
    ['favicon.png', 96, 'icon'],
    ['apple-touch-icon.png', 180, 'apple-touch-icon'],
  ]) {
    const png = await readFile(new URL('../public/images/' + name, import.meta.url));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(png.toString('ascii', 12, 16), 'IHDR');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
    assert.ok(size > 48);
    assert.match(
      template,
      new RegExp(
        '<link[^>]*rel="' +
          relation +
          '"[^>]*sizes="' +
          size +
          'x' +
          size +
          '"[^>]*href="/images/' +
          name.replace('.', '\\.') +
          '"',
      ),
    );
  }
  assert.ok(!template.includes('href="/logo1.png"'));
});

test('editable favicon is a simple local vector mark rather than a poster or embedded bitmap', async () => {
  const svg = await readFile(new URL('../public/images/brand-mark.svg', import.meta.url), 'utf8');
  assert.ok(svg.includes('viewBox="0 0 64 64"'));
  assert.ok(svg.includes('PourXpress'));
  assert.ok(svg.includes('#0d3b30') && svg.includes('#f97316'));
  assert.ok(!/<image|<script|<foreignObject|\b(?:href|font-family)=/i.test(svg));
  assert.ok(svg.length < 1000);
});
