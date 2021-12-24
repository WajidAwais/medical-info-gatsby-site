const {
  buildSearchIndex,
  eventLandingEntries,
  pageEntries,
} = require('./search-index')

const system = (codename, type, language = 'en') => ({
  id: `${codename}-id`,
  codename,
  type,
  name: codename,
  language,
})

const page = (codename, url, elements = {}, language = 'en') => ({
  system: system(codename, 'page', language),
  elements: {
    title: { value: codename },
    url: { value: url },
    intro: { value: [] },
    body: { value: [] },
    references: { value: [] },
    resources: { value: [] },
    ...elements,
  },
})

const intro = {
  system: system('intro', 'intro'),
  elements: {
    title: { value: 'Intro title' },
    subtitle: { value: 'Intro subtitle' },
    description: { value: '<p>Intro <strong>text</strong></p>' },
  },
}

describe('pageEntries', () => {
  it('skips utility pages without an intro or resources', () => {
    expect(pageEntries(page('basket', 'basket'))).toEqual([])
  })

  it('indexes the intro, info blocks, nested cards and references', () => {
    const cards = {
      system: system('cards', 'cards'),
      elements: {
        cards: {
          value: [
            {
              system: system('card', 'card'),
              elements: {
                title: { value: 'Card title' },
                details: { value: '<p>Card body</p>' },
              },
            },
          ],
        },
      },
    }
    const infoBlock = {
      system: system('block', 'info_block'),
      elements: {
        content: { value: '<h2>Block</h2>', modular_content: [cards] },
      },
    }
    const references = {
      system: system('refs', 'references'),
      elements: { references: { value: '<ol><li>Ref</li></ol>' } },
    }
    const entries = pageEntries(
      page('about', '/About/', {
        intro: { value: [intro] },
        body: { value: [infoBlock] },
        references: { value: [references] },
      })
    )

    expect(entries.map((e) => e.code)).toEqual([
      'about',
      'block',
      'card',
      'refs',
    ])
    expect(entries[0]).toMatchObject({
      title: 'Intro title',
      subtitle: 'Intro subtitle',
      body: 'Intro text',
      url: '/about',
      name: 'about',
    })
    expect(entries[2]).toMatchObject({ title: 'Card title', body: 'Card body' })
  })

  it('indexes resource pages without an intro', () => {
    const resources = {
      system: system('library', 'resources'),
      elements: {
        resources: {
          value: [
            {
              system: system('guide', 'resource'),
              elements: {
                title: { value: 'Guide' },
                description: { value: 'A guide' },
              },
            },
          ],
        },
      },
    }
    const entries = pageEntries(
      page('resources', 'resources', { resources: { value: [resources] } })
    )
    expect(entries.map((e) => e.code)).toEqual(['resources', 'guide'])
    expect(entries[1]).toMatchObject({
      title: 'Guide',
      body: 'A guide',
      url: '/resources',
    })
  })

  it('links the home page to the language root', () => {
    const [entry] = pageEntries(
      page(
        'home',
        'herzinsuffizienz-und-ti',
        { intro: { value: [intro] } },
        'de'
      )
    )
    expect(entry.url).toBe('/de/')
  })
})

describe('eventLandingEntries', () => {
  it('indexes the landing page and its event groups', () => {
    const landing = {
      system: system('webinars', 'event_landing'),
      elements: {
        title: { value: 'Webinars' },
        seo__title: { value: 'Webinar series' },
        seo__slug: { value: 'webinars' },
        events: {
          value: [
            {
              system: system('spring', 'events'),
              elements: {
                title: { value: 'Spring' },
                description: { value: 'Spring sessions' },
              },
            },
          ],
        },
      },
    }
    const entries = eventLandingEntries(landing)
    expect(entries).toHaveLength(2)
    expect(entries[1]).toMatchObject({
      name: 'Webinar series',
      title: 'Spring',
      url: '/webinars',
    })
  })
})

describe('buildSearchIndex', () => {
  it('keeps only nodes in the requested language', () => {
    const source = {
      pages: {
        nodes: [
          page('en-page', 'a', { intro: { value: [intro] } }, 'en'),
          page('de-page', 'b', { intro: { value: [intro] } }, 'de'),
        ],
      },
      eventLandings: { nodes: [] },
    }
    expect(buildSearchIndex(source, 'de').map((e) => e.code)).toEqual([
      'de-page',
    ])
  })
})
