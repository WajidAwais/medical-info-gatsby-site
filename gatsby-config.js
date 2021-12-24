require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`,
})

require('dotenv').config()

// KONTENT_MOCK=1 builds the site from fixtures/kontent instead of the
// Kontent Delivery API, so it can be built and tested without credentials.
const useFixtures = process.env.KONTENT_MOCK === '1'

if (useFixtures) {
  Object.assign(process.env, {
    GATSBY_KONTENT_MOCK: '1',
    GATSBY_KONTENT_PROJECT_ID: 'fixture-project',
    GATSBY_KONTENT_LANGUAGE_CODENAMES: 'en',
    GATSBY_DELIVERY_API_URL: '/mock-delivery/',
    GATSBY_HOME_PAGE_SLUGS: 'home',
  })
}

const languageCodenames = (process.env.GATSBY_KONTENT_LANGUAGE_CODENAMES || '')
  .split(',')
  .map((lang) => lang.trim())
  .filter(Boolean)

const contentSource = useFixtures
  ? {
      resolve: `gatsby-source-kontent-fixtures`,
      options: {
        path: `${__dirname}/fixtures/kontent`,
        projectId: process.env.GATSBY_KONTENT_PROJECT_ID,
        logoReplacement: `${__dirname}/fixtures/kontent/assets/demo-logo.svg`,
      },
    }
  : {
      resolve: `@kontent-ai/gatsby-source`,
      options: {
        projectId: process.env.GATSBY_KONTENT_PROJECT_ID,
        languageCodenames,
      },
    }

if (
  !useFixtures &&
  (!process.env.GATSBY_KONTENT_PROJECT_ID || !languageCodenames.length)
) {
  throw new Error(
    'Set GATSBY_KONTENT_PROJECT_ID and GATSBY_KONTENT_LANGUAGE_CODENAMES (see .env.example), or build with KONTENT_MOCK=1.'
  )
}

module.exports = {
  siteMetadata: {
    title: `Treating HF`,
    description: `Patienten mit Herzinsuffizienz können eine Trikuspidalinsuffizienz erleiden. Durch dieses klinische Problem werden die Anzahl an Hospitalisierungen infolge einer Herzinsuffizienz sowie das Sterblichkeitsrisiko erhöht, während die Lebensqualität der Patienten abnimmt. Durch eine frühe Diagnose der Trikuspidalinsuffizienz und eine optimale Behandlung kann das Überleben der Patienten verbessert werden.`,
    titleTemplate: `%s | Treating HF`,
    url: `https://treating-hf-valves.com/`,
    twitterUsername: `@EdwardsLifesci`,
    image: `/treatinghf-twitter.png`,
    trustArc: `https://consent.trustarc.com/notice?domain=edwards_ccpa.com&c=teconsent&js=nj&noticeType=bb&gtm=1`,
  },
  plugins: [
    contentSource,
    {
      resolve: `gatsby-plugin-sass`,
      options: {
        // The 7-1 stylesheets still use @import and darken(); Dart Sass
        // flags both on every file, which buries real build errors.
        sassOptions: {
          silenceDeprecations: [
            'legacy-js-api',
            'import',
            'color-functions',
            'global-builtin',
          ],
        },
      },
    },
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
  ],
}
