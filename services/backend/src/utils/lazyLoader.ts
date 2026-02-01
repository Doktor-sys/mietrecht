// Lazy Loader Utility für dynamisches Laden von Modulen
export class LazyLoader {
  private static loadedModules: Map<string, any> = new Map();
  private static loadingPromises: Map<string, Promise<any>> = new Map();

  /**
   * Lädt ein Modul dynamisch und cached es
   */
  static async loadModule<T>(modulePath: string): Promise<T> {
    // Prüfe, ob das Modul bereits geladen ist
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath);
    }

    // Prüfe, ob das Modul bereits geladen wird
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath)!;
    }

    // Erstelle ein Promise für das Laden des Moduls
    const loadingPromise = import(modulePath).then(module => {
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
  static loadModuleSync<T>(modulePath: string): T | null {
    try {
      // Prüfe, ob das Modul bereits geladen ist
      if (this.loadedModules.has(modulePath)) {
        return this.loadedModules.get(modulePath);
      }

      // Versuche, das Modul synchron zu laden
      const module = require(modulePath);
      this.loadedModules.set(modulePath, module);
      return module;
    } catch (error) {
      console.warn(`Could not load module synchronously: ${modulePath}`, error);
      return null;
    }
  }

  /**
   * Entfernt ein Modul aus dem Cache
   */
  static unloadModule(modulePath: string): void {
    this.loadedModules.delete(modulePath);
    this.loadingPromises.delete(modulePath);
  }

  /**
   * Löscht alle geladenen Module
   */
  static clearCache(): void {
    this.loadedModules.clear();
    this.loadingPromises.clear();
  }

  /**
   * Holt die Liste aller geladenen Module
   */
  static getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  /**
   * Prüft, ob ein Modul geladen ist
   */
  static isModuleLoaded(modulePath: string): boolean {
    return this.loadedModules.has(modulePath);
  }

  /**
   * Prüft, ob ein Modul gerade geladen wird
   */
  static isLoading(modulePath: string): boolean {
    return this.loadingPromises.has(modulePath);
  }
}

// Convenience-Funktionen für häufig verwendete Module
export const lazyLoadRoute = (routePath: string) => 
  LazyLoader.loadModule(routePath);

export const lazyLoadService = (servicePath: string) => 
  LazyLoader.loadModule(servicePath);

export const lazyLoadMiddleware = (middlewarePath: string) => 
  LazyLoader.loadModule(middlewarePath);

export const lazyLoadConfig = (configPath: string) => 
  LazyLoader.loadModule(configPath);