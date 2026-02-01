# Testing Best Practices

## Overview

This document outlines the best practices for testing the SmartLaw Mietrecht Agent backend. These practices ensure high-quality, maintainable, and reliable tests that provide confidence in the system's correctness.

## General Principles

### Write Tests First
- Follow Test-Driven Development (TDD) where applicable
- Write tests before implementing features
- Use tests to define requirements and expected behavior

### Keep Tests Simple
- Each test should verify one behavior
- Avoid complex setup logic in tests
- Focus on readability and maintainability

### Make Tests Reliable
- Tests should produce consistent results
- Avoid dependencies on external factors
- Handle timing issues appropriately

## Test Structure

### AAA Pattern
Always follow the Arrange-Act-Assert pattern:

```typescript
it('should calculate rent reduction correctly', () => {
  // Arrange
  const calculator = new RentReductionCalculator();
  const monthlyRent = 1000;
  const defectDuration = 30; // days
  
  // Act
  const reduction = calculator.calculate(monthlyRent, defectDuration);
  
  // Assert
  expect(reduction).toBe(100); // 10% reduction for 30 days
});
```

### Descriptive Test Names
Use clear, descriptive names that explain what is being tested:

```typescript
// Good
it('should return 401 when user provides invalid credentials', () => { ... });

// Bad
it('should fail login', () => { ... });
```

## Unit Testing Best Practices

### Test Public Interface
- Test the public API of your modules
- Avoid testing private implementation details
- Focus on behavior rather than implementation

### Use Appropriate Test Doubles
- **Stubs**: Provide canned responses
- **Mocks**: Verify interactions
- **Spies**: Record method calls
- **Fakes**: Simplified implementations

```typescript
// Example: Using a mock to verify interaction
it('should call notification service when document is processed', () => {
  const notificationService = mock<NotificationService>();
  const documentService = new DocumentService(notificationService);
  
  documentService.processDocument(document);
  
  verify(notificationService.sendDocumentProcessedNotification(document.id)).once();
});
```

### Test Edge Cases
- Empty inputs
- Null/undefined values
- Boundary conditions
- Error conditions

```typescript
describe('RentCalculator', () => {
  it('should handle zero rent', () => {
    const calculator = new RentCalculator();
    expect(calculator.calculate(0, 30)).toBe(0);
  });
  
  it('should handle negative rent', () => {
    const calculator = new RentCalculator();
    expect(() => calculator.calculate(-100, 30)).toThrow('Rent cannot be negative');
  });
});
```

## Integration Testing Best Practices

### Test Real Interactions
- Use actual service implementations where possible
- Test with real databases (test instances)
- Validate end-to-end flows

### Manage Test Data
- Create isolated test data for each test
- Clean up test data after tests
- Use transactions for database tests

```typescript
describe('DocumentService Integration', () => {
  let db: Database;
  
  beforeEach(async () => {
    db = await createTestDatabase();
  });
  
  afterEach(async () => {
    await db.cleanup();
  });
  
  it('should save and retrieve document', async () => {
    const document = createTestDocument();
    const savedDocument = await documentService.save(document);
    const retrievedDocument = await documentService.findById(savedDocument.id);
    
    expect(retrievedDocument).toEqual(savedDocument);
  });
});
```

### Handle External Dependencies
- Use test environments for external services
- Mock only when necessary
- Test failure scenarios

## End-to-End Testing Best Practices

### Test User Workflows
- Focus on complete user journeys
- Test both happy paths and error paths
- Use realistic test data

```typescript
describe('Tenant Journey', () => {
  it('should allow tenant to upload document and get legal advice', async () => {
    // 1. Register user
    const user = await registerUser(testUserData);
    
    // 2. Login
    const authToken = await loginUser(user.credentials);
    
    // 3. Upload document
    const document = await uploadDocument(authToken, testDocument);
    
    // 4. Get legal analysis
    const analysis = await analyzeDocument(authToken, document.id);
    
    // 5. Verify results
    expect(analysis.issues).toContain('Heating defect');
  });
});
```

### Maintain Test Data
- Create test users with unique identifiers
- Clean up test data after tests
- Use test-specific environments

## Performance Testing Best Practices

### Define Performance Goals
- Set realistic performance targets
- Define acceptable response times
- Establish throughput requirements

### Monitor Key Metrics
- Response time percentiles (p50, p95, p99)
- Error rates
- Throughput
- Resource utilization

