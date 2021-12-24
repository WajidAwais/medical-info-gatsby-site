// Turns the compact fixture files in fixtures/kontent into the two shapes the
// site consumes: Delivery API JSON (what the browser fetches at runtime) and
// Gatsby nodes that mirror @kontent-ai/gatsby-source's GraphQL schema.
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const FIXED_LAST_MODIFIED = '2024-01-01T00:00:00.000Z'

const ELEMENT_VALUE_TYPES = {
  text: 'kontent_item_text_element_value',
  url_slug: 'kontent_item_url_slug_element_value',
  custom: 'kontent_item_custom_element_element_value',
  number: 'kontent_item_number_element_value',
  date_time: 'kontent_item_date_time_element_value',
  rich_text: 'kontent_item_rich_text_element_value',
  modular_content: 'kontent_item_modular_content_element_value',
  multiple_choice: 'kontent_item_multiple_choice_element_value',
  taxonomy: 'kontent_item_taxonomy_element_value',
  asset: 'kontent_item_asset_element_value',
}

const stableId = (seed) => {
  const hash = crypto.createHash('md5').update(seed).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-')
}

// Kontent marks linked items inside rich text with <object data-codename="…">.
const linkedCodenamesInRichText = (html) =>
  Array.from(
    (html || '').matchAll(/<object\b[^>]*\bdata-codename="([^"]+)"/g),
    (match) => match[1]
  )

