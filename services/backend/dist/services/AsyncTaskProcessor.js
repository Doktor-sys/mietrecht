"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncTaskProcessor = void 0;
const logger_1 = require("../utils/logger");
const PerformanceMonitor_1 = require("./PerformanceMonitor");
class AsyncTaskProcessor {
    constructor(config) {
        this.taskQueue = [];
        this.activeTasks = new Map();
        this.workers = 0;
        this.config = {
            minWorkers: config?.minWorkers || 2,
            maxWorkers: config?.maxWorkers || 10,
            workerIdleTimeout: config?.workerIdleTimeout || 300000, // 5 Minuten
            taskTimeout: config?.taskTimeout || 30000, // 30 Sekunden
            retryAttempts: config?.retryAttempts || 3
        };
        this.performanceMonitor = PerformanceMonitor_1.PerformanceMonitor.getInstance();
        // Starte minimale Anzahl an Workern
        this.ensureMinimumWorkers();
    }
    static getInstance(config) {
        if (!AsyncTaskProcessor.instance) {
            AsyncTaskProcessor.instance = new AsyncTaskProcessor(config);
        }
        return AsyncTaskProcessor.instance;
    }
    /**
     * Fügt eine asynchrone Aufgabe zur Verarbeitungswarteschlange hinzu
     */
    async addTask(name, taskFunction, options = {}) {
        const taskId = this.generateTaskId();
        const task = {
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
        logger_1.logger.info(`Added task to queue: ${name} (${taskId}) with priority ${task.priority}`);
        // Starte die Verarbeitung, wenn nicht bereits gestartet
        this.processQueue();
        return taskId;
    }
    /**
     * Fügt eine Aufgabe basierend auf der Priorität in die Warteschlange ein
     */
    insertTaskByPriority(task) {
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
    async processQueue() {
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
    async executeTask(task) {
        // Inkrementiere die Worker-Anzahl
        this.workers++;
        // Aktualisiere den Aufgabenstatus
        task.status = 'running';
        task.startedAt = new Date();
        this.activeTasks.set(task.id, task);
        logger_1.logger.info(`Executing task: ${task.name} (${task.id})`);
        try {
            // Führe die Aufgabe mit Timeout aus
            const result = await this.executeWithTimeout(task.taskFunction, task.timeout);
            // Aktualisiere den Aufgabenstatus
            task.status = 'completed';
            task.completedAt = new Date();
            task.result = result;
            logger_1.logger.info(`Task completed: ${task.name} (${task.id})`);
        }
        catch (error) {
            logger_1.logger.error(`Task failed: ${task.name} (${task.id})`, { error: error instanceof Error ? error.message : String(error) });
            // Aktualisiere den Aufgabenstatus
            task.status = 'failed';
            task.completedAt = new Date();
            task.error = error instanceof Error ? error.message : String(error);
            // Versuche, die Aufgabe erneut auszuführen, wenn es sich lohnt
            if (this.shouldRetryTask(task)) {
                await this.retryTask(task);
                return;
            }
        }
        finally {
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
    async executeWithTimeout(fn, timeout) {
        return new Promise((resolve, reject) => {
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
    shouldRetryTask(task) {
        // Zähle, wie oft die Aufgabe bereits ausgeführt wurde
        const executionCount = this.getTaskExecutionCount(task);
        return executionCount < this.config.retryAttempts;
    }
    /**
     * Holt die Ausführungsanzahl einer Aufgabe
     */
    getTaskExecutionCount(task) {
        // In einer echten Implementierung würden wir hier die Ausführungsanzahl verfolgen
        // Für dieses Beispiel nehmen wir an, dass die Aufgabe einmal ausgeführt wurde
        return task.status === 'failed' ? 1 : 0;
    }
    /**
     * Führt eine Aufgabe erneut aus
     */
    async retryTask(task) {
        logger_1.logger.info(`Retrying task: ${task.name} (${task.id})`);
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
    scaleWorkers() {
        const queueLength = this.taskQueue.length;
        // Wenn die Warteschlange wächst, skalieren wir hoch
        if (queueLength > this.workers && this.workers < this.config.maxWorkers) {
            const neededWorkers = Math.min(queueLength - this.workers, this.config.maxWorkers - this.workers);
            for (let i = 0; i < neededWorkers; i++) {
                this.addWorker();
            }
        }
    }
    /**
     * Fügt einen Worker hinzu
     */
    addWorker() {
        this.workers++;
        logger_1.logger.debug(`Added worker, total workers: ${this.workers}`);
    }
    /**
     * Stellt sicher, dass die minimale Anzahl an Workern vorhanden ist
     */
    ensureMinimumWorkers() {
        while (this.workers < this.config.minWorkers) {
            this.addWorker();
        }
    }
    /**
     * Generiert eine eindeutige Aufgaben-ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Holt den Status einer Aufgabe
     */
    getTaskStatus(taskId) {
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
    getAllTasks() {
        return [
            ...Array.from(this.activeTasks.values()),
            ...this.taskQueue
        ];
    }
    /**
     * Holt Statistiken über den Task-Prozessor
     */
    getStats() {
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
    clearCompletedTasks() {
        // In einer echten Implementierung würden wir hier abgeschlossene Aufgaben löschen
        // Für dieses Beispiel lassen wir die Aufgaben erhalten, um den Status zu verfolgen
    }
}
exports.AsyncTaskProcessor = AsyncTaskProcessor;
