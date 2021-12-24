const React = require('react')
const ThemeProvider = require('./src/context/ThemeContext').ThemeProvider

exports.wrapPageElement = ({ element }) => {
  return <ThemeProvider>{element}</ThemeProvider>
}
