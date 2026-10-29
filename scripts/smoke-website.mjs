// Read-only website smoke checks. Build separately; no APIs, submissions or external navigation.
// Run from the website root: node --experimental-websocket /path/to/smoke-website.mjs
// Node 22+ does not need the flag. Optional: --root /path/to/website
// Requires the website's axe-core dev dependency; this script never installs packages.
// Optional PNG output directory: POUR_WEBSITE_SCREENSHOTS. Chrome: POUR_SMOKE_CHROME.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer, get } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const routes = [
  '/',
  '/app',
  '/merchants',
  '/merchants/pricing',
  '/riders',
  '/help',
  '/about',
  '/contact',
  '/responsible-delivery',
  '/privacy',
  '/terms',
];
const play = 'https://play.google.com/store/apps/details?id=com.pourexpress.sip';
const merchant = 'https://merchants.pourexpress.co.ke/';
const support = 'mailto:support@pourexpress.co.ke';
const whatsapp = 'https://wa.me/254718258821';
const widths = [320, 375, 390, 768, 1024, 1440, 1920];
const shortViewports = [
  [375, 480],
  [768, 320],
  [1024, 480],
];
const privacyCopy = [
  'Last updated: June 2026',
  '1. Information Collection',
  'We collect information necessary to provide our logistics and commerce services, including merchant data, GPS coordinates for delivery, and transaction history verified via M-PESA.',
  '2. Usage of Data',
  'Your data is used to optimize delivery routes, facilitate secure payments, and ensure behavioral compliance across the PourXpress ecosystem.',
  '3. TipsyTrust™ Security',
  'All sensitive information is processed through our bank-grade secure infrastructure with multi-tenant isolation, ensuring your business data remains private and protected.',
];
const termsCopy = [
  '1. Service Agreement',
  "By using PourXpress, you agree to comply with Kenya's liquor retail regulations and our behavioral compliance standards.",
  '2. Merchant Obligations',
  'Merchants must maintain valid licensing and adhere to our 3-tier age verification system (TipsyTrust™) to ensure legal safety across the platform.',
  '3. Fees & Commissions',
];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalized = (value) => value.replace(/\s+/g, ' ').trim();
const oldCopy =
  /tipsytheoryy\.com|gmail\.com|\bzero[\s-]+commission\b|\b0\s*%?\s+commission\b|\$0\s*commission\b|\bretain\s+100\s*%|5\s+days\s+to\s+launch|alpha\s+testing/i;
const hydration =
  /hydrat|did not match|server[- ]rendered.*(?:mismatch|match)|Minified React error #(418|419|421|422|423|424|425)\b/i;
const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const visibleFunction = `(element) => Boolean(element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden' && !element.closest('[hidden], [inert], [aria-hidden="true"]'))`;
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(
    'Build separately with npm run build. Run this script from the website root, or pass --root <website>.\nNode 20.10+: node --experimental-websocket <script> [--root <website>]\nRequires scripts/preview.mjs exporting createPreviewServer({root}), Chrome, axe-core in node_modules, and built static routes.\nOptional: POUR_SMOKE_CHROME, POUR_WEBSITE_SCREENSHOTS (PNG directory). No external requests or form submissions are permitted.',
  );
  process.exit(0);
}
assert.ok(
  args.length === 0 || (args.length === 2 && args[0] === '--root'),
  'Usage: smoke-website.mjs [--root <website>]',
);
const [major, minor] = process.versions.node.split('.').map(Number);
assert.ok(major > 20 || (major === 20 && minor >= 10), 'Node 20.10+ required.');
assert.equal(
  typeof globalThis.WebSocket,
  'function',
  'Node 20 requires --experimental-websocket; Node 22+ includes WebSocket.',
);
const root = path.resolve(args[1] || process.cwd());
const dist = path.join(root, 'dist');
const previewModule = path.join(root, 'scripts', 'preview.mjs');
const chromeBinary =
  process.env.POUR_SMOKE_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotDirectory = process.env.POUR_WEBSITE_SCREENSHOTS
  ? path.resolve(process.env.POUR_WEBSITE_SCREENSHOTS)
  : null;
const pending = new Map(),
  runtimeErrors = [],
  consoleErrors = [],
  assetFailures = [],
  violations = [],
  warnings = [];
const accessibilityViolations = [],
  accessibilityIncomplete = [];
const requests = new Map(),
  interceptionTasks = new Set();
let preview,
  denyProxy,
  chrome,
  socket,
  profile,
  origin,
  sequence = 0,
  phase = 'preflight',
  closing = false;
let chromeStderr = '',
  axeSource,
  axeVersion,
  axeChecks = 0,
  screenshotCount = 0,
  routeChecks = 0,
  layoutChecks = 0;

