import { useEffect } from 'react'
import { site } from '../pages/landing/site.config'

export type JsonLd = Record<string, unknown>

/**
 * Upsert (create-or-replace) a meta tag. Pass a null content to remove it.
 */
function upsertMeta(
  attr: 'name' | 'property',
  attrValue: string,
  content: string | null,
): void {
  const el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${attrValue}"]`,
  )
  if (content == null) {
    el?.remove()
    return
  }
  if (el) {
    el.setAttribute('content', content)
  } else {
    const meta = document.createElement('meta')
    meta.setAttribute(attr, attrValue)
    meta.setAttribute('content', content)
    document.head.appendChild(meta)
  }
}

function setCanonical(href: string | null): void {
  const el = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )
  if (href == null) {
    el?.remove()
    return
  }
  if (el) {
    el.setAttribute('href', href)
  } else {
    const link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    link.setAttribute('href', href)
    document.head.appendChild(link)
  }
}

function upsertJsonLd(key: string, data: JsonLd | JsonLd[] | null): void {
  const id = `jsonld-${key}`
  const existing = document.getElementById(id)
  if (data == null) {
    existing?.remove()
    return
  }
  const script: HTMLScriptElement =
    existing instanceof HTMLScriptElement
      ? existing
      : (() => {
          const s = document.createElement('script')
          s.id = id
          s.type = 'application/ld+json'
          document.head.appendChild(s)
          return s
        })()
  script.textContent = JSON.stringify(data)
}

export function absoluteUrl(path: string): string {
  return path.startsWith('http') ? path : `${site.url}${path}`
}

interface PageMetaOptions {
  title: string
  description: string
  /** Route path (e.g. '/about'). Omit for noindex pages that need no canonical. */
  path?: string
  noindex?: boolean
  ogType?: string
  ogImage?: string
  jsonLd?: JsonLd | JsonLd[]
}

/**
 * Per-route document metadata for the static SPA. While crawlers cannot read
 * this until after JS renders, Googlebot treats it as the page head. Kept as a
 * small dependency-free hook so no React state churn is required per page.
 */
export function usePageMeta(opts: PageMetaOptions): void {
  const { title, description, path, noindex = false } = opts
  const jsonLdJson = JSON.stringify(opts.jsonLd ?? null)
  const ogImage = absoluteUrl(opts.ogImage ?? site.ogImage)

  useEffect(() => {
    document.title = title
    document.documentElement.lang = 'en-NG'
    upsertMeta('name', 'description', description)
    upsertMeta(
      'name',
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-video-preview:-1',
    )

    const url = path ? absoluteUrl(path) : null
    setCanonical(url)

    upsertMeta('property', 'og:site_name', site.name)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', ogImage)
    upsertMeta('property', 'og:type', opts.ogType ?? 'website')
    upsertMeta('property', 'og:locale', 'en_NG')

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', ogImage)

    upsertJsonLd('page', jsonLdJson === 'null' ? null : (JSON.parse(jsonLdJson) as JsonLd | JsonLd[]))
  }, [title, description, path, noindex, jsonLdJson, ogImage, opts.ogType])
}