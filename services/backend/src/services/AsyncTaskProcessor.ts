import { logger } from '../utils/logger';
import { PerformanceMonitor } from './PerformanceMonitor';

interface AsyncTask {
  id: string;
  name: string;
  taskFunction: () => Promise<any>;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timeout?: number; // in milliseconds
}

interface WorkerPoolConfig {
  minWorkers: number;
  maxWorkers: number;
  workerIdleTimeout: number; // in milliseconds
  taskTimeout: number; // in milliseconds
  retryAttempts: number;
}

export class AsyncTaskProcessor {
  private static instance: AsyncTaskProcessor;
  private taskQueue: AsyncTask[] = [];
  private activeTasks: Map<string, AsyncTask> = new Map();
  private workers: number = 0;
  private config: WorkerPoolConfig;
  private performanceMonitor: PerformanceMonitor;

  private constructor(config?: Partial<WorkerPoolConfig>) {
    this.config = {
      minWorkers: config?.minWorkers || 2,
      maxWorkers: config?.maxWorkers || 10,
      workerIdleTimeout: config?.workerIdleTimeout || 300000, // 5 Minuten
      taskTimeout: config?.taskTimeout || 30000, // 30 Sekunden
      retryAttempts: config?.retryAttempts || 3
    };
    
    this.performanceMonitor = PerformanceMonitor.getInstance();
    
    // Starte minimale Anzahl an Workern
    this.ensureMinimumWorkers();
  }

  public static getInstance(config?: Partial<WorkerPoolConfig>): AsyncTaskProcessor {
    if (!AsyncTaskProcessor.instance) {
      AsyncTaskProcessor.instance = new AsyncTaskProcessor(config);
    }
    return AsyncTaskProcessor.instance;
  }

  /**
   * Fügt eine asynchrone Aufgabe zur Verarbeitungswarteschlange hinzu
   */
  async addTask<T>(
    name: string,
    taskFunction: () => Promise<T>,
    options: {
      priority?: 'low' | 'medium' | 'high';
      timeout?: number;
    } = {}
  ): Promise<string> {
    const taskId = this.generateTaskId();
    
    const task: AsyncTask = {
      id: taskId,
      name,
      taskFunction,
      priority: options.priority || 'medium',
      createdAt: new Date(),
      status: 'pending',
      timeout: options.timeout || this.config.taskTimeout
    };

    // Füge die Aufgabe basierend auf der Priorität in die Warteschlange ein
    this.insertTaskByPriority(task);
    
    logger.info(`Added task to queue: ${name} (${taskId}) with priority ${task.priority}`);
    
    // Starte die Verarbeitung, wenn nicht bereits gestartet
    this.processQueue();
    
    return taskId;
  }

  /**
   * Fügt eine Aufgabe basierend auf der Priorität in die Warteschlange ein
   */
  private insertTaskByPriority(task: AsyncTask): void {
    // Prioritätsreihenfolge: high > medium > low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    let insertIndex = this.taskQueue.length;
    for (let i = 0; i < this.taskQueue.length; i++) {
      if (priorityOrder[task.priority] < priorityOrder[this.taskQueue[i].priority]) {
        insertIndex = i;
        break;
      }
    }
    
    this.taskQueue.splice(insertIndex, 0, task);
  }

