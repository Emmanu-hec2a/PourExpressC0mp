// Explicit production command only. Never invoked by the build or tests.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyBuild, verifyLive, websiteRoot } from './verify-app-links.mjs';

export function requireDeploymentRuntime(version = process.versions.node) {
  const [major, minor] = version.split('.').map(Number);
  assert.ok(major > 22 || (major === 22 && minor >= 12),
    'Production deployment needs Node 22.12+ (or a newer compatible release). No deployment was attempted.');
}

export async function deployWebsite({ built = false } = {}) {
  requireDeploymentRuntime();
  assert.notEqual(process.env.SITE_PREVIEW, '1', 'Clear SITE_PREVIEW before production deployment.');
  const npmCli = process.env.npm_execpath;
  assert.ok(npmCli && existsSync(npmCli), 'Run via npm run deploy.');
  const wrangler = resolve(websiteRoot, 'node_modules/wrangler/bin/wrangler.js');
  assert.ok(existsSync(wrangler), 'Install the locked dependencies first. No package is downloaded automatically.');
  function run(args) {
    const result = spawnSync(process.execPath, args, {
      cwd: websiteRoot, stdio: 'inherit', windowsHide: true,
      // Do not unexpectedly open an OAuth browser or prompt in a deployment run.
      env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' },
    });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, 'Command failed; remaining deployment steps were not run.');
  }
  if (!built) run([npmCli, 'run', 'build']);
  run([npmCli, 'test']);
  await verifyBuild({ production: true });
  // Preserve the existing Worker name/config. No DNS or new hosting is created.
  run([wrangler, 'deploy', '--config', resolve(websiteRoot, 'wrangler.json')]);
  await verifyLive();
  console.log('Website published and public app-link endpoints verified. Android release/device verification remains separate.');
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const flags = process.argv.slice(2);
    assert.ok(flags.length === 0 || (flags.length === 1 && flags[0] === '--built'),
      'Usage: npm run deploy or npm run deploy:ci');
    await deployWebsite({ built: flags[0] === '--built' });
  }
  catch (error) {
    console.error('Website release failed: ' + error.message);
    process.exitCode = 1;
  }
}
