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
    timeout?: number;
}
interface WorkerPoolConfig {
    minWorkers: number;
    maxWorkers: number;
    workerIdleTimeout: number;
    taskTimeout: number;
    retryAttempts: number;
}
export declare class AsyncTaskProcessor {
    private static instance;
    private taskQueue;
    private activeTasks;
    private workers;
    private config;
    private performanceMonitor;
    private constructor();
    static getInstance(config?: Partial<WorkerPoolConfig>): AsyncTaskProcessor;
    /**
     * Fügt eine asynchrone Aufgabe zur Verarbeitungswarteschlange hinzu
     */
    addTask<T>(name: string, taskFunction: () => Promise<T>, options?: {
        priority?: 'low' | 'medium' | 'high';
        timeout?: number;
    }): Promise<string>;
    /**
     * Fügt eine Aufgabe basierend auf der Priorität in die Warteschlange ein
     */
    private insertTaskByPriority;
    /**
     * Verarbeitet die Aufgabenwarteschlange
     */
    private processQueue;
    /**
     * Führt eine Aufgabe aus
     */
    private executeTask;
    /**
     * Führt eine Funktion mit Timeout aus
     */
    private executeWithTimeout;
    /**
     * Prüft, ob eine Aufgabe erneut ausgeführt werden sollte
     */
    private shouldRetryTask;
    /**
     * Holt die Ausführungsanzahl einer Aufgabe
     */
    private getTaskExecutionCount;
    /**
     * Führt eine Aufgabe erneut aus
     */
    private retryTask;
    /**
     * Skaliert die Anzahl der Worker basierend auf der Warteschlangengröße
     */
    private scaleWorkers;
    /**
     * Fügt einen Worker hinzu
     */
    private addWorker;
    /**
     * Stellt sicher, dass die minimale Anzahl an Workern vorhanden ist
     */
    private ensureMinimumWorkers;
    /**
     * Generiert eine eindeutige Aufgaben-ID
     */
    private generateTaskId;
    /**
     * Holt den Status einer Aufgabe
     */
    getTaskStatus(taskId: string): AsyncTask | undefined;
    /**
     * Holt alle Aufgaben
     */
    getAllTasks(): AsyncTask[];
    /**
     * Holt Statistiken über den Task-Prozessor
     */
    getStats(): {
        pendingTasks: number;
        activeTasks: number;
        workers: number;
        minWorkers: number;
        maxWorkers: number;
    };
    /**
     * Löscht abgeschlossene Aufgaben
     */
    clearCompletedTasks(): void;
}
export {};