  /**
   * Verarbeitet die Aufgabenwarteschlange
   */
  private async processQueue(): Promise<void> {
    // Prüfe, ob wir mehr Worker benötigen
    this.scaleWorkers();
    
    // Verarbeite Aufgaben, solange Worker verfügbar sind
    while (this.workers < this.config.maxWorkers && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        this.executeTask(task);
      }
    }
  }

  /**
   * Führt eine Aufgabe aus
   */
  private async executeTask(task: AsyncTask): Promise<void> {
    // Inkrementiere die Worker-Anzahl
    this.workers++;
    
    // Aktualisiere den Aufgabenstatus
    task.status = 'running';
    task.startedAt = new Date();
    this.activeTasks.set(task.id, task);
    
    logger.info(`Executing task: ${task.name} (${task.id})`);
    
    try {
      // Führe die Aufgabe mit Timeout aus
      const result = await this.executeWithTimeout(task.taskFunction, task.timeout);
      
      // Aktualisiere den Aufgabenstatus
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      
      logger.info(`Task completed: ${task.name} (${task.id})`);
    } catch (error: unknown) {
      logger.error(`Task failed: ${task.name} (${task.id})`, { error: error instanceof Error ? error.message : String(error) });
      
      // Aktualisiere den Aufgabenstatus
      task.status = 'failed';
      task.completedAt = new Date();
      task.error = error instanceof Error ? error.message : String(error);
      
      // Versuche, die Aufgabe erneut auszuführen, wenn es sich lohnt
      if (this.shouldRetryTask(task)) {
        await this.retryTask(task);
        return;
      }
    } finally {
      // Dekrementiere die Worker-Anzahl
      this.workers--;
      
      // Entferne die Aufgabe aus den aktiven Aufgaben
      this.activeTasks.delete(task.id);
      
      // Verarbeite die nächste Aufgabe in der Warteschlange
      this.processQueue();
    }
  }

  /**
   * Führt eine Funktion mit Timeout aus
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout?: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Setze einen Timeout
      const timer = setTimeout(() => {
        reject(new Error('Task timeout exceeded'));
      }, timeout || this.config.taskTimeout);
      
      // Führe die Funktion aus
      fn()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Prüft, ob eine Aufgabe erneut ausgeführt werden sollte
   */
  private shouldRetryTask(task: AsyncTask): boolean {
    // Zähle, wie oft die Aufgabe bereits ausgeführt wurde
    const executionCount = this.getTaskExecutionCount(task);
    return executionCount < this.config.retryAttempts;
  }

  /**
   * Holt die Ausführungsanzahl einer Aufgabe
   */
  private getTaskExecutionCount(task: AsyncTask): number {
    // In einer echten Implementierung würden wir hier die Ausführungsanzahl verfolgen
    // Für dieses Beispiel nehmen wir an, dass die Aufgabe einmal ausgeführt wurde
    return task.status === 'failed' ? 1 : 0;
  }

  /**
   * Führt eine Aufgabe erneut aus
   */
  private async retryTask(task: AsyncTask): Promise<void> {
    logger.info(`Retrying task: ${task.name} (${task.id})`);
    
    // Setze den Aufgabenstatus zurück
    task.status = 'pending';
    task.startedAt = undefined;
    task.completedAt = undefined;
    task.result = undefined;
    task.error = undefined;
    
    // Füge die Aufgabe mit hoher Priorität wieder in die Warteschlange ein
    task.priority = 'high';
    this.insertTaskByPriority(task);
    
    // Starte die Verarbeitung
    this.processQueue();
  }

  /**
   * Skaliert die Anzahl der Worker basierend auf der Warteschlangengröße
   */
  private scaleWorkers(): void {
    const queueLength = this.taskQueue.length;
    
    // Wenn die Warteschlange wächst, skalieren wir hoch
    if (queueLength > this.workers && this.workers < this.config.maxWorkers) {
      const neededWorkers = Math.min(
        queueLength - this.workers,
        this.config.maxWorkers - this.workers
      );
      
      for (let i = 0; i < neededWorkers; i++) {
        this.addWorker();
      }
    }
  }

  /**
   * Fügt einen Worker hinzu
   */
  private addWorker(): void {
    this.workers++;
    logger.debug(`Added worker, total workers: ${this.workers}`);
  }

  /**
   * Stellt sicher, dass die minimale Anzahl an Workern vorhanden ist
   */
  private ensureMinimumWorkers(): void {
    while (this.workers < this.config.minWorkers) {
      this.addWorker();
    }
  }

  /**
   * Generiert eine eindeutige Aufgaben-ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Holt den Status einer Aufgabe
   */
  getTaskStatus(taskId: string): AsyncTask | undefined {
    // Prüfe zuerst die aktiven Aufgaben
    if (this.activeTasks.has(taskId)) {
      return this.activeTasks.get(taskId);
    }
    
    // Prüfe dann die Warteschlange
    return this.taskQueue.find(task => task.id === taskId);
  }

  /**
   * Holt alle Aufgaben
   */
  getAllTasks(): AsyncTask[] {
    return [
      ...Array.from(this.activeTasks.values()),
      ...this.taskQueue
    ];
  }

  /**
   * Holt Statistiken über den Task-Prozessor
   */
  getStats(): {
    pendingTasks: number;
    activeTasks: number;
    workers: number;
    minWorkers: number;
    maxWorkers: number;
  } {
    return {
      pendingTasks: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      workers: this.workers,
      minWorkers: this.config.minWorkers,
      maxWorkers: this.config.maxWorkers
    };
  }

  /**
   * Löscht abgeschlossene Aufgaben
   */
  clearCompletedTasks(): void {
    // In einer echten Implementierung würden wir hier abgeschlossene Aufgaben löschen
    // Für dieses Beispiel lassen wir die Aufgaben erhalten, um den Status zu verfolgen
  }
}