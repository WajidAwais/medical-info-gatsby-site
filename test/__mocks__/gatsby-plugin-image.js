const React = require('react')

module.exports = {
  GatsbyImage: ({ alt }) => React.createElement('img', { alt }),
  StaticImage: ({ alt, src }) => React.createElement('img', { alt, src }),
  getImage: (image) => image,
}
