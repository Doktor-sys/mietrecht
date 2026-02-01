export declare class LazyLoader {
    private static loadedModules;
    private static loadingPromises;
    /**
     * Lädt ein Modul dynamisch und cached es
     */
    static loadModule<T>(modulePath: string): Promise<T>;
    /**
     * Lädt ein Modul synchron, falls verfügbar
     */
    static loadModuleSync<T>(modulePath: string): T | null;
    /**
     * Entfernt ein Modul aus dem Cache
     */
    static unloadModule(modulePath: string): void;
    /**
     * Löscht alle geladenen Module
     */
    static clearCache(): void;
    /**
     * Holt die Liste aller geladenen Module
     */
    static getLoadedModules(): string[];
    /**
     * Prüft, ob ein Modul geladen ist
     */
    static isModuleLoaded(modulePath: string): boolean;
    /**
     * Prüft, ob ein Modul gerade geladen wird
     */
    static isLoading(modulePath: string): boolean;
}
export declare const lazyLoadRoute: (routePath: string) => Promise<unknown>;
export declare const lazyLoadService: (servicePath: string) => Promise<unknown>;
export declare const lazyLoadMiddleware: (middlewarePath: string) => Promise<unknown>;
export declare const lazyLoadConfig: (configPath: string) => Promise<unknown>;