function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === 'null' ? url.protocol : url.origin + url.pathname;
  } catch {
    return String(value).slice(0, 200);
  }
}
function send(method, params = {}) {
  assert.ok(socket?.readyState === WebSocket.OPEN, 'Chrome connection is not open: ' + method);
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error('CDP timeout: ' + method));
    }, 15000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails)
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression, label = expression, timeoutMs = 12000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      if (await evaluate(expression)) return;
    } catch (error) {
      if (!/context.*destroyed|Cannot find context|Inspected target navigated/i.test(error.message))
        throw error;
    }
    await pause(75);
  }
  const state = await evaluate(
    `({path: location.pathname, ready: document.readyState, active: document.activeElement?.outerHTML?.slice(0, 350), heading: document.querySelector('main h1')?.textContent})`,
  ).catch(() => null);
  throw new Error('Timed out: ' + label + '\n' + JSON.stringify(state));
}
async function settle() {
  await evaluate(
    `document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))`,
  );
  await pause(100);
}
async function key(keyValue, code, keyCode, modifiers = 0) {
  for (const type of ['keyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', {
      type,
      key: keyValue,
      code,
      windowsVirtualKeyCode: keyCode,
      modifiers,
      ...(type === 'keyDown' && keyValue === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}),
    });
  }
}
async function click(selector, index = 0) {
  const point = await evaluate(`(() => {
    const element = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
    if (!element) throw new Error('Missing control: ' + ${JSON.stringify(selector)});
    element.scrollIntoView({block: 'center', behavior: 'instant'});
    const box = element.getBoundingClientRect();
    const x = Math.max(1, Math.min(innerWidth - 1, box.x + box.width / 2));
    const y = Math.max(1, Math.min(innerHeight - 1, box.y + box.height / 2));
    const target = document.elementFromPoint(x, y);
    if (!box.width || !box.height || !(target === element || element.contains(target))) throw new Error('Control obscured or outside viewport: ' + ${JSON.stringify(selector)});
    return {x, y};
  })()`);
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    button: 'left',
    clickCount: 1,
    ...point,
  });
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    button: 'left',
    clickCount: 1,
    ...point,
  });
}
async function viewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await settle();
}
async function loadPageImages() {
  const selector = 'img:not([loading="eager"])';
  await evaluate(`(async () => {
    for (const image of [...document.querySelectorAll(${JSON.stringify(selector)})].filter(${visibleFunction})) {
      image.scrollIntoView({block: 'center', behavior: 'instant'});
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    window.scrollTo({top: 0, behavior: 'instant'});
  })()`);
  await waitFor(
    `[...document.images].filter(${visibleFunction}).every(image => image.complete && image.naturalWidth > 0)`,
    'local page images load successfully',
  );
}
async function navigate(route, reload = false) {
  const previous = await evaluate('window.__websiteSmokeDocument').catch(() => null);
  const result = await send(
    reload ? 'Page.reload' : 'Page.navigate',
    reload ? { ignoreCache: true } : { url: origin + route },
  );
  assert.ok(!result.errorText, 'Navigation failed: ' + result.errorText);
  await waitFor(
    `Boolean(window.__websiteSmokeDocument && window.__websiteSmokeDocument !== ${JSON.stringify(previous)} && location.pathname === ${JSON.stringify(route)} && document.readyState === 'complete' && document.querySelector('main#main-content h1'))`,
    (reload ? 'refresh ' : 'direct load ') + route,
  );
  await settle();
}
function localGet(urlPath, responseType = 'text/html') {
  const url = new URL(urlPath, origin);
  assert.equal(url.origin, origin, 'HTTP checks must remain on the synthetic local preview.');
  return new Promise((resolve, reject) => {
    const request = get(
      url,
      { headers: { Accept: responseType, 'Accept-Encoding': 'identity' } },
      (response) => {
        const chunks = [];
        let bytes = 0;
        response.on('data', (chunk) => {
          bytes += chunk.length;
          if (bytes > 8 * 1024 * 1024) {
            response.destroy(new Error('Response exceeds smoke-test limit'));
            return;
          }
          chunks.push(chunk);
        });
        response.on('error', reject);
        response.on('end', () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          }),
        );
      },
    );
    request.setTimeout(10000, () => request.destroy(new Error('Local HTTP timeout: ' + urlPath)));
    request.on('error', reject);
  });
}
async function jsonLocal(url) {
  const parsed = new URL(url);
  assert.equal(parsed.hostname, '127.0.0.1', 'Chrome discovery must remain local.');
  return new Promise((resolve, reject) => {
    const request = get(parsed, (response) => {
      let body = '';
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('error', reject);
      response.on('end', () => {
        try {
          assert.equal(response.statusCode, 200);
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.setTimeout(10000, () => request.destroy(new Error('Chrome discovery timeout')));
    request.on('error', reject);
  });
}
async function listen(server) {
  assert.equal(
    typeof server?.listen,
    'function',
    'createPreviewServer({root}) must return an unstarted Node HTTP server.',
  );
  assert.equal(server.listening, false, 'Preview factory must not listen automatically.');
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
}
async function screenshot(name) {
  if (!screenshotDirectory) return;
  await evaluate('window.scrollTo({top: 0, behavior: "instant"})');
  await settle();
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  await mkdir(screenshotDirectory, { recursive: true });
  await writeFile(path.join(screenshotDirectory, name + '.png'), Buffer.from(shot.data, 'base64'));
  screenshotCount++;
}
async function intercept(params) {
  const { requestId, request, resourceType } = params;
  const url = new URL(request.url);
  const local =
    url.origin === origin &&
    ['GET', 'HEAD'].includes(request.method) &&
    !/^\/(?:api|graphql|auth)(?:\/|$)/i.test(url.pathname);
  if (local || ['data:', 'blob:', 'about:'].includes(url.protocol)) {
    await send('Fetch.continueRequest', { requestId });
  } else {
    violations.push({
      page: phase,
      method: request.method,
      type: resourceType,
      url: safeUrl(request.url),
      reason: 'External, backend or non-read-only request blocked',
    });
    await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
  }
}
function onMessage(event) {
  const message = JSON.parse(event.data);
  if (message.id) {
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    clearTimeout(item.timeout);
    message.error
      ? item.reject(new Error(JSON.stringify(message.error)))
      : item.resolve(message.result);
    return;
  }
  const p = message.params;
  if (message.method === 'Fetch.requestPaused') {
    const task = intercept(p).catch((error) => {
      if (!closing) runtimeErrors.push('Interception: ' + error.message);
    });
    interceptionTasks.add(task);
    task.finally(() => interceptionTasks.delete(task));
  } else if (message.method === 'Runtime.exceptionThrown') {
    runtimeErrors.push({
      page: phase,
      message: (p.exceptionDetails.exception?.description || p.exceptionDetails.text).slice(
        0,
        1500,
      ),
    });
  } else if (message.method === 'Runtime.consoleAPICalled') {
    const text = p.args
      .map((arg) => String(arg.value ?? arg.description ?? arg.type))
      .join(' ')
      .slice(0, 1500);
    if (p.type === 'error' || hydration.test(text))
      consoleErrors.push({ page: phase, type: p.type, message: text });
    else if (p.type === 'warning') warnings.push({ page: phase, message: text });
  } else if (message.method === 'Network.requestWillBeSent') {
    requests.set(p.requestId, { page: phase, url: safeUrl(p.request.url), type: p.type });
  } else if (message.method === 'Network.responseReceived' && p.response.status >= 400) {
    assetFailures.push({ ...requests.get(p.requestId), status: p.response.status });
  } else if (message.method === 'Network.loadingFailed' && !(p.canceled && p.type === 'Document')) {
    assetFailures.push({
      ...requests.get(p.requestId),
      error: p.errorText,
      blockedReason: p.blockedReason,
    });
  } else if (message.method === 'Network.webSocketCreated') {
    violations.push({
      page: phase,
      url: safeUrl(p.url),
      reason: 'Website must not open WebSockets',
    });
  } else if (
    message.method === 'Log.entryAdded' &&
    (p.entry.level === 'error' || hydration.test(p.entry.text))
  ) {
    consoleErrors.push({
      page: phase,
      source: p.entry.source,
      message: p.entry.text.slice(0, 1500),
    });
  }
}
async function assertClean() {
  await Promise.all([...interceptionTasks]);
  const guarded = await evaluate('window.__websiteSmokeForbidden || []');
  assert.deepEqual(guarded, [], 'A form submission or external navigation was attempted.');
  assert.deepEqual(violations, [], 'Blocked network/side-effect attempts (see diagnostics).');
  assert.deepEqual(runtimeErrors, [], 'JavaScript runtime errors (see diagnostics).');
  assert.deepEqual(consoleErrors, [], 'Console errors or hydration mismatches (see diagnostics).');
  assert.deepEqual(assetFailures, [], 'Failed assets/requests (see diagnostics).');
}
async function axeCheck(label) {
  await settle();
  await evaluate(axeSource + '\n;true;\n//# sourceURL=website-smoke-axe.min.js');
  const report = await evaluate(`(async () => {
    const tags = ${JSON.stringify(axeTags)};
    const available = new Set(axe.getRules().flatMap(rule => rule.tags));
    const missingTags = tags.filter(tag => !available.has(tag));
    if (missingTags.length) throw new Error('Installed axe-core lacks required WCAG tags: ' + missingTags.join(', '));
    const result = await axe.run(document, {
      runOnly: {type: 'tag', values: tags},
      resultTypes: ['violations', 'incomplete']
    });
    const describe = rule => ({id: rule.id, impact: rule.impact, description: rule.description, help: rule.help, helpUrl: rule.helpUrl,
      nodes: rule.nodes.map(node => ({target: node.target, html: node.html, failureSummary: node.failureSummary,
        checks: [...node.any, ...node.all, ...node.none].map(check => ({id: check.id, message: check.message, data: check.data}))}))});
    return {version: axe.version, violations: result.violations.map(describe), incomplete: result.incomplete.map(describe)};
  })()`);
  if (!axeVersion) {
    axeVersion = report.version;
    console.log('AXE ' + axeVersion + ': ' + axeTags.join(', ') + ' (color contrast included)');
  }
  axeChecks++;
  if (report.incomplete.length)
    accessibilityIncomplete.push({ page: label, rules: report.incomplete });
  if (report.violations.length)
    accessibilityViolations.push({ page: label, violations: report.violations });
  assert.deepEqual(
    report.violations,
    [],
    label + ': axe WCAG violations (exact rule/node details in diagnostics).',
  );
}
async function inspectPage(route) {
  const page = await evaluate(`(() => {
    const visible = ${visibleFunction};
    const main = document.querySelector('main#main-content');
    const links = [...document.querySelectorAll('a[href]')].map(a => ({href: a.href, raw: a.getAttribute('href'), label: a.textContent.trim(), target: a.target, rel: a.rel}));
    const forms = [...document.forms].map(f => ({search: f.getAttribute('role') === 'search' || Boolean(f.closest('.help-search, .faq-search')), action: f.getAttribute('action'), method: f.method, fields: [...f.querySelectorAll('input, textarea, select')].map(i => ({type: i.type, label: i.getAttribute('aria-label') || [...(i.labels || [])].map(l => l.textContent.trim()).join(' ')}))}));
    return {
      text: document.body.innerText, mainText: main?.innerText,
      metadata: [...document.querySelectorAll('meta[content]')].map(m => m.content).join(' '),
      siteName: document.querySelector('meta[property="og:site_name"]')?.content,
      structuredData: [...document.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)),
      title: document.title, headings: main?.querySelectorAll('h1').length,
      mainVisible: visible(main), headers: document.querySelectorAll('.site-header').length,
      navLinks: document.querySelectorAll('.site-header nav a[href]').length,
      links, forms, embeds: document.querySelectorAll('iframe, object, embed').length,
      images: [...document.images].filter(visible).map(i => ({src: i.currentSrc || i.src, complete: i.complete, width: i.naturalWidth, alt: i.getAttribute('alt')})),
      resources: [...document.querySelectorAll('[src], link[rel="stylesheet"], link[rel="icon"], link[rel="preload"], link[rel="modulepreload"], link[rel="prefetch"]')].map(e => e.getAttribute('src') || e.getAttribute('href')).filter(Boolean).map(src => new URL(src, location.href).href),
      fakeActions: [...document.querySelectorAll('a, button')].filter(visible).filter(e => /coming\\s+soon/i.test(e.textContent)).map(e => e.outerHTML.slice(0, 250))
    };
  })()`);
  assert.ok(
    page.mainVisible && page.headings === 1 && page.headers === 1,
    route + ': one visible main, main h1 and site header required.',
  );
  assert.ok(page.navLinks >= 3, route + ': header navigation must use real anchors.');
  assert.equal(page.siteName, 'PourXpress', route + ': preferred site-name metadata.');
  assert.ok(page.title.includes('PourXpress'), route + ': branded page title.');
  const websites = page.structuredData.filter((node) => node['@type'] === 'WebSite');
  assert.equal(websites.length, route === '/' ? 1 : 0, route + ': homepage-only WebSite node.');
  if (websites.length) {
    assert.equal(websites[0].name, 'PourXpress');
    assert.deepEqual(websites[0].alternateName, ['PourExpress']);
    assert.equal(websites[0].url, 'https://pourexpress.co.ke/');
  }
  assert.ok(
    page.title && normalized(page.mainText).length > 50,
    route + ': meaningful page content required.',
  );
  assert.ok(
    !oldCopy.test(
      page.text + ' ' + page.metadata + ' ' + page.links.map((link) => link.href).join(' '),
    ),
    route + ': stale domains, Gmail, launch labels or zero-commission copy.',
  );
  assert.equal(page.embeds, 0, route + ': no embedded third-party applications.');
  assert.deepEqual(
    page.fakeActions,
    [],
    route + ': coming-soon status must not pretend to be an active control.',
  );
  for (const resource of page.resources) {
    const url = new URL(resource);
    assert.ok(
      url.origin === origin || ['data:', 'blob:'].includes(url.protocol),
      route + ': all assets must be local: ' + safeUrl(resource),
    );
  }
  for (const form of page.forms) {
    assert.ok(
      route === '/help' &&
        form.search &&
        form.method.toLowerCase() === 'get' &&
        (!form.action || new URL(form.action, origin).origin === origin) &&
        form.fields.length > 0 &&
        form.fields.every(
          (field) => ['search', 'text'].includes(field.type) && field.label === 'Search help',
        ),
      route +
        ': only a real local FAQ search form is allowed; no enquiry, account or fake submission forms.',
    );
  }
  for (const link of page.links) {
    assert.ok(
      link.raw?.trim() &&
        !/^(?:#|javascript:|about:blank)$/i.test(link.raw.trim()) &&
        !/^javascript:/i.test(link.raw),
      route + ': empty or fake link: ' + link.label,
    );
    const url = new URL(link.href);
    assert.ok(
      ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol),
      route + ': unsupported link protocol: ' + url.protocol,
    );
    assert.ok(!/(?:^|\.)apps\.apple\.com$/i.test(url.hostname), route + ': no active iOS listing.');
    if (url.hostname === 'play.google.com')
      assert.equal(
        link.href,
        play,
        route + ': every customer/rider Play link must match the approved shared URL.',
      );
    if (/^merchants\./i.test(url.hostname))
      assert.equal(link.href, merchant, route + ': incorrect merchant destination.');
    if (url.protocol === 'mailto:')
      assert.equal(
        url.pathname.toLowerCase(),
        support.slice(7),
        route + ': unapproved email destination.',
      );
    if (url.protocol === 'tel:')
      assert.equal(
        url.pathname.replace(/[\s()-]/g, ''),
        '+254718258821',
        route + ': unapproved phone number.',
      );
    if (url.hostname === 'wa.me')
      assert.equal(link.href, whatsapp, route + ': incorrect WhatsApp link.');
    if (link.target === '_blank')
      assert.ok(
        /\bnoopener\b/.test(link.rel),
        route + ': external new-tab links require noopener.',
      );
  }
  if (['/', '/app', '/riders'].includes(route))
    assert.ok(
      page.links.some((link) => link.href === play),
      route + ': approved shared Play link missing.',
    );
  if (['/merchants', '/merchants/pricing'].includes(route))
    assert.ok(
      page.links.some((link) => link.href === merchant),
      route + ': approved merchant portal missing.',
    );
  if (route === '/contact')
    for (const href of [support, whatsapp])
      assert.ok(
        page.links.some((link) => link.href === href),
        route + ': missing approved contact: ' + href,
      );
  if (['/', '/app'].includes(route))
    assert.match(
      page.text,
      /(?:iOS|App\s*Store)[\s\S]{0,120}coming\s+soon|coming\s+soon[\s\S]{0,120}(?:iOS|App\s*Store)/i,
      route + ': visible, honest iOS coming-soon status missing.',
    );
  if (route === '/privacy' || route === '/terms') {
    for (const copy of route === '/privacy' ? privacyCopy : termsCopy)
      assert.ok(
        normalized(page.mainText).includes(normalized(copy)),
        route + ': policy wording changed without authorization: ' + copy,
      );
  }
  if (route === '/terms' || route === '/merchants/pricing') {
    for (const pattern of [
      /\bFree\b/i,
      /\bBase\b/i,
      /\bPro\b/i,
      /\bEnterprise\b/i,
      /\b3[ ,]?000\b/,
      /\b5[ ,]?000\b/,
      /\b10\s*%/,
      /\b8\s*%/,
      /\b5\s*%/,
      /custom|negotiable/i,
    ])
      assert.match(page.mainText, pattern, route + ': approved fee schedule incomplete.');
    const fees = page.mainText.match(
      /\bFree\b([\s\S]*?)\bBase\b([\s\S]*?)\bPro\b([\s\S]*?)\bEnterprise\b([\s\S]*)/i,
    );
    assert.ok(
      fees,
      route + ': published plan order/content must identify Free, Base, Pro and Enterprise.',
    );
    assert.match(fees[1], /\b10\s*%/, route + ': Free must specify 10% commission.');
    assert.match(fees[2], /\b3[ ,]?000\b/, route + ': Base must specify KES 3,000.');
    assert.match(fees[2], /\b8\s*%/, route + ': Base must specify 8% commission.');
    assert.match(fees[3], /\b5[ ,]?000\b/, route + ': Pro must specify KES 5,000.');
    assert.match(fees[3], /\b5\s*%/, route + ': Pro must specify 5% commission.');
    assert.match(
      fees[4],
      /custom|negotiable/i,
      route + ': Enterprise must retain custom/negotiable terms.',
    );
  }
  for (const image of page.images) {
    assert.ok(image.alt !== null, route + ': missing image alt attribute: ' + safeUrl(image.src));
    if (image.complete) assert.ok(image.width > 0, route + ': broken image: ' + safeUrl(image.src));
  }
  return page;
}
async function checkLayout(label) {
  const unreachable = await evaluate(`(() => {
    const dialog = document.querySelector('dialog[aria-label="Main navigation"][open]');
    if (!dialog) return [];
    const out = [];
    for (const element of [...dialog.querySelectorAll('a, button, input, summary')].filter(${visibleFunction})) {
      element.scrollIntoView({block: 'center', behavior: 'instant'});
      const r = element.getBoundingClientRect();
      const target = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      if (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1 || !(target === element || element.contains(target))) out.push(element.outerHTML.slice(0, 180));
    }
    return out;
  })()`);
  assert.deepEqual(
    unreachable,
    [],
    label + ': drawer controls must remain reachable by scrolling at short heights.',
  );
  const result = await evaluate(`(() => {
    const visible = ${visibleFunction};
    const header = document.querySelector('.site-header');
    const headerBox = header.getBoundingClientRect();
    const dialog = document.querySelector('dialog[aria-label="Main navigation"][open]');
    const out = [];
    const controls = dialog ? [] : [...header.querySelectorAll('a, button')];
    for (const e of controls.filter(visible)) {
      const r = e.getBoundingClientRect();
      if (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1) out.push(e.outerHTML.slice(0, 180));
    }
    const overflowing = [...document.querySelectorAll('main *, footer *, header *')].filter(visible).filter(e => e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX === 'visible').map(e => ({tag: e.tagName, class: e.className?.baseVal ?? e.className, width: e.clientWidth, scroll: e.scrollWidth})).slice(0, 15);
    return {width: innerWidth, height: innerHeight, scroll: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth), headerHeight: headerBox.height, out, overflowing, dialog: dialog ? {width: dialog.getBoundingClientRect().width, height: dialog.getBoundingClientRect().height, overflow: dialog.scrollWidth > dialog.clientWidth + 1} : null};
  })()`);
  assert.ok(
    result.scroll <= result.width + 1,
    label + ': horizontal overflow: ' + JSON.stringify(result),
  );
  assert.ok(result.headerHeight < result.height, label + ': header consumes the viewport.');
  assert.deepEqual(
    result.out,
    [],
    label + ': visible header/drawer controls must fit and be reachable.',
  );
  if (result.dialog)
    assert.ok(
      result.dialog.width <= result.width + 1 &&
        result.dialog.height <= result.height + 1 &&
        !result.dialog.overflow,
      label + ': navigation dialog overflows.',
    );
  layoutChecks++;
}
async function checkReducedMotion(label) {
  await settle();
  await pause(450);
  const result = await evaluate(`(() => ({
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    infinite: document.getAnimations().filter(a => a.playState === 'running' && a.playbackRate !== 0 && a.effect?.getTiming().iterations === Infinity).map(a => ({name: a.animationName || a.id, target: a.effect?.target?.tagName}))
  }))()`);
  assert.ok(result.reduce, 'Reduced-motion emulation unavailable.');
  assert.deepEqual(
    result.infinite,
    [],
    label + ': continuous CSS/Web Animations under reduced motion.',
  );
  const signature = `JSON.stringify([...document.querySelectorAll('main *, .site-header, footer *')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').map(e => { const s = getComputedStyle(e); return [s.transform, s.opacity, s.backgroundImage]; }))`;
  const first = await evaluate(signature);
  await pause(200);
  const second = await evaluate(signature);
  await pause(200);
  const third = await evaluate(signature);
  assert.ok(
    first === second && second === third,
    label +
      ': content keeps moving/changing under reduced motion (including JS-driven transforms).',
  );
}
async function menuOpen() {
  const toggle = '.site-header .mobile-menu-toggle[aria-label="Open navigation"]';
  assert.ok(
    await evaluate(`(${visibleFunction})(document.querySelector(${JSON.stringify(toggle)}))`),
    'Mobile navigation toggle must be visible and labelled Open navigation.',
  );
  await click(toggle);
  await waitFor(
    `document.querySelector('dialog[aria-label="Main navigation"]')?.open && document.querySelector('dialog[aria-label="Main navigation"]').contains(document.activeElement)`,
    'native mobile dialog opens and receives focus',
  );
  assert.equal(
    await evaluate(
      `document.querySelector('dialog[aria-label="Main navigation"]').matches(':modal')`,
    ),
    true,
    'Navigation must use native showModal().',
  );
  assert.equal(
    await evaluate(`document.querySelector('.mobile-menu-toggle').getAttribute('aria-expanded')`),
    'true',
  );
  await waitFor(
    `Boolean(document.querySelector('dialog[open] button[aria-label="Close navigation"]'))`,
  );
}
async function menuAndNavigation() {
  phase = 'mobile navigation';
  await viewport(375, 812);
  await navigate('/');
  await menuOpen();
  await axeCheck('mobile navigation dialog 375x812');
  const focusableCount = await evaluate(
    `document.querySelectorAll('dialog[open] a[href], dialog[open] button, dialog[open] input, dialog[open] [tabindex="0"]').length`,
  );
  for (let i = 0; i < focusableCount + 2; i++) {
    await key('Tab', 'Tab', 9);
    assert.equal(
      await evaluate(
        `!document.hasFocus() || document.querySelector('dialog[open]').contains(document.activeElement)`,
      ),
      true,
      'Tab reached background page content outside modal navigation.',
    );
  }
  await key('Tab', 'Tab', 9, 8);
  assert.equal(
    await evaluate(
      `!document.hasFocus() || document.querySelector('dialog[open]').contains(document.activeElement)`,
    ),
    true,
    'Shift+Tab reached background page content outside modal navigation.',
  );
  await key('Escape', 'Escape', 27);
  await waitFor(
    `!document.querySelector('dialog[open]') && document.activeElement === document.querySelector('.mobile-menu-toggle')`,
    'Escape closes drawer and restores opener focus',
  );
  assert.equal(
    await evaluate(`document.querySelector('.mobile-menu-toggle').getAttribute('aria-expanded')`),
    'false',
  );
  await menuOpen();
  await click('dialog[open] button[aria-label="Close navigation"]');
  await waitFor(
    `!document.querySelector('dialog[open]') && document.activeElement === document.querySelector('.mobile-menu-toggle')`,
    'Close navigation restores focus',
  );
  await menuOpen();
  const menuLink = await evaluate(`(() => {
    const links = [...document.querySelectorAll('dialog[open] a[href]')];
    const i = links.findIndex(a => a.origin === location.origin && a.pathname !== '/' && !a.hash);
    return i < 0 ? null : {index: i, pathname: links[i].pathname};
  })()`);
  assert.ok(menuLink && routes.includes(menuLink.pathname), 'Drawer needs a real local page link.');
  const token = await evaluate('window.__websiteSmokeDocument');
  await click('dialog[open] a[href]', menuLink.index);
  await waitFor(
    `location.pathname === ${JSON.stringify(menuLink.pathname)} && !document.querySelector('dialog[open]') && document.activeElement === document.querySelector('main#main-content')`,
    'navigation closes drawer and focuses main',
  );
  assert.equal(
    await evaluate('window.__websiteSmokeDocument'),
    token,
    'Internal navigation should use the website router without a full page load.',
  );
  const history = await send('Page.getNavigationHistory');
  assert.ok(history.currentIndex > 0, 'Browser back entry missing.');
  await send('Page.navigateToHistoryEntry', {
    entryId: history.entries[history.currentIndex - 1].id,
  });
  await waitFor(
    `location.pathname === '/' && Boolean(document.querySelector('main#main-content h1')) && !document.querySelector('dialog[open]')`,
    'browser back restores homepage',
  );
  await viewport(1440, 1000);
  const navLink = await evaluate(`(() => {
    const links = [...document.querySelectorAll('.site-header nav a[href]')];
    const i = links.findIndex(a => (${visibleFunction})(a) && a.origin === location.origin && a.pathname !== '/' && !a.hash);
    return i < 0 ? null : {index: i, pathname: links[i].pathname};
  })()`);
  assert.ok(
    navLink && routes.includes(navLink.pathname),
    'Desktop header needs a visible local navigation anchor.',
  );
  await click('.site-header nav a[href]', navLink.index);
  await waitFor(
    `location.pathname === ${JSON.stringify(navLink.pathname)} && document.activeElement === document.querySelector('main#main-content')`,
    'desktop route navigation focuses main',
  );
  for (const [width, height] of [
    [320, 568],
    [375, 480],
    [768, 320],
  ]) {
    await viewport(width, height);
    if (await evaluate(`(${visibleFunction})(document.querySelector('.mobile-menu-toggle'))`)) {
      await menuOpen();
      await settle();
      await checkLayout('open menu ' + width + 'x' + height);
      await key('Escape', 'Escape', 27);
      await waitFor(`!document.querySelector('dialog[open]')`);
    }
  }
  await assertClean();
}
async function faqChecks() {
  phase = 'FAQ and optional local search';
  await viewport(390, 844);
  await navigate('/help');
  const summary = 'main details > summary';
  assert.ok(
    await evaluate(`document.querySelectorAll(${JSON.stringify(summary)}).length > 0`),
    'Help must contain native details/summary FAQs.',
  );
  if (await evaluate(`document.querySelector(${JSON.stringify(summary)}).parentElement.open`))
    await click(summary);
  await evaluate(`document.querySelector(${JSON.stringify(summary)}).focus()`);
  await key('Enter', 'Enter', 13);
  await waitFor(
    `document.querySelector(${JSON.stringify(summary)}).parentElement.open`,
    'FAQ opens with keyboard',
  );
  assert.ok(
    await evaluate(
      `(() => { const d = document.querySelector(${JSON.stringify(summary)}).parentElement; return d.innerText.trim().length > d.querySelector('summary').innerText.trim().length; })()`,
    ),
    'Expanded FAQ needs a real answer.',
  );
  await key('Enter', 'Enter', 13);
  await waitFor(
    `!document.querySelector(${JSON.stringify(summary)}).parentElement.open`,
    'FAQ closes with keyboard',
  );
  const searchSelector = 'input.faq-search, .faq-search input, .help-search input';
  if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(searchSelector)}))`)) {
    const label = await evaluate(
      `(() => { const e = document.querySelector(${JSON.stringify(searchSelector)}); return e.getAttribute('aria-label') || (e.getAttribute('aria-labelledby') || '').split(/\\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ').trim() || [...e.labels].map(l => l.textContent.trim()).join(' '); })()`,
    );
    assert.equal(
      label,
      'Search help',
      'Optional FAQ search must have the accessible name Search help.',
    );
    const visibleSummaries = `([...document.querySelectorAll('main details > summary')].filter(${visibleFunction}))`;
    const initial = await evaluate(`${visibleSummaries}.map(e => e.textContent.trim())`);
    assert.ok(initial.length >= 2, 'FAQ search needs multiple questions to prove filtering.');
    async function search(value) {
      await evaluate(
        `(() => { const e = document.querySelector(${JSON.stringify(searchSelector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(value)}); e.dispatchEvent(new Event('input', {bubbles: true})); e.dispatchEvent(new Event('change', {bubbles: true})); })()`,
      );
    }
    await search(initial[0]);
    await waitFor(
      `${visibleSummaries}.some(e => e.textContent.trim() === ${JSON.stringify(initial[0])}) && ${visibleSummaries}.length < ${initial.length}`,
      'search filters FAQ questions',
    );
    await search('__website_smoke_no_matching_question_7f21__');
    await waitFor(
      `${visibleSummaries}.length === 0`,
      'unmatched FAQ query hides nonmatching answers',
    );
    await search('');
    await waitFor(
      `${visibleSummaries}.length === ${initial.length}`,
      'clearing search restores FAQs',
    );
  }
  await assertClean();
}

try {
  await access(chromeBinary);
  await access(previewModule);
  try {
    axeSource = await readFile(path.join(root, 'node_modules/axe-core/axe.min.js'), 'utf8');
  } catch (error) {
    throw new Error(
      "axe-core is required in this website's node_modules. Add/install the approved dev dependency before running; this script does not install it. " +
        error.message,
      { cause: error },
    );
  }
  for (const route of routes) {
    const candidates =
      route === '/'
        ? [path.join(dist, 'index.html')]
        : [
            path.join(dist, route.slice(1), 'index.html'),
            path.join(dist, route.slice(1) + '.html'),
          ];
    let html;
    for (const candidate of candidates) {
      try {
        html = await readFile(candidate, 'utf8');
        break;
      } catch (error) {
        if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
      }
    }
    assert.ok(html, 'Missing built static HTML for ' + route + '. Run npm run build first.');
    assert.match(
      html,
      /<main\b[^>]*\bid=["']main-content["']/i,
      route + ': initial HTML must include main#main-content.',
    );
    assert.match(
      html,
      /<h1\b[^>]*>[\s\S]*?\S[\s\S]*?<\/h1>/i,
      route + ': initial HTML must include page content, not an empty SPA shell.',
    );
  }
  assert.match(
    await readFile(path.join(dist, '404.html'), 'utf8'),
    /<main\b/i,
    'Build must include a useful standalone 404.html.',
  );
  const factory = (await import(pathToFileURL(previewModule).href)).createPreviewServer;
  assert.equal(
    typeof factory,
    'function',
    'scripts/preview.mjs must export createPreviewServer({root}).',
  );
  preview = await factory({ root: dist });
  await listen(preview);
  origin = 'http://127.0.0.1:' + preview.address().port;
  // This deny-only proxy has no upstream implementation. It catches browser-process
  // traffic/workers too, before any remote connection, independently of page CDP.
  denyProxy = createServer((_request, response) =>
    response
      .writeHead(403, { 'Content-Type': 'text/plain' })
      .end('External traffic disabled by website smoke test'),
  );
  // Chrome may reset denied background connections; these are expected proxy noise.
  denyProxy.on('connection', (connection) => connection.on('error', () => {}));
  denyProxy.on('connect', (_request, connection) =>
    connection.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'),
  );
  await listen(denyProxy);
  profile = await mkdtemp(path.join(tmpdir(), 'pour-website-smoke-'));
  chrome = spawn(
    chromeBinary,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync',
      '--disable-quic',
      '--disable-domain-reliability',
      '--disable-features=MediaRouter,OptimizationHints,Prerender2',
      '--proxy-server=http://127.0.0.1:' + denyProxy.address().port,
      '--proxy-bypass-list=<-loopback>;127.0.0.1:' + preview.address().port,
      '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
      '--remote-debugging-address=127.0.0.1',
      '--remote-debugging-port=0',
      '--user-data-dir=' + profile,
      '--window-size=1440,1000',
      'about:blank',
    ],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
  );
  const endpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Chrome startup timed out: ' + chromeStderr.slice(-1200))),
      20000,
    );
    chrome.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    chrome.once('exit', (code, signal) => {
      clearTimeout(timeout);
      reject(new Error('Chrome exited before startup: ' + code + '/' + signal));
    });
    chrome.stderr.on('data', (data) => {
      chromeStderr = (chromeStderr + data.toString()).slice(-8000);
      const match = chromeStderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
  });
  assert.equal(new URL(endpoint).hostname, '127.0.0.1');
  const pages = await jsonLocal('http://' + new URL(endpoint).host + '/json/list');
  const page = pages.find(
    (candidate) => candidate.type === 'page' && candidate.url === 'about:blank',
  );
  assert.ok(page?.webSocketDebuggerUrl, 'Chrome page target not found.');
  assert.equal(new URL(page.webSocketDebuggerUrl).hostname, '127.0.0.1');
  socket = new WebSocket(page.webSocketDebuggerUrl);
  socket.addEventListener('message', onMessage);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Chrome WebSocket startup timed out')),
      10000,
    );
    socket.addEventListener(
      'open',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
    socket.addEventListener(
      'error',
      () => {
        clearTimeout(timeout);
        reject(new Error('Chrome WebSocket failed'));
      },
      { once: true },
    );
  });
  socket.addEventListener('close', () => {
    for (const item of pending.values()) {
      clearTimeout(item.timeout);
      item.reject(new Error('Chrome connection closed'));
    }
    pending.clear();
  });
  for (const domain of ['Runtime', 'Page', 'Network', 'Log']) await send(domain + '.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Network.setBypassServiceWorker', { bypass: true });
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    window.__websiteSmokeDocument = Math.random().toString(36) + Date.now();
    window.__websiteSmokeForbidden = [];
    document.addEventListener('submit', event => {
      event.preventDefault(); event.stopImmediatePropagation(); window.__websiteSmokeForbidden.push('Form submission prevented');
    }, true);
    document.addEventListener('click', event => {
      const a = event.target.closest?.('a[href]');
      if (a && new URL(a.href).origin !== location.origin) {
        event.preventDefault(); event.stopImmediatePropagation(); window.__websiteSmokeForbidden.push('External anchor activation prevented');
      }
    }, true);
    window.open = () => { window.__websiteSmokeForbidden.push('window.open prevented'); return null; };
    HTMLFormElement.prototype.submit = function () { window.__websiteSmokeForbidden.push('Programmatic form submission prevented'); };
  `,
  });
  const titles = new Set();
  for (const route of process.env.POUR_WEBSITE_INTERACTIONS_ONLY === '1' ? [] : routes) {
    phase = 'route ' + route;
    console.log('CHECK ' + phase);
    const response = await localGet(route);
    assert.equal(
      response.status,
      200,
      route + ': direct request must return 200 without redirect.',
    );
    assert.match(response.headers['content-type'] || '', /text\/html/i);
    assert.match(
      response.body,
      /<main\b[^>]*\bid=["']main-content["']/i,
      route + ': preview must serve route HTML.',
    );
    const title = normalized(response.body.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
    assert.ok(
      title && !titles.has(title),
      route + ': initial titles must be meaningful and unique.',
    );
    titles.add(title);
    assert.ok(title.includes('PourXpress'), route + ': preferred name in initial HTML title.');
    const initialData = [
      ...response.body.matchAll(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
      ),
    ].map((match) => JSON.parse(match[1]));
    assert.equal(
      initialData.filter((node) => node['@type'] === 'WebSite').length,
      route === '/' ? 1 : 0,
      route + ': initial HTML site-name schema.',
    );
    await viewport(1440, 1000);
    await navigate(route);
    await loadPageImages();
    await inspectPage(route);
    await navigate(route, true);
    await loadPageImages();
    await inspectPage(route);
    if (route === '/') await screenshot('home-desktop');
    for (const width of widths) {
      await viewport(width, width < 768 ? 812 : 1000);
      await checkLayout(route + ' ' + width);
      if (route === '/' && width === 375) await screenshot('home-mobile');
      if (width === 375 || width === 1440) await axeCheck(route + ' ' + width);
    }
    for (const [width, height] of shortViewports) {
      await viewport(width, height);
      await checkLayout(route + ' ' + width + 'x' + height);
    }
    await checkReducedMotion(route);
    if (['/', '/app', '/riders', '/merchants/pricing'].includes(route)) {
      await viewport(1440, 1000);
      await screenshot(
        { '/': 'home-desktop', '/app': 'app', '/riders': 'rider', '/merchants/pricing': 'pricing' }[
          route
        ],
      );
      if (route === '/') {
        await viewport(375, 812);
        await screenshot('home-mobile');
      }
    }
    await assertClean();
    routeChecks++;
  }
  phase = '404 and missing assets';
  for (const missing of [
    '/__website_smoke_missing_page_7f21__',
    '/__website_smoke_missing_page_7f21__/nested',
  ]) {
    const response = await localGet(missing);
    assert.equal(response.status, 404, missing + ': unknown route must return real HTTP 404.');
    assert.match(response.body, /<main\b/i, '404 page must contain useful page content.');
  }
  for (const missing of [
    '/assets/__website_smoke_missing_7f21__.js',
    '/assets/__website_smoke_missing_7f21__.png',
  ]) {
    const response = await localGet(missing, '*/*');
    assert.equal(response.status, 404, missing + ': missing assets must return 404.');
    assert.ok(
      !/<(?:!doctype|html|main)\b/i.test(response.body),
      missing + ': missing assets must not receive HTML fallback.',
    );
  }
  const direct404 = await localGet('/404.html');
  assert.ok([200, 404].includes(direct404.status), 'Standalone 404.html must be served.');
  // HTTP errors above are exercised by Node, keeping expected 404s out of the browser's asset-error log.
  await menuAndNavigation();
  await faqChecks();
  await assertClean();
  console.log(
    'PASS: ' +
      routeChecks +
      ' static routes and direct refreshes; real 404s/missing assets; ' +
      layoutChecks +
      ' responsive/short-height checks; ' +
      axeChecks +
      ' axe WCAG scans with zero violations (manual review still required); modal Escape/close/focus/navigation, browser back, main focus, native FAQ and optional search; approved links, shared Play URL, honest iOS status, preserved policies and approved fee schedule; reduced motion; no runtime/hydration/asset failures, external requests or submissions.',
  );
  if (screenshotDirectory)
    console.log('PNG screenshots: ' + screenshotCount + ' in ' + screenshotDirectory);
  if (warnings.length)
    console.log('Nonfatal browser warnings: ' + JSON.stringify(warnings.slice(0, 8)));
  if (accessibilityIncomplete.length)
    console.log(
      'AXE MANUAL REVIEW (incomplete checks): ' + JSON.stringify(accessibilityIncomplete, null, 2),
    );
} catch (error) {
  process.exitCode = 1;
  console.error('FAIL [' + phase + ']: ' + (error.stack || error));
  if (/Chrome (?:connection|startup|WebSocket)|CDP timeout/i.test(error.message))
    console.error('Chrome diagnostics: ' + chromeStderr.slice(-2500));
  for (const [name, items] of Object.entries({
    runtimeErrors,
    consoleErrors,
    assetFailures,
    violations,
    accessibilityViolations,
  })) {
    if (items.length) console.error(name + ': ' + JSON.stringify(items.slice(0, 40), null, 2));
  }
} finally {
  closing = true;
  await Promise.allSettled([...interceptionTasks]);
  socket?.close();
  for (const item of pending.values()) {
    clearTimeout(item.timeout);
    item.reject(new Error('Smoke test ending'));
  }
  pending.clear();
  if (chrome && chrome.exitCode === null) {
    const exited = new Promise((resolve) => chrome.once('exit', resolve));
    chrome.kill();
    await Promise.race([exited, pause(3000)]);
  }
  for (const server of [preview, denyProxy]) {
    if (!server?.listening) continue;
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
  if (profile) {
    const resolved = path.resolve(profile);
    if (
      path.dirname(resolved) === path.resolve(tmpdir()) &&
      path.basename(resolved).startsWith('pour-website-smoke-')
    ) {
      await rm(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(
        () => console.warn('Temporary browser profile retained: ' + resolved),
      );
    }
  }
}
