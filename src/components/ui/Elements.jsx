import { ArrowRight, ArrowUpRight, Download, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { site, media } from '../../config/site.js';

export function ButtonLink({
  to,
  href,
  children,
  variant = 'primary',
  className = '',
  arrow = true,
  ...props
}) {
  const Component = href ? 'a' : Link;
  const target = href ? { href } : { to };
  return (
    <Component {...target} {...props} className={'button button--' + variant + ' ' + className}>
      {children}
      {arrow && <ArrowRight size={17} aria-hidden="true" />}
    </Component>
  );
}

export function Eyebrow({ children, light = false }) {
  return (
    <p className={'eyebrow' + (light ? ' eyebrow--light' : '')}>
      <span aria-hidden="true" />
      {children}
    </p>
  );
}

export function SectionHeading({ eyebrow, title, children, center = false }) {
  return (
    <div className={'section-heading' + (center ? ' section-heading--center' : '')}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2>{title}</h2>
      {children && <p className="lede">{children}</p>}
    </div>
  );
}

export function AppDownloadBlock({ compact = false, light = false }) {
  return (
    <div
      className={
        'app-download' +
        (compact ? ' app-download--compact' : '') +
        (light ? ' app-download--light' : '')
      }
    >
      <a
        className="play-download"
        href={site.android.storeUrl}
        data-download="android"
      >
        <Download size={21} aria-hidden="true" />
        <span>
          <small>Available on Android</small>
          <strong>Get it on Google Play</strong>
        </span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </a>
      <div className="ios-status">
        <span className="ios-symbol" aria-hidden="true">
          iOS
        </span>
        <span>
          App Store <strong>Coming soon</strong>
        </span>
      </div>
    </div>
  );
}

export function Screenshot({ kind = 'home', caption, eager = false, className = '' }) {
  const descriptions = {
    home: 'PourXpress customer app showing product discovery and Shiriki Pay.',
    stores: 'PourXpress app showing nearby stores. Example store content.',
    tracking: 'Customer delivery milestones, with transaction and location details redacted.',
    rider: 'Rider navigation preview, with route and transaction details redacted.',
  };
  return (
    <figure className={'screenshot screenshot--' + kind + ' ' + className}>
      <div className="screenshot-crop">
        <img
          src={media[kind]}
          alt={descriptions[kind]}
          width="678"
          height="1357"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
        />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function DownloadSection() {
  return (
    <section className="download-section">
      <div className="container download-section__inner">
        <div>
          <Eyebrow light>Your next order starts here</Eyebrow>
          <h2>
            A little closer to
            <br />
            your favourites.
          </h2>
          <p>
            Discover PourXpress on Android.
            <br />
            App Store coming soon.
          </p>
        </div>
        <div>
          <AppDownloadBlock light />
          <Link className="text-link text-link--light" to="/app">
            Take a look at the app <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PageIntro({ eyebrow, title, children, actions }) {
  return (
    <section className="page-intro">
      <div className="container">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p className="lede">{children}</p>
        {actions && <div className="page-intro__actions">{actions}</div>}
      </div>
    </section>
  );
}

export function ContactLink({ children = 'Email our team', subject }) {
  return (
    <a
      className="button button--primary"
      href={
        'mailto:' + site.supportEmail + (subject ? '?subject=' + encodeURIComponent(subject) : '')
      }
    >
      <Mail size={18} aria-hidden="true" />
      {children}
      <ArrowUpRight size={16} aria-hidden="true" />
    </a>
  );
}

export function OfficialPlayBadge() {
  return (
    <a
      className="official-play-badge"
      href={site.android.storeUrl}
      data-download="android"
    >
      <img
        src="/images/google-play-badge.png"
        alt="Get it on Google Play"
        width="646"
        height="250"
        loading="lazy"
      />
    </a>
  );
}
