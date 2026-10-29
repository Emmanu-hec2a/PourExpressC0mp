import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { getPage } from '../../config/routes.js';
import { updateMetadata } from '../../lib/metadata.js';
import { SiteHeader } from './SiteHeader.jsx';
import { SiteFooter } from './SiteFooter.jsx';

export function SiteLayout() {
  const location = useLocation();
  const type = useNavigationType();
  const previous = useRef(null);
  const scrollPositions = useRef(new Map());
  useEffect(() => {
    const previousMode = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previousMode;
    };
  }, []);
  useEffect(() => {
    updateMetadata(getPage(location.pathname));
    const wasNavigation = previous.current !== null && previous.current !== location.key;
    if (previous.current) scrollPositions.current.set(previous.current, window.scrollY);
    previous.current = location.key;
    if (wasNavigation) document.getElementById('main-content')?.focus({ preventScroll: true });
    const frame = requestAnimationFrame(() => {
      let anchor = null;
      try {
        anchor = location.hash
          ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
          : null;
      } catch {
        /* Invalid URL fragments must not break navigation. */
      }
      if (anchor) anchor.scrollIntoView();
      else if (wasNavigation)
        window.scrollTo({
          top: type === 'POP' ? scrollPositions.current.get(location.key) || 0 : 0,
          behavior: 'instant',
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.pathname, location.hash, type]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
