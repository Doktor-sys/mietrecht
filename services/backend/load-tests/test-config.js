// Test configuration for different environments
export const testConfig = {
  // Development environment
  development: {
    baseUrl: 'http://localhost:3000/api',
    testUsers: 10,
    testDuration: '2m',
    thresholds: {
      http_req_duration: ['p(95)<3000'],
      errors: ['rate<0.01']
    }
  },
  
  // Staging environment
  staging: {
    baseUrl: 'https://staging-api.example.com/api',
    testUsers: 50,
    testDuration: '5m',
    thresholds: {
      http_req_duration: ['p(95)<4000'],
      errors: ['rate<0.01']
    }
  },
  
  // Production environment
  production: {
    baseUrl: 'https://api.example.com/api',
    testUsers: 100,
    testDuration: '10m',
    thresholds: {
      http_req_duration: ['p(95)<5000'],
      errors: ['rate<0.01']
    }
  },
  
  // Stress test configuration
  stress: {
    baseUrl: 'http://localhost:3000/api',
    testUsers: 200,
    testDuration: '3m',
    thresholds: {
      http_req_duration: ['p(95)<8000'],
      errors: ['rate<0.05']
    }
  }
};

// Test data templates
export const testData = {
  documentIds: [
    'doc-001',
    'doc-002',
    'doc-003',
    'doc-004',
    'doc-005'
  ],
  
  caseIds: [
    'case-001',
    'case-002',
    'case-003',
    'case-004',
    'case-005'
  ],
  
  clientProfiles: [
    {
      id: 'client-001',
      type: 'TENANT',
      location: 'Berlin'
    },
    {
      id: 'client-002',
      type: 'LANDLORD',
      location: 'Hamburg'
    }
  ],
  
  lawyerProfiles: [
    {
      id: 'lawyer-001',
      specializations: ['RENT_REDUCTION', 'TERMINATION'],
      location: 'Berlin',
      rating: 4.5
    },
    {
      id: 'lawyer-002',
      specializations: ['RENT_INCREASE', 'UTILITY_COSTS'],
      location: 'Hamburg',
      rating: 4.2
    }
  ]
};

// Performance metrics to track
export const performanceMetrics = {
  responseTime: {
    target: '<5000ms',
    warning: '<3000ms',
    critical: '>8000ms'
  },
  
  errorRate: {
    target: '<1%',
    warning: '<0.5%',
    critical: '>5%'
  },
  
  throughput: {
    target: '>50 req/s',
    warning: '>30 req/s',
    critical: '<10 req/s'
  }
};

// Test scenarios
export const testScenarios = {
  smokeTest: {
    description: 'Quick smoke test to verify basic functionality',
    vus: 5,
    duration: '1m',
    functions: ['basicFunctionalityTest']
  },
  
  loadTest: {
    description: 'Standard load test with typical user load',
    vus: 50,
    duration: '5m',
    functions: ['fullLoadTest']
  },
  
  stressTest: {
    description: 'Stress test to find breaking point',
    vus: 200,
    duration: '3m',
    functions: ['stressTest']
  },
  
  soakTest: {
    description: 'Long duration test to identify memory leaks',
    vus: 30,
    duration: '1h',
    functions: ['soakTest']
  },
  
  spikeTest: {
    description: 'Sudden spike in traffic',
    stages: [
      { duration: '1m', target: 10 },
      { duration: '10s', target: 100 },
      { duration: '1m', target: 100 },
      { duration: '10s', target: 10 },
      { duration: '1m', target: 10 }
    ],
    functions: ['spikeTest']
  }
};