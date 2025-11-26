// Test Environment Setup
beforeAll(async () => {
  // Setze Test-spezifische Umgebungsvariablen
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5432/smartlaw_test'
  process.env.REDIS_URL = 'redis://localhost:6379/1'
  
  // Setze Performance-Test Timeout
  jest.setTimeout(30000)
})

afterAll(async () => {
  // Cleanup nach allen Tests
})

// Mock für externe Services in Tests
jest.mock('../config/database', () => ({
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
  },
}))

jest.mock('../config/redis', () => ({
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
  redis: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}))

// Mock für WebSocket Service
jest.mock('../services/WebSocketService', () => ({
  WebSocketService: jest.fn().mockImplementation(() => ({
    broadcast: jest.fn(),
    sendToUser: jest.fn(),
  })),
}))

// Mock für externe APIs
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      }
    }
  }))
})

// Mock für Dateien
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readFile: jest.fn().mockResolvedValue('test content'),
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  }
}))

// Mock für Netzwerkaufrufe
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}))