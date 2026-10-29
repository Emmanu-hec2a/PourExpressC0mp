import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { navigation } from '../../content/navigation.js';
import { site } from '../../config/site.js';

export function Brand({ light = false }) {
  return (
    <Link
      to="/"
      aria-label={site.name + ' home'}
      className={'brand' + (light ? ' brand--light' : '')}
    >
      <img src="/images/brand-logo.png" width="70" height="42" alt="" />
      <span>
        {site.name}
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const dialog = useRef(null);
  const opener = useRef(null);
  const restoreOpener = useRef(true);
  const previousOverflow = useRef(null);
  const unlockScroll = () => {
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
  };
  const openMenu = () => {
    restoreOpener.current = true;
    if (!dialog.current.open) {
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.current.showModal();
    }
    setOpen(true);
  };
  const close = (restore = true) => {
    restoreOpener.current = restore;
    dialog.current?.close();
    unlockScroll();
    setOpen(false);
  };
  useEffect(() => {
    const node = dialog.current;
    return () => {
      if (node.open) node.close();
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current;
        previousOverflow.current = null;
      }
    };
  }, []);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-navigation" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="header-download" to="/app">
            Get the app <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <button
            ref={opener}
            type="button"
            className="mobile-menu-toggle"
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={openMenu}
          >
            <Menu size={23} aria-hidden="true" />
          </button>
        </div>
        <dialog
          id="mobile-navigation"
          ref={dialog}
          aria-label="Main navigation"
          className="mobile-navigation"
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
          onClose={() => {
            // A close event from an earlier opening can arrive after reopening.
            if (dialog.current?.open) return;
            unlockScroll();
            setOpen(false);
            if (restoreOpener.current) opener.current?.focus();
          }}
          onClick={(event) => {
            if (event.target === dialog.current) {
              const box = dialog.current.getBoundingClientRect();
              if (
                event.clientX < box.left ||
                event.clientX > box.right ||
                event.clientY < box.top ||
                event.clientY > box.bottom
              )
                close();
            }
          }}
        >
          <div className="mobile-navigation__header">
            <span>Explore {site.name}</span>
            <button type="button" aria-label="Close navigation" onClick={() => close()}>
              <X size={24} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile navigation">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => close(false)}>
                {item.label}
                <ArrowUpRight size={19} aria-hidden="true" />
              </NavLink>
            ))}
          </nav>
          <Link to="/app" className="button button--primary" onClick={() => close(false)}>
            Get the Android app <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <p>
            Available on Google Play.
            <br />
            App Store coming soon.
          </p>
        </dialog>
      </div>
    </header>
  );
}
