import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { basename, dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { prerender } from '../scripts/prerender.mjs';
import { createPreviewServer } from '../scripts/preview.mjs';

// Keep every generated fixture inside this package, including in the staging folder.
const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const template =
  '<!doctype html><html lang="en" data-environment="production"><head><!--site-head-->' +
  '<script type="module" src="/assets/site.js"></script>' +
  '<link rel="stylesheet" href="/assets/site.css"></head>' +
  '<body><div id="root"><!--site-html--></div></body></html>';
const defaultPages = [
  { path: '/' },
  { path: '/app/' },
  { path: '/help/orders' },
  { path: '/café' },
];

async function fixture(t, { pages = defaultPages, builtTemplate = template } = {}) {
  const root = await mkdtemp(join(packageRoot, '.static-site-test-'));
  t.after(() => {
    const target = resolve(root);
    assert.equal(dirname(target), resolve(packageRoot));
    assert.ok(basename(target).startsWith('.static-site-test-'));
    return rm(target, { recursive: true, force: true });
  });
  await mkdir(join(root, 'dist/assets'), { recursive: true });
  await mkdir(join(root, '.prerender'));
  await writeFile(join(root, 'package.json'), '{"type":"module"}');
  await writeFile(join(root, 'dist/index.html'), builtTemplate);
  // A compiled-entry fixture exercises Node orchestration without React or JSX.
  await writeFile(
    join(root, '.prerender/entry-server.js'),
    `export const pages = ${JSON.stringify(pages)};\n` +
      'export const site = { origin: "https://pourexpress.co.ke/" };\n' +
      'export function render(pathname) { return {\n' +
      'html: "<main>" + pathname + " price $& literal $$</main>",\n' +
      "head: \"<title>\" + pathname + \"</title><meta name='robots' content='noindex'><meta NAME=robots content='noindex'>\"\n" +
      '}; }\n',
  );
  return root;
}

async function withPreview(value, action) {
  const previous = process.env.SITE_PREVIEW;
  if (value === undefined) delete process.env.SITE_PREVIEW;
  else process.env.SITE_PREVIEW = value;
  try {
    return await action();
  } finally {
    if (previous === undefined) delete process.env.SITE_PREVIEW;
    else process.env.SITE_PREVIEW = previous;
  }
}

async function previewFixture(t) {
  const root = await fixture(t);
  await withPreview(undefined, () => prerender({ root }));
  await writeFile(join(root, 'dist/assets/site.js'), 'console.log("preview")\n');
  await writeFile(join(root, 'dist/assets/site.css'), 'body { color: green; }\n');
  await writeFile(join(root, 'dist/assets/image.png'), Buffer.from([137, 80, 78, 71]));
  const server = createPreviewServer({ root: join(root, 'dist') });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((accept, reject) =>
      server.close((error) => (error ? reject(error) : accept())),
    );
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { root, server, port: server.address().port };
}

function fetchRaw(port, path, method = 'GET') {
  return new Promise((accept, reject) => {
    const outgoing = request({ hostname: '127.0.0.1', port, path, method }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () =>
        accept({
          status: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks),
        }),
      );
      response.on('error', reject);
    });
    outgoing.on('error', reject);
    outgoing.end();
  });
}

