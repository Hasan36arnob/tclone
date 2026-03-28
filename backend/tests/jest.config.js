// Jest configuration for backend tests
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['./setup.js'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    '../controllers/**/*.js',
    '../middlewares/**/*.js',
    '../models/**/*.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
