// CommonJS so gatsby-node.js (build time) and components (browser) share it.
const DEFAULT_LANGUAGE = 'en'

// Kontent pages whose slug should be served at the language root.
const HOME_PAGE_SLUGS = (
  process.env.GATSBY_HOME_PAGE_SLUGS ||
  'heart-failure-and-tr,herzinsuffizienz-und-ti'
)
  .split(',')
  .map((slug) => slug.trim())
  .filter(Boolean)

const normaliseSlug = (slug) =>
  (slug || '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .trim()

// Pages carry their slug in `url`; event landings in `seo__slug`.
const pageSlug = (page) =>
  normaliseSlug(
    page.elements.url ? page.elements.url.value : page.elements.seo__slug?.value
  )

const isHomeSlug = (slug) => HOME_PAGE_SLUGS.includes(slug)

const localePrefix = (language) =>
  language && language !== DEFAULT_LANGUAGE ? `/${language}` : ''

const pathForSlug = (slug, language) =>
  `${localePrefix(language)}/${isHomeSlug(slug) ? '' : normaliseSlug(slug)}`

const searchPath = (language, query) =>
  `${localePrefix(language)}/search?s=${encodeURIComponent(query || '')}`

const pagePath = (page) => pathForSlug(pageSlug(page), page.system.language)

module.exports = {
  DEFAULT_LANGUAGE,
  HOME_PAGE_SLUGS,
  isHomeSlug,
  localePrefix,
  normaliseSlug,
  pagePath,
  pageSlug,
  pathForSlug,
  searchPath,
}
