import {
  clearDeliveryCache,
  fetchTranslations,
  parseLanguages,
  parseTranslations,
} from './delivery'

const translationsBody = {
  item: {
    elements: { translation: { value: ['t_search', 't_basket', 't_gone'] } },
  },
  // Delivery API object key order is not guaranteed to match the item order.
  modular_content: {
    t_basket: { system: { name: 'Basket' }, elements: { value: { value: '{"Title":"Basket"}' } } },
    t_search: { system: { name: 'Search' }, elements: { value: { value: '{"Title":"Search"}' } } },
  },
}

describe('parseLanguages', () => {
  it('maps Delivery API languages to switcher entries', () => {
    expect(
      parseLanguages({
        languages: [
          { system: { name: 'English', codename: 'en' } },
          { system: { name: 'Deutschland', codename: 'de' } },
        ],
      })
    ).toEqual([
      { name: 'EN', url: '/', region: 'English' },
      { name: 'DE', url: '/de/', region: 'Deutschland' },
    ])
    expect(parseLanguages({})).toEqual([])
  })
})

describe('parseTranslations', () => {
  it('follows the translation element order and skips missing items', () => {
    expect(parseTranslations(translationsBody)).toEqual([
      { key: 'Search', value: '{"Title":"Search"}' },
      { key: 'Basket', value: '{"Title":"Basket"}' },
    ])
    expect(parseTranslations(undefined)).toEqual([])
  })
})

describe('fetchTranslations', () => {
  beforeEach(() => {
    clearDeliveryCache()
    process.env.GATSBY_DELIVERY_API_URL = 'https://deliver.example/'
    process.env.GATSBY_KONTENT_PROJECT_ID = 'project'
  })

  it('requests each language once per page load', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(translationsBody),
    })
    await fetchTranslations('de')
    await fetchTranslations('de')
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://deliver.example/project/items/translations?language=de'
    )
  })

  it('rejects on HTTP errors and retries on the next call', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(translationsBody) })
    await expect(fetchTranslations('en')).rejects.toThrow('503')
    await expect(fetchTranslations('en')).resolves.toHaveLength(2)
  })
})
