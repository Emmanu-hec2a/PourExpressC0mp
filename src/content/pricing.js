// Prices and commissions explicitly reconfirmed by the owner, 28 October 2026.
// These are website copy, never production billing configuration.
export const plans = [
  {
    name: 'Free',
    monthly: '0',
    commission: '10%',
    description: 'A starting point for your store.',
    action: 'Explore Free',
  },
  {
    name: 'Base',
    monthly: '3,000',
    commission: '8%',
    description: 'A monthly plan for your next step.',
    action: 'Explore Base',
  },
  {
    name: 'Pro',
    monthly: '5,000',
    commission: '5%',
    description: 'A lower commission as you grow.',
    action: 'Explore Pro',
    featured: true,
  },
  {
    name: 'Enterprise',
    monthly: null,
    commission: 'Negotiable',
    description: 'Discuss the needs of your business.',
    action: 'Contact our team',
  },
];
