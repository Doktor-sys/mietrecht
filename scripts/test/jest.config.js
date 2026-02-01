module.exports = {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  collectCoverageFrom: [
    "scripts/**/*.js",
    "!scripts/test/**",
    "!scripts/public/**",
    "!scripts/reports/**"
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};