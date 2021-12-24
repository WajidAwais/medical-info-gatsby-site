const path = require('path')
const {
  buildDeliveryItems,
  deliveryResponse,
  languagesResponse,
  linkedCodenamesInRichText,
  loadFixtures,
  schemaFor,
  stableId,
  toDeliveryItem,
  toNodeData,
} = require('./fixtures')

const fixturesDir = path.join(__dirname, '../../../fixtures/kontent')

describe('fixture transforms', () => {
  const types = {
    card: { title: 'text', media: 'modular_content', details: 'rich_text' },
    image: { image: 'asset', image_alt: 'text' },
  }

  it('reads linked item codenames from rich text object tags', () => {
    const html =
      '<p>a</p><object type="application/kenticocloud" data-type="item" data-codename="first"></object>' +
      '<object data-type="item" data-codename="second"></object>'
    expect(linkedCodenamesInRichText(html)).toEqual(['first', 'second'])
    expect(linkedCodenamesInRichText('')).toEqual([])
  })

  it('expands a compact item into the Delivery API shape', () => {
    const item = toDeliveryItem(
      {
        type: 'card',
        codename: 'card_one',
        elements: {
          title: 'Hello',
          media: ['image_one'],
          details: '<object data-codename="image_one"></object>',
        },
      },
      types,
      'en'
    )
    expect(item.system).toMatchObject({
      codename: 'card_one',
      name: 'card_one',
      language: 'en',
      type: 'card',
      id: stableId('card_one'),
    })
    expect(item.elements.title).toEqual({ type: 'text', name: 'title', value: 'Hello' })
    expect(item.elements.media.value).toEqual(['image_one'])
    expect(item.elements.details.modular_content).toEqual(['image_one'])
  })

  it('fills asset defaults and keeps explicit values', () => {
    const item = toDeliveryItem(
      {
        type: 'image',
        codename: 'image_one',
        elements: { image: [{ url: '/mock-assets/a.svg', width: 10 }] },
      },
      types,
      'en'
    )
    expect(item.elements.image.value[0]).toMatchObject({
      name: 'a.svg',
      url: '/mock-assets/a.svg',
      width: 10,
      height: null,
    })
    expect(item.elements.image_alt.value).toBe('')
  })

  it('rejects unknown types and elements', () => {
    expect(() =>
      toDeliveryItem({ type: 'nope', codename: 'x' }, types, 'en')
    ).toThrow(/unknown content type "nope"/)
    expect(() =>
      toDeliveryItem(
        { type: 'card', codename: 'x', elements: { typo: 'a' } },
        types,
        'en'
      )
    ).toThrow(/typo/)
  })

  it('replaces codenames with node ids and drops dangling links', () => {
    const item = toDeliveryItem(
      {
        type: 'card',
        codename: 'card_one',
        elements: {
          media: ['image_one', 'missing'],
          details: '<object data-codename="image_one"></object>',
        },
      },
      types,
      'en'
    )
    const ids = { image_one: 'node-1' }
    const node = toNodeData(item, (codename) => ids[codename])
    expect(node.elements.media.value).toEqual(['node-1'])
    expect(node.elements.details.modular_content).toEqual(['node-1'])
    expect(node.elements.details.images).toEqual([])
    expect(node.preferred_language).toBe('en')
  })

  it('declares one GraphQL type per content type', () => {
    const sdl = schemaFor(types)
    expect(sdl).toContain('type kontent_item_card implements Node & kontent_item')
    expect(sdl).toContain('details: kontent_item_rich_text_element_value')
    expect(sdl).toContain('image: kontent_item_asset_element_value')
  })
})

describe('bundled fixtures', () => {
  const fixtures = loadFixtures(fixturesDir)
  const items = buildDeliveryItems(fixtures)
  const codenames = new Set(items.map((item) => item.system.codename))

  it('has unique codenames', () => {
    expect(codenames.size).toBe(items.length)
  })

  it('only links to items that exist', () => {
    const dangling = items.flatMap((item) =>
      Object.values(item.elements)
        .flatMap((element) =>
          element.type === 'modular_content'
            ? element.value
            : element.type === 'rich_text'
            ? element.modular_content
            : []
        )
        .filter((codename) => !codenames.has(codename))
        .map((codename) => `${item.system.codename} -> ${codename}`)
    )
    expect(dangling).toEqual([])
  })

  it('serves translations the way the Delivery API does', () => {
    const response = deliveryResponse('translations', 'en', items)
    expect(response.item.elements.translation.value.length).toBeGreaterThan(0)
    for (const codename of response.item.elements.translation.value) {
      const entry = response.modular_content[codename]
      expect(() => JSON.parse(entry.elements.value.value)).not.toThrow()
    }
  })

  it('describes every fixture language', () => {
    expect(languagesResponse(fixtures.languages).languages).toEqual([
      expect.objectContaining({
        system: expect.objectContaining({ codename: 'en', name: 'English' }),
      }),
    ])
  })

  it('uses only neutral local assets', () => {
    const assetUrls = items.flatMap((item) =>
      Object.values(item.elements)
        .filter((element) => element.type === 'asset')
        .flatMap((element) => element.value.map((asset) => asset.url))
    )
    expect(assetUrls.length).toBeGreaterThan(0)
    for (const url of assetUrls) {
      expect(url).toMatch(/^\/mock-assets\//)
    }
  })
})
