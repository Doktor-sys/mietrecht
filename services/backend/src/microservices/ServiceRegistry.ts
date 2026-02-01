import { logger } from '../utils/logger';

interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  status: 'healthy' | 'unhealthy' | 'starting';
  lastHeartbeat: Date;
  metadata: Record<string, any>;
}

interface ServiceHealth {
  serviceName: string;
  instances: ServiceInstance[];
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export class ServiceRegistry {
  private services: Map<string, ServiceInstance[]>;
  private healthChecks: Map<string, () => Promise<boolean>>;
  private heartbeatInterval: NodeJS.Timeout | null;

  constructor() {
    this.services = new Map();
    this.healthChecks = new Map();
    this.heartbeatInterval = null;
  }

  /**
   * Registriert einen neuen Service
   */
  registerService(service: Omit<ServiceInstance, 'id' | 'lastHeartbeat' | 'status'>): string {
    const serviceId = `${service.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const instance: ServiceInstance = {
      ...service,
      id: serviceId,
      status: 'starting',
      lastHeartbeat: new Date()
    };

    if (!this.services.has(service.name)) {
      this.services.set(service.name, []);
    }

    this.services.get(service.name)!.push(instance);
    logger.info(`Registered service ${service.name} with ID ${serviceId}`);

    // Setze Status auf healthy nach kurzer Verzögerung
    setTimeout(() => {
      instance.status = 'healthy';
    }, 5000);

    return serviceId;
  }

  /**
   * Deregistriert einen Service
   */
  unregisterService(serviceName: string, serviceId: string): boolean {
    const instances = this.services.get(serviceName);
    if (!instances) {
      return false;
    }

    const index = instances.findIndex(instance => instance.id === serviceId);
    if (index === -1) {
      return false;
    }

    instances.splice(index, 1);
    logger.info(`Unregistered service ${serviceName} with ID ${serviceId}`);
    return true;
  }

  /**
   * Aktualisiert den Heartbeat eines Services
   */
  updateHeartbeat(serviceName: string, serviceId: string): boolean {
    const instances = this.services.get(serviceName);
    if (!instances) {
      return false;
    }

    const instance = instances.find(instance => instance.id === serviceId);
    if (!instance) {
      return false;
    }

    instance.lastHeartbeat = new Date();
    // Setze Status zurück auf healthy falls er unhealthy war
    if (instance.status === 'unhealthy') {
      instance.status = 'healthy';
    }
    return true;
  }

  /**
   * Ruft einen gesunden Service-Endpunkt ab
   */
  getHealthyService(serviceName: string): ServiceInstance | null {
    const instances = this.services.get(serviceName);
    if (!instances || instances.length === 0) {
      return null;
    }

    // Filtere gesunde Instanzen
    const healthyInstances = instances.filter(instance => 
      instance.status === 'healthy' && 
      (Date.now() - instance.lastHeartbeat.getTime()) < 30000 // Max 30 Sekunden alt
    );

    if (healthyInstances.length === 0) {
      return null;
    }

    // Round-robin Load Balancing
    const index = Math.floor(Math.random() * healthyInstances.length);
    return healthyInstances[index];
  }

  /**
   * Ruft alle Instanzen eines Services ab
   */
  getAllInstances(serviceName: string): ServiceInstance[] {
    return this.services.get(serviceName) || [];
  }

  /**
   * Ruft den Gesundheitsstatus aller Services ab
   */
  getHealthStatus(): ServiceHealth[] {
    const healthStatus: ServiceHealth[] = [];

    for (const [serviceName, instances] of this.services.entries()) {
      const healthyCount = instances.filter(i => i.status === 'healthy').length;
      const unhealthyCount = instances.filter(i => i.status === 'unhealthy').length;
      
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (unhealthyCount > 0 && unhealthyCount === instances.length) {
        overallStatus = 'unhealthy';
      } else if (unhealthyCount > 0) {
        overallStatus = 'degraded';
      }

      healthStatus.push({
        serviceName,
        instances,
        overallStatus
      });
    }

    return healthStatus;
  }

  /**
   * Markiert einen Service als ungesund
   */
  markUnhealthy(serviceName: string, serviceId: string): boolean {
    const instances = this.services.get(serviceName);
    if (!instances) {
      return false;
    }

    const instance = instances.find(instance => instance.id === serviceId);
    if (!instance) {
      return false;
    }

    instance.status = 'unhealthy';
    logger.warn(`Marked service ${serviceName} (${serviceId}) as unhealthy`);
    return true;
  }

  /**
   * Fügt einen Health Check für einen Service hinzu
   */
  addHealthCheck(serviceName: string, check: () => Promise<boolean>): void {
    this.healthChecks.set(serviceName, check);
  }

  /**
   * Führt alle Health Checks aus
   */
  async runHealthChecks(): Promise<void> {
    for (const [serviceName, check] of this.healthChecks.entries()) {
      try {
        const isHealthy = await check();
        const instances = this.services.get(serviceName) || [];
        
        // Aktualisiere Status aller Instanzen dieses Services
        instances.forEach(instance => {
          if (isHealthy && instance.status !== 'healthy') {
            instance.status = 'healthy';
            logger.info(`Service ${serviceName} is now healthy`);
          } else if (!isHealthy && instance.status === 'healthy') {
            instance.status = 'unhealthy';
            logger.warn(`Service ${serviceName} is now unhealthy`);
          }
        });
      } catch (error) {
        logger.error(`Health check failed for service ${serviceName}:`, error);
        // Markiere alle Instanzen als ungesund bei Fehler
        const instances = this.services.get(serviceName) || [];
        instances.forEach(instance => {
          instance.status = 'unhealthy';
        });
      }
    }
  }

  /**
   * Startet periodische Health Checks
   */
  startHealthChecks(intervalMs: number = 30000): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.runHealthChecks().catch(error => {
        logger.error('Error running periodic health checks:', error);
      });
    }, intervalMs);

    logger.info(`Started periodic health checks every ${intervalMs}ms`);
  }

  /**
   * Stoppt periodische Health Checks
   */
  stopHealthChecks(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      logger.info('Stopped periodic health checks');
    }
  }

  /**
   * Bereinigt alte, inaktive Services
   */
  cleanupInactiveServices(maxAgeMs: number = 60000): void {
    const now = Date.now();
    
    for (const [serviceName, instances] of this.services.entries()) {
      const activeInstances = instances.filter(instance => 
        (now - instance.lastHeartbeat.getTime()) < maxAgeMs
      );
      
      if (activeInstances.length !== instances.length) {
        this.services.set(serviceName, activeInstances);
        logger.info(`Cleaned up ${instances.length - activeInstances.length} inactive instances of ${serviceName}`);
      }
    }
  }

  /**
   * Startet periodische Bereinigung
   */
  startCleanup(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      this.cleanupInactiveServices();
    }, intervalMs);
  }
}