module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\.(ts|tsx)$': 'ts-jest',
    '^.+\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!axios)/'
  ],
  moduleNameMapper: {
    '\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {
    html: '<!DOCTYPE html><html><head></head><body></body></html>'
  }
};