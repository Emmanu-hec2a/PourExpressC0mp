import { publication } from './site.js';

export const pages = [
  {
    path: '/',
    title: 'PourXpress | Your local drinks stores, delivered',
    description:
      'Discover local drinks stores with PourXpress. Get the Android app on Google Play. App Store coming soon.',
    section: 'customers',
  },
  {
    path: '/app',
    title: 'Get the PourXpress app | Android available now',
    description:
      'Explore the PourXpress customer app, discover stores and follow your delivery. Download on Google Play. iOS coming soon.',
    section: 'customers',
  },
  {
    path: '/merchants',
    title: 'Grow with PourXpress | For merchants',
    description:
      'Bring your store to PourXpress. Explore merchant tools, plans and the existing merchant dashboard.',
    section: 'merchants',
  },
  ...(publication.pricing
    ? [
        {
          path: '/merchants/pricing',
          title: 'Merchant plans and pricing | PourXpress',
          description:
            'Compare PourXpress merchant plans: Free, Base, Pro and Enterprise, with clear monthly pricing and commission rates.',
          section: 'merchants',
        },
      ]
    : []),
  {
    path: '/riders',
    title: 'Deliver with PourXpress | For riders',
    description:
      'Explore the rider side of PourXpress, get the Android app and contact our team about getting started.',
    section: 'riders',
  },
  {
    path: '/help',
    title: 'Help and support | PourXpress',
    description:
      'Find answers about the PourXpress app, ordering, payments, delivery and support.',
    section: 'help',
  },
  {
    path: '/about',
    title: 'About PourXpress | Local stores, connected',
    description: 'Meet PourXpress: connecting customers, local merchants and riders in Kenya.',
    section: 'about',
  },
  {
    path: '/contact',
    title: 'Contact PourXpress | We are here to help',
    description:
      'Contact PourXpress support for customer, merchant and rider enquiries through our approved email and WhatsApp channels.',
    section: 'help',
  },
  ...(publication.responsibleDelivery
    ? [
        {
          path: '/responsible-delivery',
          title: 'Responsible delivery | PourXpress',
          description:
            'Read about responsible ordering, age and ID checks, and getting assistance with a PourXpress delivery.',
          section: 'help',
        },
      ]
    : []),
  {
    path: '/privacy',
    title: 'Privacy policy | PourXpress',
    description:
      'Read the PourXpress privacy policy and information about how the service uses data.',
  },
  {
    path: '/terms',
    title: 'Terms of service | PourXpress',
    description:
      'Read the PourXpress service terms, merchant obligations and confirmed plan and commission information.',
  },
];
export const notFoundPage = {
  path: null,
  title: 'Page not found | PourXpress',
  description: 'This page could not be found. Explore PourXpress or get help.',
};
export const normalizePathname = (pathname) =>
  pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
export const getPage = (pathname) =>
  pages.find((page) => page.path === normalizePathname(pathname)) || notFoundPage;