test('production prerenders every route, metadata, assets, 404, sitemap, and robots', async (t) => {
  const root = await fixture(t);
  const result = await withPreview(undefined, () => prerender({ root }));
  assert.equal(result.pages, 4);
  assert.equal(result.preview, false);
  for (const [filename, pathname] of [
    ['index.html', '/'],
    ['app/index.html', '/app'],
    ['help/orders/index.html', '/help/orders'],
    ['café/index.html', '/café'],
  ]) {
    const html = await readFile(join(root, 'dist', filename), 'utf8');
    assert.ok(html.includes(`<title>${pathname}</title>`));
    assert.ok(html.includes(`<main>${pathname} price $& literal $$</main>`));
    assert.equal((html.match(/name="robots"/g) ?? []).length, 1);
    assert.ok(html.includes('content="index, follow"'));
    assert.ok(html.includes('<html lang="en" data-environment="production">'));
    assert.ok(!html.includes('noindex'));
    assert.ok(!html.includes('<!--site-'));
    assert.ok(html.includes('/assets/site.js'));
    assert.ok(html.includes('/assets/site.css'));
  }
  const notFound = await readFile(join(root, 'dist/404.html'), 'utf8');
  assert.ok(notFound.includes('noindex, nofollow'));
  assert.ok(notFound.includes('data-environment="production"'));
  const sitemap = await readFile(join(root, 'dist/sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 4);
  assert.ok(sitemap.includes('<loc>https://pourexpress.co.ke/app</loc>'));
  assert.ok(!sitemap.includes('__static_not_found__'));
  assert.ok(!sitemap.includes('404.html'));
  assert.equal(
    await readFile(join(root, 'dist/robots.txt'), 'utf8'),
    'User-agent: *\nAllow: /\n\nSitemap: https://pourexpress.co.ke/sitemap.xml\n',
  );
});

test('SITE_PREVIEW=1 embeds noindex and disallows crawling', async (t) => {
  const root = await fixture(t);
  const result = await withPreview('1', () => prerender({ root }));
  assert.equal(result.preview, true);
  for (const filename of ['index.html', 'app/index.html', '404.html']) {
    const html = await readFile(join(root, 'dist', filename), 'utf8');
    assert.ok(html.includes('content="noindex, nofollow"'));
    assert.ok(html.includes('<html lang="en" data-environment="preview">'));
  }
  assert.equal(
    await readFile(join(root, 'dist/robots.txt'), 'utf8'),
    'User-agent: *\nDisallow: /\n',
  );
});

test('only the literal SITE_PREVIEW=1 enables preview mode', async (t) => {
  const root = await fixture(t);
  const result = await withPreview('true', () => prerender({ root }));
  assert.equal(result.preview, false);
  assert.ok(!(await readFile(join(root, 'dist/index.html'), 'utf8')).includes('noindex'));
});

test('environment replacement handles existing quotes, stale preview, and missing attributes', async (t) => {
  for (const opening of [
    '<html lang="en" data-environment=\'preview\'>',
    '<html lang="en" data-environment=preview>',
    '<html lang="en">',
  ]) {
    for (const value of [undefined, '1']) {
      const root = await fixture(t, { builtTemplate: template.replace(/<html[^>]*>/, opening) });
      await withPreview(value, () => prerender({ root }));
      const html = await readFile(join(root, 'dist/index.html'), 'utf8');
      assert.ok(html.includes(`data-environment="${value === '1' ? 'preview' : 'production'}"`));
      assert.equal((html.match(/data-environment=/g) ?? []).length, 1);
    }
  }
});

test('prerender discovers all eleven manifest pages, including pricing and responsible', async (t) => {
  const pages = [
    { path: '/' },
    { path: '/pricing' },
    { path: '/responsible' },
    ...Array.from({ length: 8 }, (_, index) => ({ path: `/fixture-${index}` })),
  ];
  const root = await fixture(t, { pages });
  const result = await withPreview(undefined, () => prerender({ root }));
  assert.equal(result.pages, 11);
  for (const pathname of ['/pricing', '/responsible']) {
    assert.ok(
      (await readFile(join(root, 'dist', pathname.slice(1), 'index.html'), 'utf8')).includes(
        `<main>${pathname} price`,
      ),
    );
  }
  assert.equal(
    ((await readFile(join(root, 'dist/sitemap.xml'), 'utf8')).match(/<url>/g) ?? []).length,
    11,
  );
});

test('prerender refuses a missing template marker before writing output', async (t) => {
  const original = template.replace('<!--site-head-->', '');
  const root = await fixture(t, { builtTemplate: original });
  await assert.rejects(prerender({ root }), /exactly one <!--site-head-->/);
  assert.equal(await readFile(join(root, 'dist/index.html'), 'utf8'), original);
});

test('prerender rejects duplicate and unsafe manifest routes', async (t) => {
  for (const pages of [
    [{ path: '/' }, { path: '/app' }, { path: '/app/' }],
    [{ path: '/' }, { path: '/../../outside' }],
    [{ path: '/' }, { path: '/%2e%2e/outside' }],
  ]) {
    const root = await fixture(t, { pages });
    await assert.rejects(prerender({ root }), /Duplicate|Unsafe|Expected/);
    assert.equal(await readFile(join(root, 'dist/index.html'), 'utf8'), template);
  }
});

test('preview serves directory-index routes with either slash form and query strings', async (t) => {
  const { port } = await previewFixture(t);
  for (const path of ['/app', '/app/', '/app/index.html', '/app?ref=test', '/app/?ref=test']) {
    const result = await fetchRaw(port, path);
    assert.equal(result.status, 200, path);
    assert.match(result.headers['content-type'], /^text\/html/);
    assert.ok(result.body.toString().includes('<main>/app price'));
    assert.equal(Number(result.headers['content-length']), result.body.length);
  }
  assert.equal((await fetchRaw(port, '/')).status, 200);
  assert.ok((await fetchRaw(port, '/caf%C3%A9')).body.toString().includes('/café price'));
});

test('preview preserves asset bytes and MIME types, and HEAD sends no body', async (t) => {
  const { port } = await previewFixture(t);
  for (const [path, mime] of [
    ['/assets/site.js', 'text/javascript'],
    ['/assets/site.css', 'text/css'],
    ['/assets/image.png', 'image/png'],
    ['/sitemap.xml', 'application/xml'],
    ['/robots.txt', 'text/plain'],
    ['/app', 'text/html'],
  ]) {
    const get = await fetchRaw(port, path);
    const head = await fetchRaw(port, path, 'HEAD');
    assert.equal(get.status, 200);
    assert.equal(head.status, 200);
    assert.ok(get.headers['content-type'].startsWith(mime));
    assert.equal(head.headers['content-type'], get.headers['content-type']);
    assert.equal(Number(head.headers['content-length']), get.body.length);
    assert.equal(head.body.length, 0);
  }
  assert.deepEqual(
    (await fetchRaw(port, '/assets/image.png')).body,
    Buffer.from([137, 80, 78, 71]),
  );
});

test('preview returns real 404s for unknown pages and assets, including HEAD', async (t) => {
  const { port } = await previewFixture(t);
  for (const path of [
    '/missing',
    '/missing/',
    '/missing.html',
    '/assets/missing.js',
    '/missing.json',
  ]) {
    const get = await fetchRaw(port, path);
    const head = await fetchRaw(port, path, 'HEAD');
    assert.equal(get.status, 404, path);
    assert.equal(head.status, 404, path);
    assert.equal(head.body.length, 0);
    assert.equal(Number(head.headers['content-length']), get.body.length);
    if (path.endsWith('.js') || path.endsWith('.json')) {
      assert.equal(get.body.toString(), 'Not found\n');
      assert.match(get.headers['content-type'], /^text\/plain/);
    } else {
      assert.ok(get.body.toString().includes('noindex, nofollow'));
    }
    assert.ok(!get.body.toString().includes('<main>/ price'));
  }
});

test('preview rejects unsupported methods', async (t) => {
  const { port } = await previewFixture(t);
  const result = await fetchRaw(port, '/app', 'POST');
  assert.equal(result.status, 405);
  assert.equal(result.headers.allow, 'GET, HEAD');
});

test('preview requires exact route and asset casing even on Windows', async (t) => {
  const { port } = await previewFixture(t);
  for (const path of ['/APP', '/App/', '/app/INDEX.html', '/ASSETS/site.js', '/assets/SITE.js']) {
    const result = await fetchRaw(port, path);
    assert.equal(result.status, 404, path);
    assert.ok(!result.body.toString().includes('<main>/app price'));
  }
});

test('preview rejects raw and decoded traversal and malformed pathname encodings', async (t) => {
  const { root, port } = await previewFixture(t);
  await writeFile(join(root, 'secret.txt'), 'outside sentinel');
  for (const path of [
    '/../secret.txt',
    '/%2e%2e/secret.txt',
    '/app/%2e%2e/%2e%2e/secret.txt',
    '/..%5csecret.txt',
    '/%2f../secret.txt',
    '/file.txt%3asecret',
    '/%00',
    '/%ZZ',
  ]) {
    const result = await fetchRaw(port, path);
    assert.ok([400, 403].includes(result.status), `${path}: ${result.status}`);
    assert.ok(!result.body.toString().includes('outside sentinel'));
  }
  assert.equal((await fetchRaw(port, '/%252e%252e/secret.txt')).status, 404);
});

test('preview rejects directory symlinks that escape dist', async (t) => {
  const { root, port } = await previewFixture(t);
  const outside = join(root, 'outside');
  await mkdir(outside);
  await writeFile(join(outside, 'secret.txt'), 'outside sentinel');
  try {
    await symlink(outside, join(root, 'dist/linked'), 'junction');
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) {
      t.skip(`Directory symlinks unavailable: ${error.code}`);
      return;
    }
    throw error;
  }
  const result = await fetchRaw(port, '/linked/secret.txt');
  assert.equal(result.status, 403);
  assert.ok(!result.body.toString().includes('outside sentinel'));
});
