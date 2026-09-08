import { LegalPage } from './LegalPage'

const sections = [
  {
    title: '1. What are cookies?',
    body: 'Cookies are small text files placed on your device by a website. They can store preferences, keep you signed in, and enable security features. Some cookies are set by third parties (e.g. advertising or analytics companies) and can be used to build a profile of your browsing. We believe in being transparent about exactly what we use.',
  },
  {
    title: '2. Cookies and storage we use',
    body: 'The FENAC COOP website sets no advertising, analytics, or marketing cookies. The only cookies and browser storage currently used are listed below:',
    items: [
      'csrf-secret — strictly necessary security cookie set by our API to protect you from cross-site request forgery (CSRF) attacks. It is HTTP-only, SameSite=Strict, and contains no personal information. It cannot be disabled without weakening your account security.',
      'coop_consent — records your privacy/cookie consent choice so we do not repeatedly ask. It stores only your choice, a version number, and a timestamp.',
      'Local storage (access_token / refresh_token) — keeps you signed in to your member or admin portal. These are cleared when you log out.',
      'Session storage (csrf_token) — a mirror of the CSRF token for the current browser tab, cleared when the tab closes.',
    ],
  },
  {
    title: '3. Third-party cookies & tracking',
    body: [
      'Website: we have audited the web console and it loads no third-party trackers such as Google Analytics, Meta Pixel, or advertising scripts, and embeds no third-party iframes or social widgets. Nothing loads from ad or analytics domains.',
      'Mobile app: the FENAC COOP app may display advertisements served by Google\u2019s mobile ads SDK. This is enabled only with your consent. You can turn ads off from your profile settings; when ads are off, the ad component is not loaded and no optional ad data is sent.',
    ],
  },
  {
    title: '4. Your consent',
    body: 'When optional cookies are introduced, the consent banner will explain them before they are set. You may accept or decline optional cookies, and you can withdraw consent at any time. Strictly necessary security and session storage may still operate because the service cannot function safely without them.',
  },
  {
    title: '5. Controlling cookies in your browser',
    body: 'You can block or delete cookies through your browser settings, browse in private/incognito mode, or use browser extensions. Please note that blocking the csrf-secret cookie will prevent you from signing in to the platform because it is required for account security.',
  },
  {
    title: '6. Changes to this policy',
    body: 'If we ever add optional analytics or advertising to the website, this policy will be updated and no new optional cookie will be set without first asking for your consent.',
  },
  {
    title: '7. Contact',
    body: 'Questions about cookies and tracking can be sent to hello@fenacoop.org.',
  },
]

export function CookiesPolicy() {
  return (
    <LegalPage
      title="Cookie Policy"
      description="See which cookies and browser storage FENAC COOP uses, why they are needed, and how to control optional tracking."
      effectiveDate="September 8, 2026"
      sections={sections}
    />
  )
}