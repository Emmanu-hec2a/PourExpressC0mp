export const site = Object.freeze({
  name: 'PourXpress',
  alternateNames: Object.freeze(['PourExpress']), // Recognized previous website spelling.
  origin: 'https://pourexpress.co.ke',
  description:
    'Local drinks stores, connected. Discover PourXpress for customers, merchants and riders in Kenya.',
  merchantUrl: 'https://merchants.pourexpress.co.ke',
  supportEmail: 'support@pourexpress.co.ke',
  whatsappUrl: 'https://wa.me/254718258821',
  phoneDisplay: '+254 718 258 821',
  year: 2026,
  android: Object.freeze({
    status: 'available',
    packageName: 'com.pourexpress.sip',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.pourexpress.sip',
  }),
  ios: Object.freeze({ status: 'coming_soon', storeUrl: null, releaseDate: null }),
});

// Owner-confirmed on 28 October 2026. Riders use the same published listing.
export const riderApp = site.android;

export const publication = Object.freeze({
  pricing: true,
  responsibleDelivery: true,
  accountDeletion: false, // Requires verification of the existing deletion process.
});

export const media = Object.freeze({
  home: '/images/customer-home.jpg',
  stores: '/images/customer-stores.jpg',
  tracking: '/images/customer-tracking-redacted.jpg',
  rider: '/images/rider-navigation-redacted.jpg',
});
