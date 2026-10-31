import assert from 'node:assert/strict';
import { once } from 'node:events';
import { copyFile, mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import test from 'node:test';
import {
  appLinkOrigin, requiredAppLinkAssets, validateAssociation,
  verifyBuild, verifyLive, websiteRoot,
} from '../scripts/verify-app-links.mjs';
import { requireDeploymentRuntime } from '../scripts/deploy-website.mjs';
import { createPreviewServer } from '../scripts/preview.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(websiteRoot, '.static-site-test-links-'));
  t.after(() => {
    assert.equal(dirname(resolve(root)), resolve(websiteRoot));
    assert.ok(basename(root).startsWith('.static-site-test-links-'));
    return rm(root, { recursive: true, force: true });
  });
  await copyFile(join(websiteRoot, 'wrangler.json'), join(root, 'wrangler.json'));
  for (const name of requiredAppLinkAssets) {
    for (const dir of ['public', 'dist']) {
      const destination = join(root, dir, name);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(join(websiteRoot, 'public', name), destination);
    }
  }
  await writeFile(join(root, 'dist/index.html'), '<!doctype html><html data-environment="production"></html>');
  return root;
}

test('release verifier accepts the complete built app-link artifact', async () => {
  assert.deepEqual(await verifyBuild({ production: true }),
    { assets: requiredAppLinkAssets.length, worker: 'pourexpressc0mp' });
});

test('release verifier rejects a missing association instead of allowing SPA fallback', async (t) => {
  const root = await fixture(t);
  await unlink(join(root, 'dist/.well-known/assetlinks.json'));
  await assert.rejects(verifyBuild({ root }), /ENOENT/);
});

test('release verifier rejects a stale copied file', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, 'dist/open/app-link.js'), '// stale copy');
  await assert.rejects(verifyBuild({ root }), /stale built app-link asset/);
});

test('release verifier rejects homepage HTML and unexpected signing identities', async () => {
  assert.throws(() => validateAssociation('<html>Homepage</html>'), /statement array/);
  const statement = JSON.parse(await readFile(join(websiteRoot, 'public/.well-known/assetlinks.json'), 'utf8'));
  statement[0].target.package_name = 'com.other.app';
  assert.throws(() => validateAssociation(statement), /application ID/);
});

test('production release refuses preview output', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, 'dist/index.html'), '<html data-environment="preview">');
  await assert.rejects(verifyBuild({ root, production: true }), /preview\/noindex/);
});

test('live verification rejects HTTP-200 homepage HTML without any writes', async () => {
  let requests = 0;
  await assert.rejects(verifyLive({ fetchImpl: async (url, options) => {
    assert.ok(url.startsWith(appLinkOrigin));
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'manual');
    requests++;
    return new Response('<html>Homepage</html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
  } }), /wrong content type/);
  assert.equal(requests, 1);
});

test('association verification refuses even a same-site redirect', async () => {
  await assert.rejects(verifyLive({ fetchImpl: async () =>
    new Response(null, { status: 301, headers: { Location: appLinkOrigin + '/' } }),
  }), /without a redirect/);
});

test('live verification checks real loopback responses without external requests', async (t) => {
  const server = createPreviewServer();
  t.after(() => { server.closeAllConnections(); server.close(); });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const local = 'http://127.0.0.1:' + server.address().port;
  const urls = [];
  const result = await verifyLive({ fetchImpl: (url, options) => {
    assert.ok(url.startsWith(appLinkOrigin + '/'));
    urls.push(url);
    return fetch(local + url.slice(appLinkOrigin.length), options);
  } });
  assert.equal(result.checks, 6);
  assert.equal(urls.length, 6);
  assert.ok(urls.every((url) => !url.includes('/api/')));
  const canonical = await verifyLive({ fetchImpl: (url, options) => {
    if (url === appLinkOrigin + '/open/stores') {
      return new Response(null, { status: 307, headers: { Location: '/open/stores/' } });
    }
    return fetch(local + url.slice(appLinkOrigin.length), options);
  } });
  assert.equal(canonical.checks, 6, 'Cloudflare folder canonicalization is accepted for fallback HTML only.');
  await assert.rejects(verifyLive({ fetchImpl: (url, options) => {
    if (url === appLinkOrigin + '/open/stores') {
      return new Response(null, { status: 302, headers: { Location: 'https://evil.example/' } });
    }
    assert.ok(url.startsWith(appLinkOrigin + '/'));
    return fetch(local + url.slice(appLinkOrigin.length), options);
  } }), /unexpected redirect/);
});

test('deployment runtime fails early on Node 20 or old Node 22', () => {
  assert.throws(() => requireDeploymentRuntime('20.20.2'), /No deployment was attempted/);
  assert.throws(() => requireDeploymentRuntime('22.0.0'), /Node 22.12/);
  assert.doesNotThrow(() => requireDeploymentRuntime('22.12.0'));
  assert.doesNotThrow(() => requireDeploymentRuntime('24.0.0'));
});
