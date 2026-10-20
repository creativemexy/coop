# Plan: Web Landing Page & SEO Launch

**Complexity**: Medium
**Estimated Effort**: 14-20 hours

## Summary
Complete the public marketing website with all landing pages, proper SEO implementation (meta tags, Open Graph, Twitter Cards, JSON-LD structured data), sitemap.xml, robots.txt, and performance optimization. Leverages recently modified landing components and new SEO assets.

## Patterns to Mirror

| Category | Source | Pattern |
|----------|--------|---------|
| Landing Pages | `web/src/pages/landing/*.tsx` | 8 pages: Home, About, Services, Membership, FAQ, Contact, Terms, LegalPage |
| Site Config | `web/src/pages/landing/site.config.ts` | Centralized site metadata (name, description, URLs, social handles) |
| SEO Library | `web/src/lib/seo.ts` | New file - will define SEO utilities, JSON-LD generators |
| Layout | `web/src/components/layout/AppLayout.tsx` | Modified - header/footer structure, navigation |
| Assets | `web/public/og-image.jpg`, `robots.txt`, `sitemap.xml` | New static assets for SEO |
| Routing | `web/src/App.tsx` (implied) | React Router v7 routes for public vs protected |
| Styling | Tailwind CSS v4 + `clsx` + `tailwind-merge` | Utility-first, component variants with CVA |

## Files to Change

| File | Action | Why |
|------|--------|-----|
| `web/src/lib/seo.ts` | CREATE | Core SEO utilities: meta tag generators, JSON-LD schemas, Open Graph helpers |
| `web/src/components/seo/SEO.tsx` | CREATE | Reusable `<SEO />` component for page-level meta injection |
| `web/src/components/seo/JsonLd.tsx` | CREATE | Component for rendering JSON-LD structured data |
| `web/src/pages/landing/Home.tsx` | UPDATE | Add SEO component, hero section, feature highlights, CTA |
| `web/src/pages/landing/About.tsx` | UPDATE | Add SEO, team/org schema, mission/values |
| `web/src/pages/landing/Services.tsx` | UPDATE | Add SEO, Service schema for each product (BNPL, Savings, Loans, Investments) |
| `web/src/pages/landing/Membership.tsx` | UPDATE | Add SEO, FAQ schema for membership tiers |
| `web/src/pages/landing/Faq.tsx` | UPDATE | Add SEO, FAQPage schema with `Question`/`Answer` pairs |
| `web/src/pages/landing/Contact.tsx` | UPDATE | Add SEO, ContactPage schema, honeypot-protected form |
| `web/src/pages/landing/Terms.tsx` | UPDATE | Add SEO, WebPage schema, legal content |
| `web/src/pages/landing/LegalPage.tsx` | UPDATE | Add SEO, privacy policy, terms of service |
| `web/src/pages/landing/site.config.ts` | UPDATE | Complete all fields: ogImage, twitterHandle, schemaOrg, etc. |
| `web/public/robots.txt` | CREATE | Crawler directives, sitemap reference |
| `web/public/sitemap.xml` | CREATE | Static sitemap (or generate at build) |
| `web/public/og-image.jpg` | VERIFY | 1200x630 social share image (already exists) |
| `web/index.html` | UPDATE | Base meta tags, preconnect, theme-color, manifest link |
| `web/vite.config.ts` | UPDATE | Build-time sitemap generation plugin, PWA manifest |
| `web/src/hooks/useSEO.ts` | CREATE | Hook for dynamic SEO updates (e.g., on route change) |
| `web/src/components/ui/` | UPDATE | Ensure all UI components accessible (ARIA, semantic HTML) |

## Tasks

### Task 1: Core SEO Library & Components
- **Action**: Create `seo.ts` with: `generateMetaTags()`, `generateOpenGraph()`, `generateTwitterCard()`, `generateJsonLd()` (Organization, WebSite, Service, FAQPage, ContactPage, BreadcrumbList); create `<SEO />` component accepting title, description, canonical, ogImage, noindex, nofollow, jsonLd; create `<JsonLd />` component for script tag injection
- **Mirror**: Follow `site.config.ts` structure for centralized config; use TypeScript interfaces for type safety
- **Validate**: Unit tests for each generator; render `<SEO />` in storybook or test page

### Task 2: Apply SEO to All Landing Pages
- **Action**: Import `<SEO />` in each landing page; configure per-page: title (max 60 chars), description (max 160 chars), canonical URL, OG image, JSON-LD schema; Home → WebSite + Organization; Services → Service[] + ItemList; FAQ → FAQPage; Contact → ContactPage; Terms/Legal → WebPage
- **Mirror**: Follow existing page structure; keep components clean, delegate SEO to component
- **Validate**: View source shows all meta tags; Google Rich Results Test passes for each page

### Task 3: Site Configuration Completion
- **Action**: Complete `site.config.ts` with: `siteName`, `siteUrl`, `defaultTitle`, `titleTemplate`, `description`, `ogImage` (path to `/og-image.jpg`), `twitterHandle`, `schemaOrg` (Organization with logo, sameAs, contactPoint), `navigation` (header/footer links), `features` (product list for Services page)
- **Mirror**: Existing partial config; ensure all fields typed and documented
- **Validate**: All pages consume config correctly; no hardcoded URLs

