// Builds the js-search documents for /search from the GraphQL nodes that the
// pages are rendered from, so the index always matches the built site.
const { convert } = require('html-to-text')
const { pagePath } = require('../src/utils/paths')

const SEARCH_INDEX_QUERY = `
  fragment SearchSystem on kontent_item_system {
    id
    codename
    type
    name
    language
  }
  query SearchIndex {
    pages: allKontentItemPage {
      nodes {
        system { ...SearchSystem }
        elements {
          title { value }
          url { value }
          intro {
            value {
              system { ...SearchSystem }
              ... on kontent_item_intro {
                elements {
                  title { value }
                  subtitle { value }
                  description { value }
                }
              }
            }
          }
          body {
            value {
              system { ...SearchSystem }
              ... on kontent_item_info_block {
                elements {
                  content {
                    value
                    modular_content {
                      system { ...SearchSystem }
                      ... on kontent_item_cards {
                        elements {
                          cards {
                            value {
                              system { ...SearchSystem }
                              ... on kontent_item_card {
                                elements {
                                  title { value }
                                  details { value }
                                }
                              }
                            }
                          }
                        }
                      }
                      ... on kontent_item_infographics {
                        elements {
                          infographics {
                            value {
                              system { ...SearchSystem }
                              ... on kontent_item_infographic {
                                elements {
                                  title { value }
                                  footnote { value }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          references {
            value {
              system { ...SearchSystem }
              ... on kontent_item_references {
                elements { references { value } }
              }
            }
          }
          resources {
            value {
              system { ...SearchSystem }
              ... on kontent_item_resources {
                elements {
                  resources {
                    value {
                      system { ...SearchSystem }
                      ... on kontent_item_resource {
                        elements {
                          title { value }
                          description { value }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    eventLandings: allKontentItemEventLanding {
      nodes {
        system { ...SearchSystem }
        elements {
          title { value }
          seo__title { value }
          seo__slug { value }
          events {
            value {
              system { ...SearchSystem }
              ... on kontent_item_events {
                elements {
                  title { value }
                  description { value }
                }
              }
            }
          }
        }
      }
    }
  }
`

const htmlToText = (html) => (html ? convert(html, { wordwrap: false }) : '')

const linked = (element) => (element && element.value) || []

const entry = (item, fields) => ({
  id: item.system.id,
  code: item.system.codename,
  type: item.system.type,
  ...fields,
})

const infoBlockEntries = (block, base) => {
  const entries = [
    entry(block, { ...base, body: htmlToText(block.elements.content.value) }),
  ]
  for (const component of block.elements.content.modular_content || []) {
    if (component.system.type === 'cards') {
      for (const card of linked(component.elements.cards)) {
        entries.push(
          entry(card, {
            ...base,
            title: card.elements.title.value,
            body: htmlToText(card.elements.details.value),
          })
        )
      }
    }
    if (component.system.type === 'infographics') {
      for (const infographic of linked(component.elements.infographics)) {
        entries.push(
          entry(infographic, {
            ...base,
            title: htmlToText(infographic.elements.title.value),
            body: htmlToText(infographic.elements.footnote.value),
          })
        )
      }
    }
  }
  return entries
}

// A page is searchable when it has an intro or a resource list; utility pages
// such as the basket and checkout have neither.
const pageEntries = (page) => {
  const [intro] = linked(page.elements.intro)
  const resourceLists = linked(page.elements.resources)
  if (!intro && resourceLists.length === 0) return []

  const name = page.elements.title?.value || page.system.name
  const url = pagePath(page)
  const sections = linked(page.elements.body)
  const infoBlocks = sections.filter((s) => s.system.type === 'info_block')
  const title = intro ? intro.elements.title.value : name
  const base = { name, title, url }

  const entries = [
    entry(page, {
      ...base,
      subtitle: intro?.elements.subtitle.value,
      body: htmlToText(
        intro
          ? intro.elements.description.value
          : infoBlocks[0]?.elements.content.value
      ),
    }),
  ]
  for (const block of infoBlocks) {
    entries.push(...infoBlockEntries(block, base))
  }
  for (const references of linked(page.elements.references)) {
    entries.push(
      entry(references, {
        ...base,
        body: htmlToText(references.elements.references.value),
      })
    )
  }
  for (const list of resourceLists) {
    for (const resource of linked(list.elements.resources)) {
      entries.push(
        entry(resource, {
          ...base,
          title: resource.elements.title.value,
          body: resource.elements.description.value,
        })
      )
    }
  }
  return entries
}

const eventLandingEntries = (landing) => {
  const name =
    landing.elements.seo__title?.value ||
    landing.system.name ||
    landing.elements.title?.value
  const url = pagePath(landing)
  return [
    entry(landing, { name, title: landing.elements.title?.value, url }),
    ...linked(landing.elements.events).map((events) =>
      entry(events, {
        name,
        title: events.elements.title.value,
        body: events.elements.description.value,
        url,
      })
    ),
  ]
}

const buildSearchIndex = ({ pages, eventLandings }, language) => {
  const inLanguage = (node) => node.system.language === language
  return [
    ...eventLandings.nodes.filter(inLanguage).flatMap(eventLandingEntries),
    ...pages.nodes.filter(inLanguage).flatMap(pageEntries),
  ]
}

module.exports = {
  SEARCH_INDEX_QUERY,
  buildSearchIndex,
  eventLandingEntries,
  pageEntries,
}
