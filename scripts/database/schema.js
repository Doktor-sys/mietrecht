/**
 * Database Schema Definition
 * This file defines the database schema for the Mietrecht Agent.
 */

// Table: users
// Stores user accounts for the web interface
exports.usersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Passwort-Policy-Erweiterungen
  password_last_changed DATETIME DEFAULT CURRENT_TIMESTAMP,
  password_expires_at DATETIME,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until DATETIME,
  password_history TEXT, -- JSON array mit früheren Passwort-Hashes
  two_factor_secret TEXT, -- Secret für 2FA
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_password_reset_request DATETIME
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create index on account_locked_until for faster lock checks
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked_until) WHERE account_locked_until > datetime('now');

-- Create index on password_expires_at for faster expiration checks
CREATE INDEX IF NOT EXISTS idx_users_password_expires ON users(password_expires_at) WHERE password_expires_at IS NOT NULL;
`;

// Table: config
// Stores the application configuration
exports.configTable = `
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// Table: lawyers
// Stores information about lawyers
exports.lawyersTable = `
CREATE TABLE IF NOT EXISTS lawyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  law_firm TEXT,
  practice_areas TEXT, -- JSON array
  regions TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// Table: lawyer_preferences
// Stores preferences for each lawyer
exports.lawyerPreferencesTable = `
CREATE TABLE IF NOT EXISTS lawyer_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lawyer_id INTEGER NOT NULL,
  court_levels TEXT, -- JSON array
  topics TEXT, -- JSON array
  frequency TEXT,
  importance_threshold TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers (id) ON DELETE CASCADE
);
`;

// Table: court_decisions
// Stores information about court decisions
exports.courtDecisionsTable = `
CREATE TABLE IF NOT EXISTS court_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id TEXT UNIQUE NOT NULL, -- External ID from the source
  court TEXT NOT NULL,
  location TEXT,
  decision_date DATE,
  case_number TEXT,
  topics TEXT, -- JSON array
  summary TEXT,
  full_text TEXT,
  url TEXT,
  judges TEXT, -- JSON array
  practice_implications TEXT,
  importance TEXT,
  source TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// Table: user_interactions
// Stores user interactions for learning preferences
exports.userInteractionsTable = `
CREATE TABLE IF NOT EXISTS user_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lawyer_id INTEGER NOT NULL,
  decision_id INTEGER,
  interaction_type TEXT NOT NULL, -- 'view', 'click', 'download', 'share', etc.
  interaction_data TEXT, -- JSON object with additional data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers (id) ON DELETE CASCADE,
  FOREIGN KEY (decision_id) REFERENCES court_decisions (id) ON DELETE SET NULL
);
`;

// Table: dashboard_metrics
// Stores dashboard metrics for historical tracking
exports.dashboardMetricsTable = `
CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL,
  metric_value REAL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// Table: system_logs
// Stores system logs
exports.systemLogsTable = `
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  level TEXT NOT NULL,
  message TEXT NOT NULL
);
`;

// Table: data_source_status
// Stores the status of data sources
exports.dataSourceStatusTable = `
CREATE TABLE IF NOT EXISTS data_source_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  last_check DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// Indexes for better performance
exports.indexes = [
  "CREATE INDEX IF NOT EXISTS idx_lawyers_email ON lawyers(email);",
  "CREATE INDEX IF NOT EXISTS idx_court_decisions_decision_id ON court_decisions(decision_id);",
  "CREATE INDEX IF NOT EXISTS idx_court_decisions_decision_date ON court_decisions(decision_date);",
  "CREATE INDEX IF NOT EXISTS idx_court_decisions_importance ON court_decisions(importance);",
  "CREATE INDEX IF NOT EXISTS idx_court_decisions_court ON court_decisions(court);",
  "CREATE INDEX IF NOT EXISTS idx_court_decisions_location ON court_decisions(location);",
  "CREATE INDEX IF NOT EXISTS idx_court_decisions_case_number ON court_decisions(case_number);",
  "CREATE INDEX IF NOT EXISTS idx_court_decisions_processed ON court_decisions(processed);",
  "CREATE INDEX IF NOT EXISTS idx_court_decisions_created_at ON court_decisions(created_at);",
  "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);",
  "CREATE INDEX IF NOT EXISTS idx_user_interactions_lawyer_id ON user_interactions(lawyer_id);",
  "CREATE INDEX IF NOT EXISTS idx_user_interactions_decision_id ON user_interactions(decision_id);",
  "CREATE INDEX IF NOT EXISTS idx_user_interactions_interaction_type ON user_interactions(interaction_type);",
  "CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);",
  "CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);",
  "CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);",
  "CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_recorded_at ON dashboard_metrics(recorded_at);"
];

// Initial data to populate the database
exports.initialData = [
  // Default data source statuses
  `INSERT OR IGNORE INTO data_source_status (source_name, status) VALUES 
    ('bgh', 'unknown'),
    ('landgerichte', 'unknown'),
    ('bverfg', 'unknown'),
    ('beckOnline', 'unknown');`
];