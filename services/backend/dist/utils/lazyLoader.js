"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.lazyLoadConfig = exports.lazyLoadMiddleware = exports.lazyLoadService = exports.lazyLoadRoute = exports.LazyLoader = void 0;
// Lazy Loader Utility für dynamisches Laden von Modulen
class LazyLoader {
    /**
     * Lädt ein Modul dynamisch und cached es
     */
    static async loadModule(modulePath) {
        // Prüfe, ob das Modul bereits geladen ist
        if (this.loadedModules.has(modulePath)) {
            return this.loadedModules.get(modulePath);
        }
        // Prüfe, ob das Modul bereits geladen wird
        if (this.loadingPromises.has(modulePath)) {
            return this.loadingPromises.get(modulePath);
        }
        // Erstelle ein Promise für das Laden des Moduls
        const loadingPromise = Promise.resolve(`${modulePath}`).then(s => __importStar(require(s))).then(module => {
            // Speichere das geladene Modul
            this.loadedModules.set(modulePath, module);
            // Entferne das Promise aus der Map
            this.loadingPromises.delete(modulePath);
            return module;
        }).catch(error => {
            // Entferne das Promise aus der Map im Fehlerfall
            this.loadingPromises.delete(modulePath);
            throw error;
        });
        // Speichere das Promise
        this.loadingPromises.set(modulePath, loadingPromise);
        return loadingPromise;
    }
    /**
     * Lädt ein Modul synchron, falls verfügbar
     */
    static loadModuleSync(modulePath) {
        try {
            // Prüfe, ob das Modul bereits geladen ist
            if (this.loadedModules.has(modulePath)) {
                return this.loadedModules.get(modulePath);
            }
            // Versuche, das Modul synchron zu laden
            const module = require(modulePath);
            this.loadedModules.set(modulePath, module);
            return module;
        }
        catch (error) {
            console.warn(`Could not load module synchronously: ${modulePath}`, error);
            return null;
        }
    }
    /**
     * Entfernt ein Modul aus dem Cache
     */
    static unloadModule(modulePath) {
        this.loadedModules.delete(modulePath);
        this.loadingPromises.delete(modulePath);
    }
    /**
     * Löscht alle geladenen Module
     */
    static clearCache() {
        this.loadedModules.clear();
        this.loadingPromises.clear();
    }
    /**
     * Holt die Liste aller geladenen Module
     */
    static getLoadedModules() {
        return Array.from(this.loadedModules.keys());
    }
    /**
     * Prüft, ob ein Modul geladen ist
     */
    static isModuleLoaded(modulePath) {
        return this.loadedModules.has(modulePath);
    }
    /**
     * Prüft, ob ein Modul gerade geladen wird
     */
    static isLoading(modulePath) {
        return this.loadingPromises.has(modulePath);
    }
}
exports.LazyLoader = LazyLoader;
LazyLoader.loadedModules = new Map();
LazyLoader.loadingPromises = new Map();
// Convenience-Funktionen für häufig verwendete Module
const lazyLoadRoute = (routePath) => LazyLoader.loadModule(routePath);
exports.lazyLoadRoute = lazyLoadRoute;
const lazyLoadService = (servicePath) => LazyLoader.loadModule(servicePath);
exports.lazyLoadService = lazyLoadService;
const lazyLoadMiddleware = (middlewarePath) => LazyLoader.loadModule(middlewarePath);
exports.lazyLoadMiddleware = lazyLoadMiddleware;
const lazyLoadConfig = (configPath) => LazyLoader.loadModule(configPath);
exports.lazyLoadConfig = lazyLoadConfig;
