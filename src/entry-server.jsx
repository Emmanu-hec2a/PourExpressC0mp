import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App.jsx';
import { pages, getPage, normalizePathname, notFoundPage } from './config/routes.js';
import { site } from './config/site.js';
import { renderHead } from './lib/metadata.js';

// Node imports these through the compiled SSR entry, never through source JSX.
export { pages, site };

export function render(pathname) {
  const location = normalizePathname(pathname);
  const page = getPage(location) ?? notFoundPage;

  return {
    html: renderToString(
      <StaticRouter location={location}>
        <App />
      </StaticRouter>,
    ),
    head: renderHead(page),
  };
}
