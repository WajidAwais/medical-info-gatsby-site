const React = require('react')
const ThemeProvider = require('./src/context/ThemeContext').ThemeProvider

exports.wrapPageElement = ({ element }) => {
  return <ThemeProvider>{element}</ThemeProvider>
}

const languages = (process.env.GATSBY_KONTENT_LANGUAGE_CODENAMES || 'en')
  .split(',')
  .map((language) => language.trim())

// Pages live under /<language>/ except the default (first) language.
const languageForPathname = (pathname) => {
  const [firstSegment] = (pathname || '').split('/').filter(Boolean)
  return languages.includes(firstSegment) ? firstSegment : languages[0]
}

exports.onRenderBody = ({ pathname, setHeadComponents, setHtmlAttributes }) => {
  setHtmlAttributes({ lang: languageForPathname(pathname) })

  // The stylesheets name Merriweather Sans but nothing loaded it.
  const fontHead = [
    <link
      key="fonts-preconnect"
      rel="preconnect"
      href="https://fonts.googleapis.com"
    />,
    <link
      key="fonts-static"
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossOrigin="anonymous"
    />,
    <link
      key="fonts"
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Merriweather+Sans:wght@300;400;600;700&display=swap"
    />,
  ]

  // Fixture builds must not load the client's Marketo forms.
  if (process.env.GATSBY_KONTENT_MOCK === '1') {
    setHeadComponents(fontHead)
    return
  }
  setHeadComponents([
    ...fontHead,
    <script
      key="marketo-forms"
      defer={true}
      src="//info.edwards.com/js/forms2/js/forms2.min.js"
    ></script>,
  ])
}
