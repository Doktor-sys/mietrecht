module.exports = {
  apps: [
    {
      name: 'mietrecht-api-gateway',
      script: './services/api-gateway/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      cwd: './services/api-gateway',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      error_file: './logs/api-gateway-err.log',
      out_file: './logs/api-gateway-out.log',
      log_file: './logs/api-gateway-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      kill_timeout: 5000,
      listen_timeout: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=512 --expose-gc'
    },
    {
      name: 'mietrecht-auth-service',
      script: './services/auth-service/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      cwd: './services/auth-service',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      error_file: './logs/auth-service-err.log',
      out_file: './logs/auth-service-out.log',
      log_file: './logs/auth-service-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      kill_timeout: 5000,
      listen_timeout: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=512 --expose-gc'
    },
    {
      name: 'mietrecht-backend',
      script: './services/backend/dist/index.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      cwd: './services/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      kill_timeout: 5000,
      listen_timeout: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=512 --expose-gc'
    },
    {
      name: 'mietrecht-ai-service',
      script: './services/ai-service/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      cwd: './services/ai-service',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3003
      },
      error_file: './logs/ai-service-err.log',
      out_file: './logs/ai-service-out.log',
      log_file: './logs/ai-service-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      kill_timeout: 5000,
      listen_timeout: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024 --expose-gc'
    },
    {
      name: 'mietrecht-data-sources',
      script: './services/data-sources/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      cwd: './services/data-sources',
      env: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3004
      },
      error_file: './logs/data-sources-err.log',
      out_file: './logs/data-sources-out.log',
      log_file: './logs/data-sources-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      kill_timeout: 5000,
      listen_timeout: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=512 --expose-gc'
    }
  ]
};