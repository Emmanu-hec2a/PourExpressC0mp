import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const headMarker = '<!--site-head-->';
const htmlMarker = '<!--site-html-->';
const notFoundPath = '/__static_not_found__';

function escapeXml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[character],
  );
}

function outputPath(pathname) {
  if (
    typeof pathname !== 'string' ||
    !pathname.startsWith('/') ||
    pathname.includes('//') ||
    /[%<>:"|?*\\]/.test(pathname) ||
    [...pathname].some((char) => char.charCodeAt(0) < 32)
  ) {
    throw new Error(`Expected a literal, absolute route pathname: ${pathname}`);
  }
  const segments = pathname.split('/').filter(Boolean);
  if (
    segments.some(
      (segment) =>
        segment === '.' ||
        segment === '..' ||
        /[. ]$/.test(segment) ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment),
    )
  ) {
    throw new Error(`Unsafe route pathname: ${pathname}`);
  }
  return [...segments, 'index.html'].join('/');
}

function withRobots(head, noindex) {
  // One authoritative robots tag, including when renderHead supplies its own.
  const cleanHead = head.replace(/<meta\b[^>]*>/gi, (tag) =>
    /\bname\s*=\s*(?:"robots"|'robots'|robots(?=[\s/>]))/i.test(tag) ? '' : tag,
  );
  return `${cleanHead}\n<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow'}">`;
}

function withEnvironment(template, preview) {
  if (!/<html\b[^>]*>/i.test(template))
    throw new Error('Built template must contain an opening html tag');
  return template.replace(/<html\b[^>]*>/i, (tag) => {
    const cleanTag = tag.replace(/\sdata-environment(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, '');
    return cleanTag.replace(/>$/, ` data-environment="${preview ? 'preview' : 'production'}">`);
  });
}

function documentHtml(template, result, noindex) {
  if (typeof result?.html !== 'string' || typeof result?.head !== 'string') {
    throw new Error('SSR render(pathname) must return { html: string, head: string }');
  }
  // Callback replacements preserve literal dollar signs in rendered content.
  return template
    .replace(headMarker, () => withRobots(result.head, noindex))
    .replace(htmlMarker, () => result.html);
}

async function writeOutput(distRoot, filename, content) {
  const destination = resolve(distRoot, filename);
  const within = relative(distRoot, destination);
  if (!within || isAbsolute(within) || within === '..' || within.startsWith(`..${sep}`)) {
    throw new Error(`Output escapes dist: ${filename}`);
  }

  // Walk parents before creating files; never follow an existing output symlink.
  let directory = distRoot;
  for (const segment of relative(distRoot, dirname(destination)).split(sep).filter(Boolean)) {
    directory = resolve(directory, segment);
    try {
      await mkdir(directory);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    const information = await lstat(directory);
    if (!information.isDirectory() || information.isSymbolicLink()) {
      throw new Error(`Output parent must be a real directory: ${directory}`);
    }
  }
  try {
    const information = await lstat(destination);
    if (!information.isFile() || information.isSymbolicLink()) {
      throw new Error(`Output must be a regular file: ${destination}`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await writeFile(destination, content, 'utf8');
}

export async function prerender({ root = projectRoot } = {}) {
  const preview = process.env.SITE_PREVIEW === '1';
  const distRoot = await realpath(resolve(root, 'dist'));
  const builtTemplate = await readFile(resolve(distRoot, 'index.html'), 'utf8');
  for (const marker of [headMarker, htmlMarker]) {
    if (builtTemplate.split(marker).length !== 2) {
      throw new Error(
        `Built dist/index.html must contain exactly one ${marker}; run vite build first`,
      );
    }
  }
  // The persistent document attribute lets client metadata retain preview noindex
  // across navigations. Production 404 pages retain the production environment.
  const template = withEnvironment(builtTemplate, preview);

  const { render, pages, site } = await import(
    pathToFileURL(resolve(root, '.prerender/entry-server.js')).href
  );
  if (typeof render !== 'function' || !Array.isArray(pages) || pages.length === 0) {
    throw new Error('Compiled SSR entry must export render(), nonempty pages[], and site');
  }
  const originUrl = new URL(site?.origin);
  if (
    !['http:', 'https:'].includes(originUrl.protocol) ||
    originUrl.username ||
    originUrl.password ||
    originUrl.pathname !== '/' ||
    originUrl.search ||
    originUrl.hash
  ) {
    throw new Error(
      'site.origin must be an absolute HTTP(S) origin without a path, query, or credentials',
    );
  }
  const origin = originUrl.origin;
  const seen = new Set();
  const routes = pages.map((page) => {
    const filename = outputPath(page.path);
    const pathname = page.path === '/' ? '/' : page.path.replace(/\/+$/, '');
    const key = filename.toLowerCase();
    if (seen.has(key) || pathname === notFoundPath) {
      throw new Error(`Duplicate or reserved route: ${page.path}`);
    }
    seen.add(key);
    return { pathname, filename };
  });
  if (!routes.some(({ pathname }) => pathname === '/')) {
    throw new Error('pages[] must include the homepage /');
  }

  // Render everything before replacing the template or writing any output.
  const outputs = [];
  for (const { pathname, filename } of routes) {
    outputs.push([filename, documentHtml(template, await render(pathname), preview)]);
  }
  outputs.push(['404.html', documentHtml(template, await render(notFoundPath), true)]);
  outputs.push([
    'sitemap.xml',
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      routes
        .map(({ pathname }) => `  <url><loc>${escapeXml(origin + pathname)}</loc></url>`)
        .join('\n') +
      '\n</urlset>\n',
  ]);
  outputs.push([
    'robots.txt',
    preview
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
  ]);

  for (const [filename, content] of outputs) await writeOutput(distRoot, filename, content);
  return { root: distRoot, pages: routes.length, preview };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  process.env.NODE_ENV = 'production';
  try {
    const result = await prerender();
    console.log(
      `Prerendered ${result.pages} pages and 404.html (${result.preview ? 'PREVIEW: noindex' : 'production: indexable'}).`,
    );
  } catch (error) {
    console.error(`Prerender failed: ${error.message}`);
    process.exitCode = 1;
  }
}
