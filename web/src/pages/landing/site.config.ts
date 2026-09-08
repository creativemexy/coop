// ============================================================
//  FENAC COOP — Corporate Website Content
//  Edit these values to reflect your cooperative's real details.
// ============================================================

export const site = {
  // Identity
  name: 'FENAC COOP',
  shortName: 'FENAC',
  tagline: 'Building Wealth Together.',
  description:
    'A Digital Smart Cooperative Financial Institution strengthening associations and communities through shared ownership, smart technology, and collective strength.',
  logoEmoji: '🤝',
  logoPath: '/logo.jpg',

  // Hero image — replace with your own photo/illustration (absolute path or URL)
  heroImage: '/hero-placeholder.svg',
  heroImageAlt: 'Members of the cooperative working together',

  // Contact details — replace with real values
  email: 'hello@fenacoop.org',
  phone: '+234 800 000 0000',
  whatsapp: '+234 800 000 0000',
  address: 'Plot 7, Nyala Close, Wuse, Zone 6, Abuja, Nigeria',
  hours: 'Mon – Fri, 8:00am – 5:00pm WAT',
  social: {
    facebook: '#',
    instagram: '#',
    twitter: '#',
    linkedin: '#',
  },

  // Hero stats
  stats: [
    { value: '10,000+', label: 'Active Members' },
    { value: '₦2.4B', label: 'Savings Pool' },
    { value: '35', label: 'Partner Organizations' },
    { value: '98%', label: 'Member Satisfaction' },
  ],

  // Services summary cards
  services: [
    {
      title: 'Savings',
      description:
        'Grow your money safely with flexible savings plans, fixed deposits, and target-based saving goals.',
      icon: '💰',
    },
    {
      title: 'Buy Now, Pay Later',
      description:
        'Shop essentials today and spread the cost into manageable installments — no hidden fees.',
      icon: '🛍️',
    },
    {
      title: 'Investment Opportunities',
      description:
        'Access curated, cooperative-backed investment products designed for steady, member-first returns.',
      icon: '📈',
    },
    {
      title: 'Low-Interest Loans',
      description:
        'Borrow at member-friendly rates with transparent terms, when you need a helping hand.',
      icon: '🤝',
    },
  ],

  // How it works steps
  steps: [
    { title: 'Join the Cooperative', description: 'Create your account and pay a one-time membership fee.' },
    { title: 'Complete Verification', description: 'Confirm your identity with a quick, secure KYC process.' },
    { title: 'Save & Access Services', description: 'Start saving and unlock BNPL, investments, and loans.' },
  ],

  // Values
  values: [
    { title: 'Member-Owned', description: 'Every member has a voice in how we grow.' },
    { title: 'Transparency', description: 'Clear terms, honest pricing, no surprises.' },
    { title: 'Financial Inclusion', description: 'Accessible finance for every community.' },
    { title: 'Trust & Security', description: 'Bank-grade security protects your money and data.' },
  ],

  // Hero glassmorphism feature cards
  heroCards: [
    { title: 'Secure Savings', description: 'Safeguard your money with flexible plans built for steady growth.', icon: '🔒' },
    { title: 'Investment Opportunities', description: 'Access curated, cooperative-backed products with member-first returns.', icon: '📈' },
    { title: 'Business Loans', description: 'Affordable financing at member-friendly rates to grow your business.', icon: '🏦' },
    { title: 'Member Benefits', description: 'Enjoy rewards, community support, and a voice in how we grow.', icon: '🎁' },
  ],
}

export const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Services', path: '/services' },
  { label: 'Membership', path: '/membership' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Contact', path: '/contact' },
]
