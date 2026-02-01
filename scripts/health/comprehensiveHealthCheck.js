/**
 * Comprehensive Health Check Module
 * This module provides detailed health checks for all components of the Mietrecht Agent.
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { db } = require('../database/connection.js');

/**
 * Check database connectivity
 * @returns {Promise<Object>} Database health status
 */
async function checkDatabaseHealth() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    db.get('SELECT 1', [], (err) => {
      const responseTime = Date.now() - startTime;
      
      if (err) {
        resolve({
          status: 'unhealthy',
          component: 'database',
          error: err.message,
          responseTime: `${responseTime}ms`
        });
      } else {
        resolve({
          status: 'healthy',
          component: 'database',
          responseTime: `${responseTime}ms`
        });
      }
    });
  });
}

/**
 * Check disk space availability
 * @returns {Object} Disk space health status
 */
function checkDiskSpace() {
  try {
    const dbPath = path.join(__dirname, '..', 'database', 'data');
    const stats = fs.statSync(dbPath);
    
    // Get disk space information
    const freeSpace = os.freemem();
    const totalSpace = os.totalmem();
    const usedPercentage = ((totalSpace - freeSpace) / totalSpace * 100).toFixed(2);
    
    // Check if we have at least 100MB free
    const hasSufficientSpace = freeSpace > 100 * 1024 * 1024; // 100MB in bytes
    
    return {
      status: hasSufficientSpace ? 'healthy' : 'warning',
      component: 'disk-space',
      freeSpace: `${(freeSpace / (1024 * 1024)).toFixed(2)} MB`,
      totalSpace: `${(totalSpace / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      usedPercentage: `${usedPercentage}%`,
      message: hasSufficientSpace ? 'Sufficient disk space available' : 'Low disk space warning'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      component: 'disk-space',
      error: error.message
    };
  }
}

/**
 * Check memory usage
 * @returns {Object} Memory health status
 */
function checkMemoryUsage() {
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const usedMem = totalMem - freeMem;
  const usagePercentage = (usedMem / totalMem * 100).toFixed(2);
  
  // Warn if memory usage is above 80%
  const status = usagePercentage > 80 ? 'warning' : 'healthy';
  
  return {
    status,
    component: 'memory',
    free: `${(freeMem / (1024 * 1024)).toFixed(2)} MB`,
    used: `${(usedMem / (1024 * 1024)).toFixed(2)} MB`,
    total: `${(totalMem / (1024 * 1024)).toFixed(2)} MB`,
    usagePercentage: `${usagePercentage}%`,
    message: usagePercentage > 80 ? 'High memory usage' : 'Normal memory usage'
  };
}

/**
 * Check CPU usage
 * @returns {Object} CPU health status
 */
function checkCPUUsage() {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  
  // Calculate average CPU usage from load averages
  const oneMinuteLoad = loadAvg[0];
  const fiveMinuteLoad = loadAvg[1];
  const fifteenMinuteLoad = loadAvg[2];
  
  // Number of CPUs
  const cpuCount = cpus.length;
  
  // Normalize load averages by CPU count
  const normalizedOneMin = (oneMinuteLoad / cpuCount * 100).toFixed(2);
  const normalizedFiveMin = (fiveMinuteLoad / cpuCount * 100).toFixed(2);
  const normalizedFifteenMin = (fifteenMinuteLoad / cpuCount * 100).toFixed(2);
  
  // Consider healthy if normalized load is below 70%
  const status = normalizedOneMin > 70 ? 'warning' : 'healthy';
  
  return {
    status,
    component: 'cpu',
    loadAverage: {
      '1min': `${normalizedOneMin}%`,
      '5min': `${normalizedFiveMin}%`,
      '15min': `${normalizedFifteenMin}%`
    },
    cpuCount,
    message: normalizedOneMin > 70 ? 'High CPU load' : 'Normal CPU load'
  };
}

/**
 * Check file system permissions
 * @returns {Object} File system health status
 */
function checkFileSystemPermissions() {
  try {
    const dbDir = path.join(__dirname, '..', 'database', 'data');
    const dbPath = path.join(dbDir, 'mietrecht_agent.db');
    
    // Check if we can read the directory
    fs.accessSync(dbDir, fs.constants.R_OK);
    
    // Check if we can write to the directory (by attempting to create a temp file)
    const tempFile = path.join(dbDir, '.healthcheck.tmp');
    fs.writeFileSync(tempFile, 'test');
    fs.unlinkSync(tempFile);
    
    return {
      status: 'healthy',
      component: 'file-system',
      message: 'File system permissions are correct'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      component: 'file-system',
      error: error.message
    };
  }
}

/**
 * Check network connectivity
 * @returns {Object} Network health status
 */
function checkNetworkConnectivity() {
  try {
    const interfaces = os.networkInterfaces();
    let hasActiveInterface = false;
    
    // Check for active network interfaces
    Object.keys(interfaces).forEach(name => {
      interfaces[name].forEach(interface => {
        if (!interface.internal && interface.address) {
          hasActiveInterface = true;
        }
      });
    });
    
    return {
      status: hasActiveInterface ? 'healthy' : 'warning',
      component: 'network',
      message: hasActiveInterface ? 'Network connectivity available' : 'No external network interfaces detected'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      component: 'network',
      error: error.message
    };
  }
}

/**
 * Perform comprehensive health check
 * @returns {Promise<Object>} Overall health status
 */
async function performComprehensiveHealthCheck() {
  const startTime = Date.now();
  
  // Run all health checks in parallel
  const [
    databaseHealth,
    diskSpaceHealth,
    memoryHealth,
    cpuHealth,
    fileSystemHealth,
    networkHealth
  ] = await Promise.all([
    checkDatabaseHealth(),
    checkDiskSpace(),
    checkMemoryUsage(),
    checkCPUUsage(),
    checkFileSystemPermissions(),
    checkNetworkConnectivity()
  ]);
  
  const totalTime = Date.now() - startTime;
  
  // Determine overall status
  const checks = [
    databaseHealth,
    diskSpaceHealth,
    memoryHealth,
    cpuHealth,
    fileSystemHealth,
    networkHealth
  ];
  
  let overallStatus = 'healthy';
  for (const check of checks) {
    if (check.status === 'unhealthy') {
      overallStatus = 'unhealthy';
      break;
    } else if (check.status === 'warning' && overallStatus === 'healthy') {
      overallStatus = 'warning';
    }
  }
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalTime: `${totalTime}ms`,
    checks: {
      database: databaseHealth,
      diskSpace: diskSpaceHealth,
      memory: memoryHealth,
      cpu: cpuHealth,
      fileSystem: fileSystemHealth,
      network: networkHealth
    }
  };
}

module.exports = {
  performComprehensiveHealthCheck,
  checkDatabaseHealth,
  checkDiskSpace,
  checkMemoryUsage,
  checkCPUUsage,
  checkFileSystemPermissions,
  checkNetworkConnectivity
};