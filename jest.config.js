module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': '<rootDir>/test/jest-preprocess.js',
  },
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(svg|png|jpg|gif|pdf)$': '<rootDir>/test/__mocks__/file-mock.js',
    '^gatsby$': '<rootDir>/test/__mocks__/gatsby.js',
    '^gatsby-plugin-image$': '<rootDir>/test/__mocks__/gatsby-plugin-image.js',
    '^@reach/router$': '<rootDir>/test/__mocks__/reach-router.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/\\.cache/', '/public/'],
  transformIgnorePatterns: [
    'node_modules/(?!(gatsby|gatsby-script|gatsby-link)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  globals: {
    __PATH_PREFIX__: '',
  },
}