const loadFixtures = (dir) => {
  const read = (file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  const types = read('content-types.json')
  const { languages, items } = read('content.json')
  return { types, languages, items }
}

const toDeliveryElement = (codename, kind, raw) => {
  const base = { type: kind, name: codename }
  switch (kind) {
    case 'rich_text': {
      const value = raw || ''
      return {
        ...base,
        value,
        modular_content: linkedCodenamesInRichText(value),
        images: {},
        links: {},
      }
    }
    case 'modular_content':
    case 'multiple_choice':
    case 'taxonomy':
      return { ...base, value: raw || [] }
    case 'asset':
      return {
        ...base,
        value: (raw || []).map((asset) => ({
          name: path.basename(asset.url),
          description: null,
          type: 'application/octet-stream',
          size: 0,
          width: null,
          height: null,
          ...asset,
        })),
      }
    case 'number':
      return { ...base, value: raw === undefined ? null : raw }
    default:
      return { ...base, value: raw === undefined ? '' : raw }
  }
}

const toDeliveryItem = (item, types, defaultLanguage) => {
  const elementKinds = types[item.type]
  if (!elementKinds) {
    throw new Error(
      `Fixture item "${item.codename}" uses unknown content type "${item.type}"`
    )
  }
  const unknown = Object.keys(item.elements || {}).filter(
    (codename) => !(codename in elementKinds)
  )
  if (unknown.length) {
    throw new Error(
      `Fixture item "${item.codename}" has elements not in type "${
        item.type
      }": ${unknown.join(', ')}`
    )
  }
  const language = item.language || defaultLanguage
  const elements = {}
  for (const [codename, kind] of Object.entries(elementKinds)) {
    elements[codename] = toDeliveryElement(
      codename,
      kind,
      (item.elements || {})[codename]
    )
  }
  return {
    system: {
      id: stableId(item.codename),
      name: item.name || item.codename,
      codename: item.codename,
      language,
      type: item.type,
      last_modified: FIXED_LAST_MODIFIED,
    },
    elements,
  }
}

const buildDeliveryItems = ({ types, languages, items }) => {
  const defaultLanguage = languages[0].codename
  return items.map((item) => toDeliveryItem(item, types, defaultLanguage))
}

const linkedCodenames = (deliveryItem) =>
  Object.values(deliveryItem.elements).flatMap((element) => {
    if (element.type === 'modular_content') return element.value
    if (element.type === 'rich_text') return element.modular_content
    return []
  })

// Same shape as GET /items/<codename>?depth=1 on the Delivery API.
const deliveryResponse = (codename, language, deliveryItems) => {
  const inLanguage = deliveryItems.filter(
    (candidate) => candidate.system.language === language
  )
  const byCodename = new Map(
    inLanguage.map((candidate) => [candidate.system.codename, candidate])
  )
  const item = byCodename.get(codename)
  if (!item) return null
  const modular_content = {}
  for (const linked of linkedCodenames(item)) {
    if (byCodename.has(linked)) modular_content[linked] = byCodename.get(linked)
  }
  return { item, modular_content }
}

const languagesResponse = (languages) => ({
  languages: languages.map(({ codename, name }) => ({
    system: { id: stableId(`language:${codename}`), name, codename },
  })),
  pagination: {
    skip: 0,
    limit: 0,
    count: languages.length,
    next_page: '',
  },
})

// Node data keeps the Delivery shape but swaps codename references for node
// ids, so the schema can resolve them with @link.
const toNodeData = (deliveryItem, nodeIdForCodename) => {
  const resolve = (codenames) =>
    codenames.map(nodeIdForCodename).filter(Boolean)
  const elements = {}
  for (const [codename, element] of Object.entries(deliveryItem.elements)) {
    if (element.type === 'modular_content') {
      elements[codename] = { ...element, value: resolve(element.value) }
    } else if (element.type === 'rich_text') {
      elements[codename] = {
        ...element,
        modular_content: resolve(element.modular_content),
        images: Object.values(element.images),
        links: Object.entries(element.links).map(([link_id, link]) => ({
          link_id,
          ...link,
        })),
      }
    } else {
      elements[codename] = element
    }
  }
  return {
    system: deliveryItem.system,
    elements,
    preferred_language: deliveryItem.system.language,
  }
}

const schemaFor = (types) => {
  const base = `
    interface kontent_item implements Node {
      id: ID!
      system: kontent_item_system!
      preferred_language: String!
    }
    type kontent_item_system {
      codename: String!
      id: String!
      language: String!
      last_modified: Date @dateformat
      name: String!
      type: String!
    }
    type kontent_item_text_element_value { name: String! type: String! value: String }
    type kontent_item_url_slug_element_value { name: String! type: String! value: String }
    type kontent_item_custom_element_element_value { name: String! type: String! value: String }
    type kontent_item_number_element_value { name: String! type: String! value: Float }
    type kontent_item_date_time_element_value { name: String! type: String! value: Date @dateformat }
    type kontent_item_rich_text_element_value {
      name: String!
      type: String!
      value: String
      modular_content: [kontent_item] @link
      images: [kontent_element_rich_text_image_value]
      links: [kontent_element_rich_text_link_value]
    }
    type kontent_item_modular_content_element_value {
      name: String!
      type: String!
      value: [kontent_item] @link
    }
    type kontent_item_multiple_choice_element_value {
      name: String!
      type: String!
      value: [kontent_element_multiple_choice_value]
    }
    type kontent_item_taxonomy_element_value {
      name: String!
      type: String!
      value: [kontent_element_taxonomy_value]
    }
    type kontent_item_asset_element_value {
      name: String!
      type: String!
      value: [kontent_element_asset_value]
    }
    type kontent_element_multiple_choice_value { codename: String! name: String! }
    type kontent_element_taxonomy_value { codename: String! name: String! }
    type kontent_element_asset_value {
      name: String!
      description: String
      type: String!
      size: Int!
      url: String!
      width: Int
      height: Int
    }
    type kontent_element_rich_text_image_value {
      image_id: String!
      url: String!
      description: String
      height: Int
      width: Int
    }
    type kontent_element_rich_text_link_value {
      link_id: String!
      codename: String!
      type: String!
      url_slug: String!
    }
  `
  const perType = Object.entries(types).map(([type, elementKinds]) => {
    const fields = Object.entries(elementKinds)
      .map(([codename, kind]) => {
        const valueType = ELEMENT_VALUE_TYPES[kind]
        if (!valueType) {
          throw new Error(`Unknown element kind "${kind}" on ${type}.${codename}`)
        }
        return `${codename}: ${valueType}`
      })
      .join('\n')
    return `
      type kontent_item_${type}_elements @dontInfer { ${fields} }
      type kontent_item_${type} implements Node & kontent_item @dontInfer {
        system: kontent_item_system!
        elements: kontent_item_${type}_elements
        preferred_language: String!
      }
    `
  })
  return [base, ...perType].join('\n')
}

module.exports = {
  buildDeliveryItems,
  deliveryResponse,
  languagesResponse,
  linkedCodenamesInRichText,
  loadFixtures,
  schemaFor,
  stableId,
  toDeliveryItem,
  toNodeData,
}
