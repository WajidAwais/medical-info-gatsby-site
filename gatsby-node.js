require('dotenv').config()

const path = require('path')
const { SEARCH_INDEX_QUERY, buildSearchIndex } = require('./gatsby/search-index')
const { isHomeSlug, pageSlug } = require('./src/utils/paths')

const SITE_PAGES_QUERY = `
  query SitePages {
    pages: allKontentItemSite {
      nodes {
        elements {
          subpages {
            value {
              ... on kontent_item_page {
                system {
                  id
                  codename
                  language
                  type
                }
                elements {
                  url {
                    value
                  }
                  title {
                    value
                  }
                }
              }
              ... on kontent_item_event_landing {
                system {
                  id
                  codename
                  language
                  type
                }
                elements {
                  seo__title {
                    value
                  }
                  seo__slug {
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

const runQuery = async (graphql, query) => {
  const { data, errors } = await graphql(query)
  if (errors) {
    throw new Error(errors.map((error) => error.message).join('\n'))
  }
  return data
}

exports.createPages = async ({ actions, graphql }) => {
  const { createPage } = actions
  const isPreview = process.env.ENVIRONMENT === 'development'
  const data = await runQuery(graphql, SITE_PAGES_QUERY)

  const languages = new Set()

  data.pages.nodes.forEach((node) => {
    node.elements.subpages.value.forEach((page) => {
      if (!page.system) return
      const {
        system: { id: pageID, codename, type, language },
      } = page

      languages.add(language)

      const pageTemplatePath =
        type === 'event_landing'
          ? './src/templates/event-landing-template.js'
          : './src/templates/page-template.js'
      const slug = pageSlug(page)
      const routeSlug = page.elements.url && isHomeSlug(slug) ? '' : slug
      const regionalPath = language !== 'en' ? `/${language}` : ''
      const pageTitle = page.elements.title
        ? page.elements.title.value.trim()
        : page.elements.seo__title?.value.trim()

      createPage({
        path: `${regionalPath}/${routeSlug}`,
        component: require.resolve(pageTemplatePath),
        context: {
          languageCode: language,
          pageID,
          pageTitle,
          pageSlug: routeSlug,
          codename,
        },
      })
      if (isPreview) {
        // Kontent Web Spotlight opens pages under /preview/<language>/…
        createPage({
          path:
            type === 'event_landing'
              ? `/preview/${language}/${pageID}`
              : `/preview/${language}/${slug}`,
          component: require.resolve(pageTemplatePath),
          context: { languageCode: language, pageID, pageTitle, codename },
        })
      }
    })
  })

  if (languages.size === 0) return

  const searchSource = await runQuery(graphql, SEARCH_INDEX_QUERY)

  for (const language of languages) {
    createPage({
      path: language === 'en' ? '/search' : `/${language}/search`,
      component: path.resolve(`./src/templates/client-search-template.js`),
      context: {
        languageCode: language,
        searchData: {
          data: buildSearchIndex(searchSource, language),
          options: {
            indexStrategy: 'Prefix match',
            searchSanitizer: 'Lower Case',
            SearchByTerm: true,
          },
        },
      },
    })

    createPage({
      path: language === 'en' ? '/sitemap' : `/${language}/sitemap`,
      component: path.resolve(`./src/templates/site-map-template.js`),
      context: { languageCode: language },
    })
    if (isPreview) {
      createPage({
        path: `/preview/${language}/sitemap`,
        component: path.resolve(`./src/templates/site-map-template.js`),
        context: { languageCode: language },
      })
    }
  }
}
