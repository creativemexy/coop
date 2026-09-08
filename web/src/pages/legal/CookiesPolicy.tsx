import { LegalPage } from './LegalPage'

const sections = [
  {
    title: '1. What are cookies?',
    body: 'Cookies are small text files placed on your device by a website. They can store preferences, keep you signed in, and enable security features. Some cookies are set by third parties (e.g. advertising or analytics companies) and can be used to build a profile of your browsing. We believe in being transparent about exactly what we use.',
  },
  {
    title: '2. Cookies and storage we use',
    body: 'The Coop BNPL web console sets no advertising, analytics or marketing cookies. The only cookies and browser storage used are listed below:',
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
      'Mobile app: the Coop BNPL app may display advertisements served by Google\u2019s mobile ads SDK. This is only enabled with your consent — you can turn ads off at any time from your profile settings (Account → Personalised ads). When ads are off, the ad component is not loaded and no ad data is sent.',
    ],
  },
  {
    title: '4. Your consent',
    body: 'When you first visit the website you are shown a consent banner. Choosing "Accept" records your informed consent; choosing "Decline" records that only strictly-necessary cookies may be set. Either way, no optional tracking runs today. You can change your mind at any time by clearing your cookies and reloading the site.',
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
    body: 'Questions about cookies and tracking can be sent to privacy@coop-bnpl.com.',
  },
]

export function CookiesPolicy() {
  return (
    <LegalPage
      title="Cookie Policy"
      effectiveDate="September 8, 2026"
      sections={sections}
    />
  )
}