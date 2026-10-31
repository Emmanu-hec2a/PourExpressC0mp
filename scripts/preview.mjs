import { realpathSync, statSync } from 'node:fs';
import { open, readdir, realpath } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const defaultRoot = fileURLToPath(new URL('../dist/', import.meta.url));
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
};

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function inside(root, filename) {
  const path = relative(root, filename);
  return !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`);
}

function decodePathname(target) {
  // URL() would normalize raw /../ segments before we could reject them.
  const raw = target.split('?')[0];
  let pathname;
  try {
    pathname = decodeURIComponent(raw);
  } catch {
    throw httpError(400, 'Malformed URL encoding');
  }
  if (
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    /[\\<>:"|?*#]/.test(pathname) ||
    [...pathname].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  ) {
    throw httpError(400, 'Invalid URL pathname');
  }
  if (
    pathname
      .split('/')
      .some(
        (segment) =>
          segment === '.' ||
          segment === '..' ||
          /[. ]$/.test(segment) ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment),
      )
  ) {
    throw httpError(403, 'Forbidden pathname');
  }
  return pathname;
}

function sendText(request, response, statusCode, text) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(request.method === 'HEAD' ? undefined : text);
}

async function findFile(root, filename) {
  if (!inside(root, filename)) throw httpError(403, 'Forbidden pathname');
  let actual;
  try {
    // Windows filesystems ignore case; React's caseSensitive routes do not.
    let directory = root;
    for (const segment of relative(root, filename).split(sep).filter(Boolean)) {
      if (!(await readdir(directory)).includes(segment)) return null;
      directory = resolve(directory, segment);
    }
    actual = await realpath(filename);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }
  if (!inside(root, actual)) throw httpError(403, 'Forbidden symlink target');
  let handle;
  try {
    handle = await open(actual, 'r');
    const information = await handle.stat();
    if (!information.isFile()) {
      await handle.close();
      return null;
    }
    return { handle, size: information.size, filename };
  } catch (error) {
    await handle?.close();
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR' || error.code === 'EISDIR') return null;
    throw error;
  }
}

async function sendFile(request, response, file, statusCode, headers = {}) {
  response.writeHead(statusCode, {
    'Content-Type': mimeTypes[extname(file.filename).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': file.size,
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  if (request.method === 'HEAD') {
    await file.handle.close();
    response.end();
  } else {
    // createReadStream closes its file handle, including on aborted requests.
    await pipeline(file.handle.createReadStream(), response);
  }
}

// root is the directory being served (normally the built dist), not the repo root.
export function createPreviewServer({ root = defaultRoot } = {}) {
  const distRoot = realpathSync(resolve(root));
  if (!statSync(distRoot).isDirectory()) throw new Error('Preview root must be a directory');

  async function handleRequest(request, response) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD');
      sendText(request, response, 405, 'Method not allowed\n');
      return;
    }
    const pathname = decodePathname(request.url ?? '/');
    // Mirror only the scoped app-link rules in public/_redirects and _headers.
    const headers = pathname.startsWith('/open/') ? {
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
    } : pathname === '/.well-known/assetlinks.json' ? {
      'Cache-Control': 'public, max-age=300',
    } : {};
    if (pathname.startsWith('/open/orders/')) {
      const fallback = await findFile(distRoot, resolve(distRoot, 'open/orders/index.html'));
      if (fallback) {
        await sendFile(request, response, fallback, 200, headers);
        return;
      }
    }
    const filename = resolve(distRoot, `.${pathname}`);
    const exact = pathname.endsWith('/') ? null : await findFile(distRoot, filename);
    const file = exact ?? (await findFile(distRoot, resolve(filename, 'index.html')));
    if (file) {
      await sendFile(request, response, file, 200, headers);
      return;
    }
    // An absent asset stays a plain 404; it never receives the homepage shell.
    if (!extname(pathname) || pathname.endsWith('/') || extname(pathname) === '.html') {
      const notFound = await findFile(distRoot, resolve(distRoot, '404.html'));
      if (notFound) {
        await sendFile(request, response, notFound, 404);
        return;
      }
    }
    sendText(request, response, 404, 'Not found\n');
  }

  return createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      if (response.destroyed) return;
      if (response.headersSent) {
        response.destroy();
        return;
      }
      const statusCode = error.statusCode ?? 500;
      sendText(
        request,
        response,
        statusCode,
        statusCode === 500 ? 'Internal server error\n' : `${error.message}\n`,
      );
    });
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      host: { type: 'string', default: '127.0.0.1' },
      port: { type: 'string', default: '4173' },
      root: { type: 'string', default: defaultRoot },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) {
    console.log('Usage: node scripts/preview.mjs [--host 127.0.0.1] [--port 4173] [--root dist]');
    return;
  }
  if (!/^\d+$/.test(values.port) || Number(values.port) > 65535) {
    throw new Error('--port must be an integer from 0 to 65535');
  }
  const server = createPreviewServer({ root: values.root });
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(Number(values.port), values.host, accept);
  });
  const address = server.address();
  const host = address.family === 'IPv6' ? `[${address.address}]` : address.address;
  console.log(`Static preview: http://${host}:${address.port}/`);
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      server.close();
      server.closeIdleConnections();
    });
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    await main();
  } catch (error) {
    console.error(`Preview failed: ${error.message}`);
    process.exitCode = 1;
  }
}
