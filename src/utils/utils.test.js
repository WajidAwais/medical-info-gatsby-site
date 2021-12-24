import { normaliseSlug, pagePath, pathForSlug } from './paths'
import { prepareNavLinks } from './prepareNavLinks'
import { prepareTranslations } from './prepareTranslations'
import { getTitleForGermanyHomePage, getTitlePart } from './helpers'
import getStyles from './getStyles'
import { prepareExternalLinks } from './prepareExternalLinks'

const navPage = (url, title, show = 'Yes', language = 'en') => ({
  system: { language, type: 'page' },
  elements: {
    url: { value: url },
    title: { value: title },
    show_in_navigation: { value: [{ name: show }] },
  },
})

describe('paths', () => {
  it('normalises slugs from the CMS', () => {
    expect(normaliseSlug('/About-Us/')).toBe('about-us')
    expect(normaliseSlug(undefined)).toBe('')
  })

  it('prefixes non-default languages and maps home slugs to the root', () => {
    expect(pathForSlug('resources', 'en')).toBe('/resources')
    expect(pathForSlug('ressourcen', 'de')).toBe('/de/ressourcen')
    expect(pathForSlug('heart-failure-and-tr', 'en')).toBe('/')
  })

  it('reads event landing slugs from seo__slug', () => {
    expect(
      pagePath({
        system: { language: 'en' },
        elements: { seo__slug: { value: '/Webinars' } },
      })
    ).toBe('/webinars')
  })
})

describe('prepareNavLinks', () => {
  it('builds links for every subpage and honours show_in_navigation', () => {
    const links = prepareNavLinks({
      elements: {
        subpages: {
          value: [
            navPage('heart-failure-and-tr', ' Home '),
            navPage('basket', 'Basket', 'No'),
            {
              system: { language: 'en', type: 'page' },
              elements: {
                url: { value: 'faq' },
                title: { value: 'FAQ' },
                show_in_navigation: { value: [] },
              },
            },
            {},
          ],
        },
      },
    })
    expect(links).toEqual([
      { title: 'Home', url: '/', type: 'page', show: true },
      { title: 'Basket', url: '/basket', type: 'page', show: false },
      { title: 'FAQ', url: '/faq', type: 'page', show: true },
    ])
  })
})

describe('prepareTranslations', () => {
  it('parses the JSON value stored for a key', () => {
    const translations = [{ key: 'Search', value: '{"Title":"Suche"}' }]
    expect(prepareTranslations(translations, 'Search')).toEqual({
      Title: 'Suche',
    })
    expect(prepareTranslations(translations, 'Basket')).toBeUndefined()
  })
})

describe('helpers', () => {
  it('picks the site title by language', () => {
    expect(getTitlePart('en')).toBe('Treat HF valve')
    expect(getTitlePart('de')).toBe('Treating HF Valve')
  })

  it('expands the German home page title', () => {
    expect(getTitleForGermanyHomePage('de', 'Herzinsuffizienz und TI')).toBe(
      'Herzinsuffizienz und Trikuspidalklappeninsuffizienz'
    )
    expect(getTitleForGermanyHomePage('en', 'Home')).toBe('Home')
  })
})

describe('getStyles', () => {
  it('turns styling option codenames into utility classes', () => {
    expect(
      getStyles({
        backgroundColor: { value: [{ codename: 'sky_light' }] },
        paddingTop: { value: [{ codename: 'n3' }] },
        paddingBottom: { value: [] },
      })
    ).toEqual({
      backgroundColor: 'bg-sky-light',
      paddingTop: 'pt-3',
      paddingBottom: '',
    })
  })
})

describe('getStyles edge cases', () => {
  it('handles multi-word colour codenames and missing elements', () => {
    expect(
      getStyles({
        backgroundColor: { value: [{ codename: 'steel_light_alt' }] },
        paddingTop: undefined,
        paddingBottom: { value: [{ codename: 'n0' }] },
      })
    ).toEqual({
      backgroundColor: 'bg-steel-light-alt',
      paddingTop: '',
      paddingBottom: 'pb-0',
    })
  })
})

describe('prepareExternalLinks', () => {
  const external = [
    { elements: { title: { value: 'Privacy' }, url: { value: 'https://x.test/p' } } },
  ]
  const pageLinks = [{ title: 'Home', url: '/', type: 'page', show: true }]

  it('appends external links without mutating the page links', () => {
    const links = prepareExternalLinks(external, pageLinks)
    expect(links).toHaveLength(2)
    expect(links[1]).toEqual({
      title: 'Privacy',
      url: 'https://x.test/p',
      type: 'external',
      show: true,
    })
    expect(pageLinks).toHaveLength(1)
  })

  it('does not duplicate external links on re-render', () => {
    const once = prepareExternalLinks(external, pageLinks)
    expect(prepareExternalLinks(external, once)).toHaveLength(2)
  })
})
