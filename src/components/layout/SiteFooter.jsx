import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { site } from '../../config/site.js';
import { pages } from '../../config/routes.js';
import { footerGroups } from '../../content/navigation.js';
import { Brand } from './SiteHeader.jsx';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Brand light />
            <p>
              Local stores. Connected.
              <br />
              Made for customers, merchants and riders.
            </p>
            <a href={'mailto:' + site.supportEmail}>
              {site.supportEmail}
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
          {footerGroups.map((group) => (
            <nav key={group.label} aria-label={group.label}>
              <h2>{group.label}</h2>
              {group.links
                .filter(([, to]) => pages.some((page) => page.path === to))
                .map(([label, to]) => (
                  <Link key={to} to={to}>
                    {label}
                  </Link>
                ))}
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <p>
            © {site.year} {site.name}. All rights reserved.
          </p>
          <p>For adults only. Please drink responsibly.</p>
          <span>Android available · iOS coming soon</span>
        </div>
      </div>
    </footer>
  );
}
