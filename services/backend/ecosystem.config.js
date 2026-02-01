module.exports = {
  apps: [
    {
      name: 'mietrecht-backend',
      script: './dist/index.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      cwd: './services/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      // Logging configuration
      error_file: '../logs/backend-err.log',
      out_file: '../logs/backend-out.log',
      log_file: '../logs/backend-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      
      // Cluster settings
      kill_timeout: 5000,
      listen_timeout: 5000,
      
      // Restart settings
      max_restarts: 10,
      min_uptime: '10s',
      
      // Memory management
      max_memory_restart: '512M',
      
      // Watch mode for development
      watch: false,
      
      // Node.js args
      node_args: '--max-old-space-size=512 --expose-gc'
    }
  ]
};