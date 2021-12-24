const React = require('react')

const gatsby = jest.requireActual('gatsby')

module.exports = {
  ...gatsby,
  graphql: jest.fn(),
  Link: jest.fn(({ activeClassName, activeStyle, getProps, partiallyActive, replace, to, ...rest }) =>
    React.createElement('a', { ...rest, href: to })
  ),
  navigate: jest.fn(),
  useStaticQuery: jest.fn(),
}
