import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { site } from '../src/config/site.js';

const target = new URL(site.android.storeUrl);
assert.equal(target.protocol, 'https:');
assert.equal(target.hostname, 'play.google.com');
assert.equal(target.pathname, '/store/apps/details');
assert.equal(target.searchParams.get('id'), site.android.packageName);
const output = new URL('../public/images/android-download-qr.svg', import.meta.url);
await mkdir(new URL('./', output), { recursive: true });
await QRCode.toFile(fileURLToPath(output), site.android.storeUrl, {
  type: 'svg',
  width: 190,
  margin: 4,
  errorCorrectionLevel: 'M',
  color: { dark: '#0d3b30', light: '#ffffff' },
});
console.log('Generated local Google Play QR for ' + site.android.packageName);
