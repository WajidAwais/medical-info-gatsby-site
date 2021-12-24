// Offline stand-in for @kontent-ai/gatsby-source, enabled with
// KONTENT_MOCK=1. It sources nodes from fixtures/kontent and publishes the
// two Delivery API responses the browser asks for (languages, translations)
// as static files, so a build never talks to Kontent.
const fs = require('fs')
const path = require('path')
const {
  buildDeliveryItems,
  deliveryResponse,
  languagesResponse,
  loadFixtures,
  schemaFor,
  toNodeData,
} = require('./lib/fixtures')

exports.pluginOptionsSchema = ({ Joi }) =>
  Joi.object({
    path: Joi.string().required(),
    projectId: Joi.string().required(),
    logoReplacement: Joi.string(),
  })

exports.createSchemaCustomization = ({ actions }, { path: dir }) => {
  const { types } = loadFixtures(dir)
  actions.createTypes(schemaFor(types))
}

exports.sourceNodes = (
  { actions, createNodeId, createContentDigest },
  { path: dir }
) => {
  const deliveryItems = buildDeliveryItems(loadFixtures(dir))
  const nodeKey = (language, codename) => `${language}:${codename}`
  const nodeIds = new Map(
    deliveryItems.map(({ system }) => [
      nodeKey(system.language, system.codename),
      createNodeId(`kontent_item_${system.language}_${system.id}`),
    ])
  )

  for (const deliveryItem of deliveryItems) {
    const { language, codename, type } = deliveryItem.system
    const data = toNodeData(deliveryItem, (linked) =>
      nodeIds.get(nodeKey(language, linked))
    )
    actions.createNode({
      ...data,
      id: nodeIds.get(nodeKey(language, codename)),
      children: [],
      internal: {
        type: `kontent_item_${type}`,
        contentDigest: createContentDigest(data),
      },
    })
  }
}

const writeJson = (file, body) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(body))
}

const publishStaticFiles = (publicDir, { path: dir, projectId }) => {
  const fixtures = loadFixtures(dir)
  const deliveryItems = buildDeliveryItems(fixtures)
  const apiRoot = path.join(publicDir, 'mock-delivery', projectId)

  writeJson(
    path.join(apiRoot, 'languages'),
    languagesResponse(fixtures.languages)
  )
  // The browser asks for items/translations?language=xx; a static server
  // ignores the query string, so the default language's copy is served.
  const translations = deliveryResponse(
    'translations',
    fixtures.languages[0].codename,
    deliveryItems
  )
  if (translations) {
    writeJson(path.join(apiRoot, 'items', 'translations'), translations)
  }

  fs.cpSync(path.join(dir, 'assets'), path.join(publicDir, 'mock-assets'), {
    recursive: true,
  })
}

exports.onPostBootstrap = ({ store }, options) => {
  publishStaticFiles(
    path.join(store.getState().program.directory, 'public'),
    options
  )
}

exports.onPostBuild = ({ store }, options) => {
  publishStaticFiles(
    path.join(store.getState().program.directory, 'public'),
    options
  )
}

// Fixture builds must not ship the client's logo, so swap it for a neutral one.
exports.onCreateWebpackConfig = ({ actions, plugins }, { logoReplacement }) => {
  if (!logoReplacement) return
  actions.setWebpackConfig({
    plugins: [
      plugins.normalModuleReplacement(
        /assets[\\/]images[\\/]edwards-logo\.svg$/,
        logoReplacement
      ),
    ],
  })
}
