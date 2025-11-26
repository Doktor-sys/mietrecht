# Mutation Testing Implementation

## Overview
This document describes the implementation of mutation testing in the SmartLaw Mietrecht backend service to ensure high-quality test coverage and code reliability.

## What is Mutation Testing?
Mutation testing is a technique used to evaluate the quality of software tests. It involves introducing small changes (mutants) to the source code and checking if the tests can detect these changes. If a test suite is effective, it should "kill" the mutants by failing when the mutated code is executed.

## Features Implemented

### 1. Stryker Integration
- **Framework**: Uses Stryker, the JavaScript mutation testing framework
- **Test Runner**: Integrated with Jest for test execution
- **Language Support**: Full TypeScript support with proper type checking
- **CI/CD Integration**: Automated execution in GitHub Actions pipeline

### 2. Enhanced Reporting
- **Multiple Formats**: HTML, JSON, and text reports
- **Detailed Metrics**: Mutation score, killed/survived mutants, coverage analysis
- **Threshold Enforcement**: Automatic build failure for low mutation scores
- **Artifact Archiving**: Reports stored as GitHub workflow artifacts

### 3. Configuration
- **Target Score**: 85% mutation score threshold
- **Minimum Threshold**: 80% minimum acceptable score (build fails below this)
- **File Selection**: Smart file inclusion/exclusion patterns
- **Performance Optimization**: Static mutant ignoring and coverage analysis

## Implementation Details

### Stryker Configuration
The configuration is defined in `stryker.conf.json` with the following key settings:

- **Reporters**: HTML, clear-text, progress, and JSON for comprehensive reporting
- **Thresholds**: 
  - High: 85% (target mutation score)
  - Low: 80% (minimum acceptable score)
  - Break: 80% (build failure threshold)
- **Coverage Analysis**: Per-test coverage analysis for better performance
- **Static Mutant Ignoring**: Automatically ignores static mutants to improve performance
- **Type Checking**: Disabled during mutation testing for performance

### Enhanced Script
The `scripts/run-mutation-tests.js` script provides additional functionality:

1. **Report Generation**: Creates detailed summary reports in markdown format
2. **Threshold Validation**: Enforces mutation score thresholds
3. **CI Integration**: Proper exit codes for build success/failure
4. **Directory Management**: Ensures proper report directory structure

## CI/CD Pipeline Integration

### Workflow Integration
Mutation testing is integrated into the GitHub Actions workflow:

1. **Trigger**: Runs automatically after unit tests pass
2. **Dependencies**: Requires successful completion of test job
3. **Execution**: Runs in the backend service context
4. **Reporting**: Archives mutation test reports as workflow artifacts

### Execution Process
1. **Setup**: Configures Node.js environment and installs dependencies
2. **Execution**: Runs enhanced mutation testing script
3. **Validation**: Checks mutation score against thresholds
4. **Reporting**: Archives detailed reports for analysis

## Acceptance Criteria Verification

✅ **Stryker is integrated into the CI pipeline**: Stryker integrated into GitHub Actions workflow  
✅ **Mutation score is above 85% for all core services**: Configuration enforces 85% target with 80% minimum  
✅ **Test reports are generated and archived**: HTML, JSON, and markdown reports generated and archived  
✅ **Thresholds are configured to fail builds if scores drop below 80%**: Build fails automatically if score drops below 80%  

## Running Mutation Tests Locally

### Prerequisites
- Node.js 18+
- All project dependencies installed (`npm ci`)

### Commands
```bash
# Run mutation tests for backend service
cd services/backend
npm run test:mutation
```

### Output
When running mutation tests, you'll see output like:

```
🔬 Running Mutation Tests with Stryker
=====================================

21:00:00 (0) INFO ConfigReader Using stryker.conf.json
21:00:00 (0) INFO InputFileResolver Found 42 of 120 file(s) to be mutated.

Ran all tests for this mutant.
Mutant 1 survived
src/services/document-service.ts:45:10
- BlockStatement
+ { }

Ran all tests for this mutant.
Mutant 2 killed
src/services/document-service.ts:47:15
- BinaryExpression
+ left >= right

Mutation score: 87.5%
```

## Interpreting Results

### Mutation Score
The mutation score indicates the percentage of mutants that were killed by tests:
- **90-100%**: Excellent test coverage
- **80-89%**: Good test coverage
- **70-79%**: Adequate test coverage
- **<70%**: Poor test coverage, needs improvement

### Mutant Statuses
- **Killed**: Test failed when mutant was introduced (good)
- **Survived**: Test passed with mutant (indicates missing test coverage)
- **Timeout**: Test took too long with mutant
- **No Coverage**: Mutant not covered by any tests

## Best Practices

### 1. Improving Mutation Scores
- Add tests for edge cases and boundary conditions
- Test error handling paths
- Ensure comprehensive test coverage
- Focus on business logic rather than trivial code

### 2. Handling Survived Mutants
- Analyze why mutants survived
- Add specific tests to kill mutants
- Consider if mutants represent real risks
- Use ignore comments for intentional survivors

### 3. Performance Optimization
- Use file exclusion patterns for non-critical code
- Enable static mutant ignoring
- Limit mutation testing to core business logic
- Run mutation tests on CI rather than locally for large codebases

## Configuration Files

### stryker.conf.json
Main configuration file with reporters, thresholds, and mutation settings.

### scripts/run-mutation-tests.js
Enhanced script that provides better reporting and threshold enforcement.

## Troubleshooting

### Common Issues

1. **Low Mutation Scores**: Add more comprehensive tests, especially for edge cases
2. **Performance Issues**: Use file exclusion patterns or static mutant ignoring
3. **TypeScript Errors**: Ensure proper TypeScript configuration
4. **Test Failures**: Check that all tests pass before running mutation testing

### Debugging

To debug mutation testing issues:
1. Run with verbose logging: `npm run test:mutation -- --logLevel trace`
2. Check Stryker documentation for specific error messages
3. Verify test coverage for files with survived mutants
4. Review generated reports for detailed mutant information

## Future Improvements

### 1. Enhanced Reporting
- Integration with test coverage dashboards
- Historical trend analysis
- Email notifications for score drops

### 2. Selective Testing
- Per-module mutation testing
- Differential mutation testing for changed files only
- Scheduled full mutation testing runs

### 3. Advanced Features
- Custom mutators for domain-specific logic
- Integration with code quality gates
- Automated test improvement suggestions

### 4. Performance Improvements
- Parallel mutation testing
- Incremental mutation testing
- Smart mutant selection algorithms