### Test Under Load
- Simulate expected user load
- Test peak usage scenarios
- Identify performance bottlenecks

```typescript
// Example load test scenario
const loadTestScenario = {
  name: 'Document Processing Load Test',
  targetRps: 100,
  duration: '5m',
  steps: [
    {
      name: 'Upload Document',
      weight: 30,
      fn: async () => {
        const response = await api.post('/documents/upload', testDocument);
        expect(response.status).toBe(201);
      }
    },
    {
      name: 'Analyze Document',
      weight: 70,
      fn: async (context) => {
        const response = await api.post(`/documents/${context.documentId}/analyze`);
        expect(response.status).toBe(200);
      }
    }
  ]
};
```

## Mocking Best Practices

### Mock at the Right Level
- Mock at service boundaries
- Avoid mocking internal implementation details
- Mock external dependencies

### Use Realistic Mocks
- Provide realistic test data
- Simulate real-world error conditions
- Maintain consistency between mocks and real services

```typescript
// Good: Realistic mock that simulates real service behavior
const mockDocumentService = {
  analyze: jest.fn().mockImplementation(async (document) => {
    if (document.size > MAX_DOCUMENT_SIZE) {
      throw new Error('Document too large');
    }
    return { issues: ['Heating defect'], recommendations: [] };
  })
};

// Bad: Overly simplistic mock
const mockDocumentService = {
  analyze: jest.fn().mockResolvedValue({ issues: [], recommendations: [] })
};
```

### Verify Interactions Appropriately
- Verify important interactions
- Avoid over-verification
- Focus on behavior rather than implementation

## Test Data Management

### Use Factories
- Create test data factories for consistency
- Generate realistic test data
- Support variations and edge cases

```typescript
// Test data factory
const createUser = (overrides = {}) => ({
  id: uuid(),
  email: 'test@example.com',
  password: 'secure-password',
  userType: 'tenant',
  createdAt: new Date(),
  ...overrides
});

// Usage
const tenantUser = createUser({ userType: 'tenant' });
const landlordUser = createUser({ userType: 'landlord' });
```

### Isolate Test Data
- Use unique identifiers for each test
- Clean up test data after tests
- Avoid shared test data between tests

## Code Quality in Tests

### Avoid Code Duplication
- Extract common setup into helper functions
- Use test utilities for repeated patterns
- Share setup code between related tests

```typescript
// Test utility function
const setupAuthenticatedUser = async (userType = 'tenant') => {
  const user = await userService.register({
    email: `test-${uuid()}@example.com`,
    password: 'secure-password',
    userType
  });
  
  const token = await authService.login(user.email, 'secure-password');
  return { user, token };
};

// Usage in tests
it('should allow tenants to upload documents', async () => {
  const { user, token } = await setupAuthenticatedUser('tenant');
  // Test implementation
});
```

### Maintain Readability
- Use clear variable names
- Add comments for complex setup
- Keep test functions focused

## Continuous Integration

### Fast Feedback
- Run fast tests first
- Parallelize test execution
- Fail fast on critical issues

### Reliable Builds
- Use consistent test environments
- Avoid flaky tests
- Monitor test execution times

### Coverage Requirements
- Maintain minimum coverage thresholds
- Track coverage trends
- Block merges for coverage drops

## Debugging and Maintenance

### Handle Test Failures
- Provide clear error messages
- Include relevant context in failures
- Make failures easy to reproduce

### Refactor Tests
- Keep tests up to date with code changes
- Refactor tests like production code
- Remove obsolete tests

### Monitor Test Health
- Track test execution times
- Monitor failure rates
- Identify and fix flaky tests

## Security Testing

### Authentication Testing
- Test login with valid credentials
- Test login with invalid credentials
- Test session management
- Test password reset flows

### Authorization Testing
- Test access controls
- Verify role-based permissions
- Test data isolation between users

### Input Validation Testing
- Test with malicious input
- Verify input sanitization
- Check for injection vulnerabilities

## Documentation and Knowledge Sharing

### Document Test Strategies
- Explain testing approaches
- Document test environment setup
- Record testing decisions

### Share Knowledge
- Conduct test reviews
- Share test results and insights
- Provide training on testing practices

## Conclusion

Following these best practices will help ensure that tests are reliable, maintainable, and provide confidence in the system's correctness. Regular review and updates to these practices will help the team adapt to changing requirements and improve testing effectiveness over time.