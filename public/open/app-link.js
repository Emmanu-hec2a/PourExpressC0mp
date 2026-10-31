import { androidIntentFor, parseAppLink } from './app-link-target.js';

const target = parseAppLink(window.location.pathname + window.location.search + window.location.hash);
const button = document.getElementById('open-app');
const message = document.getElementById('link-status');
if (target && /Android/i.test(navigator.userAgent)) {
  // A real user click only: no redirect timer, automatic app launch, or install detection.
  button.href = androidIntentFor(target.path);
  button.hidden = false;
} else if (!target) {
  message.textContent = 'This app link is not valid. Open PourXpress directly, or contact support for help.';
}
document.getElementById('copyright-year').textContent = String(new Date().getFullYear());
