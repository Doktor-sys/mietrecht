# Mutation Testing Setup

## Overview
This document describes the setup for mutation testing in the SmartLaw backend services using Stryker.

## Setup Instructions
1. Install Stryker packages:
   ```bash
   npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
   ```

2. Run mutation tests:
   ```bash
   npm run test:mutation
   ```

## Configuration
The Stryker configuration is defined in `stryker.conf.json` and includes:
- Jest test runner configuration
- File mutation patterns
- Test thresholds

## Test Execution
Mutation testing can be executed using:
```bash
npm run test:mutation
```

This will run the mutation tests and generate a detailed report in the `reports/mutation` directory.