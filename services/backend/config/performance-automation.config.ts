// Performance-Automatisierungskonfiguration
export const PERFORMANCE_AUTOMATION_CONFIG = {
  // Monitoring-Einstellungen
  monitoring: {
    interval: 30000, // 30 Sekunden
    metricsRetention: 86400000, // 24 Stunden in Millisekunden
    alertThresholds: {
      cpuUsage: 80, // Prozent
      memoryUsage: 85, // Prozent
      errorRate: 5, // Prozent
      responseTime: 2000 // Millisekunden
    }
  },
  
  // Profiling-Einstellungen
  profiling: {
    interval: 60000, // 1 Minute
    memorySnapshotInterval: 300000, // 5 Minuten
    exportPath: './reports/profiling',
    exportFormat: 'json'
  },
  
  // Load-Test-Einstellungen
  loadTesting: {
    default: {
      targetUrl: 'http://localhost:3000/api/health',
      concurrency: 10,
      requestsPerSecond: 20,
      duration: 60, // Sekunden
      method: 'GET'
    },
    stressTest: {
      baseUrl: 'http://localhost:3000',
      maxConcurrency: 100,
      stepSize: 10,
      stepDuration: 30 // Sekunden
    },
    spikeTest: {
      baselineConcurrency: 10,
      spikeConcurrency: 50,
      spikeDuration: 60 // Sekunden
    }
  },
  
  // Berichterstattung
  reporting: {
    enabled: true,
    format: 'text', // text, json, html
    outputPath: './reports',
    retentionDays: 30,
    emailNotifications: {
      enabled: false,
      recipients: [],
      smtpConfig: {}
    }
  },
  
  // Automatisierte Aktionen
  automatedActions: {
    scaleUpThreshold: 90, // Prozent
    scaleDownThreshold: 30, // Prozent
    restartOnCriticalError: true,
    backupBeforeRestart: true
  },
  
  // Integrationen
  integrations: {
    slack: {
      enabled: false,
      webhookUrl: '',
      channel: '#performance-alerts'
    },
    pagerduty: {
      enabled: false,
      integrationKey: ''
    },
    prometheus: {
      enabled: true,
      endpoint: '/metrics',
      port: 9090
    }
  },
  
  // Zeitpläne
  schedules: {
    dailyReport: '0 0 * * *', // Täglich um Mitternacht
    weeklyReport: '0 0 * * 1', // Wöchentlich am Montag um Mitternacht
    monthlyReport: '0 0 1 * *', // Monatlich am ersten Tag um Mitternacht
    performanceAudit: '0 2 * * 0' // Wöchentlich am Sonntag um 2 Uhr
  }
};