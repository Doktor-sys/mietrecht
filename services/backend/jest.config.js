module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
    '!src/tests/**/*',
    '!src/config/**/*',
    '!src/types/**/*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testTimeout: 10000,
  maxWorkers: '50%',
  verbose: true,
  moduleNameMapper: {
    '^@smartlaw/types$': '<rootDir>/../../shared/types/src',
    '^@smartlaw/utils$': '<rootDir>/../../shared/utils/src',
    '^@tensorflow/tfjs-node$': '<rootDir>/src/tests/mocks/tfjs-node.ts',
  },
  // Test environment specific settings
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  // Parallel test execution settings
  maxConcurrency: 5,
  // Test result processing
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports',
      outputName: 'jest-junit.xml'
    }]
  ]
}