### Task 4: Static SEO Assets
- **Action**: Verify `og-image.jpg` is 1200x630, < 300KB, branded; create `robots.txt` with `User-agent: *`, `Allow: /`, `Disallow: /api/`, `/admin/`, `/dashboard/`, `Sitemap: https://coop.example.com/sitemap.xml`; create `sitemap.xml` with all public routes (/, /about, /services, /membership, /faq, /contact, /terms, /legal, /privacy) + `lastmod`, `changefreq`, `priority`
- **Mirror**: Follow `web/public/` conventions; use absolute URLs with `siteUrl` from config
- **Validate**: `curl /robots.txt`, `curl /sitemap.xml` return correct content; XML validates

### Task 5: Build-Time Sitemap Generation
- **Action**: Add Vite plugin (or `vite-plugin-sitemap`) to generate `sitemap.xml` at build from route config; include only public routes; exclude auth, admin, dashboard routes; set `lastmod` to build date
- **Mirror**: Follow `vite.config.ts` plugin pattern; follow `package.json` script conventions
- **Validate**: `npm run build` produces `dist/sitemap.xml` with correct URLs

### Task 6: Performance & Core Web Vitals
- **Action**: Optimize: lazy-load below-fold images (`loading="lazy"`), preload critical CSS/fonts, minimize JS bundles (code-split by route), enable gzip/brotli via Vite, add `preconnect` for external domains (fonts, analytics), implement `font-display: swap`, optimize `og-image.jpg` (WebP/AVIF fallbacks)
- **Mirror**: Follow `vite.config.ts` build optimizations; follow `web/index.html` preconnect pattern
- **Validate**: Lighthouse CI score > 90 Performance, > 90 SEO, > 90 Accessibility

### Task 7: Accessibility Audit & Fixes
- **Action**: Audit all landing pages for: semantic HTML (header, main, footer, section, article), heading hierarchy (h1→h2→h3), color contrast (WCAG AA), focus indicators, ARIA labels on interactive elements, alt text on images, form labels, skip links, reduced motion respect
- **Mirror**: Follow `ecc:accessibility` skill patterns; use `axe-core` in tests
- **Validate**: `npm run test:a11y` (if configured) or manual axe DevTools audit

### Task 8: Analytics & Conversion Tracking (Privacy-First)
- **Action**: Add optional analytics (Plausible/Umami self-hosted or GA4 with consent); implement consent banner (GDPR/CCPA); track: page views, CTA clicks (Get Started, Contact), form submissions; no PII without consent
- **Mirror**: Follow `web/src/stores/` pattern for consent state; follow `AppLayout.tsx` for global banner
- **Validate**: Consent banner appears; events fire only after consent; no cookies without consent

### Task 9: Cross-Browser Testing & Deploy Verification
- **Action**: Test in Chrome, Firefox, Safari, Edge; verify: meta tags render, JSON-LD parses, forms submit, responsive breakpoints (320px, 768px, 1024px, 1440px), dark/light mode (if supported), PWA manifest (if enabled)
- **Mirror**: Follow `web/vite.config.ts` build targets; follow `host.md` deployment checklist
- **Validate**: All browsers render correctly; `npm run preview` serves production build

## Validation

```bash
# Development
cd web && npm run dev

# Build & verify
cd web && npm run build
cd web && npm run preview

# SEO verification
# 1. Check meta tags: curl http://localhost:4173/ | grep -A 20 '<head>'
# 2. Check sitemap: curl http://localhost:4173/sitemap.xml
# 3. Check robots: curl http://localhost:4173/robots.txt
# 4. Google Rich Results Test: paste each page URL
# 5. Facebook Sharing Debugger: paste Home URL
# 6. Twitter Card Validator: paste Home URL
# 7. Lighthouse: npx lighthouse http://localhost:4173 --view

# Accessibility
# npx @axe-core/cli http://localhost:4173
```

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SEO tags not picked up by crawlers | Low | Server-side rendering not needed for static meta; ensure no JS-required content |
| Sitemap stale after deploy | Low | Build-time generation ensures fresh sitemap each deploy |
| OG image not loading on social platforms | Medium | Verify absolute URL, correct dimensions, HTTPS, cache headers |
| Performance regression from analytics | Low | Load async, consent-gated, self-hosted preferred |
| Duplicate content (www vs non-www) | Low | Canonical URLs in all pages; redirect at CDN/edge |

## Acceptance
- [ ] All 8 landing pages have complete SEO meta (title, desc, canonical, OG, Twitter, JSON-LD)
- [ ] `robots.txt` and `sitemap.xml` accessible and correct
- [ ] `og-image.jpg` displays correctly on Facebook, Twitter, LinkedIn, Slack
- [ ] Google Rich Results Test passes for Home, Services, FAQ, Contact
- [ ] Lighthouse: Performance > 90, SEO > 90, Accessibility > 90, Best Practices > 90
- [ ] All pages accessible (WCAG 2.1 AA): contrast, focus, semantics, ARIA
- [ ] Build generates `dist/sitemap.xml` automatically
- [ ] Consent banner works; analytics only loads after consent
- [ ] Cross-browser verified (Chrome, Firefox, Safari, Edge)
- [ ] Deployment checklist in `host.md` updated