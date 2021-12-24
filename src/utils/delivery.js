// Runtime reads from the Kontent Delivery API (or the static copies a
// KONTENT_MOCK build publishes). Responses are cached per page load because
// the Layout, and with it these effects, remounts on every navigation.
const apiUrl = (path) =>
  `${process.env.GATSBY_DELIVERY_API_URL}${process.env.GATSBY_KONTENT_PROJECT_ID}/${path}`

export const languageRoot = (codename) =>
  codename === 'en' ? '/' : `/${codename}/`

export const parseLanguages = (body) =>
  (body?.languages || []).map(({ system: { name, codename } }) => ({
    name: codename.toUpperCase(),
    url: languageRoot(codename),
    region: name,
  }))

// The translations item links one item per UI area; each stores its labels
// as a JSON string in its `value` element, keyed by the item name.
export const parseTranslations = (body) => {
  const codenames = body?.item?.elements?.translation?.value || []
  return codenames
    .map((codename) => body.modular_content?.[codename])
    .filter(Boolean)
    .map(({ system, elements }) => ({
      key: system.name,
      value: elements.value.value,
    }))
}

const cache = new Map()

const getJson = (path) => {
  if (!cache.has(path)) {
    const request = fetch(apiUrl(path)).then((response) => {
      if (!response.ok) {
        throw new Error(`Delivery API ${path} returned ${response.status}`)
      }
      return response.json()
    })
    request.catch(() => cache.delete(path))
    cache.set(path, request)
  }
  return cache.get(path)
}

export const fetchLanguages = () => getJson('languages').then(parseLanguages)

export const fetchTranslations = (language) =>
  getJson(`items/translations?language=${language}`).then(parseTranslations)

export const clearDeliveryCache = () => cache.clear()
