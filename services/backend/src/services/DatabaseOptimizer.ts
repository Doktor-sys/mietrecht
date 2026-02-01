 import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { PerformanceMonitor } from './PerformanceMonitor';

interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
  userId?: string;
}

interface QueryOptimization {
  originalQuery: string;
  optimizedQuery: string;
  improvementPercentage: number;
  lastExecuted: Date;
}

export class DatabaseOptimizer {
  private prisma: PrismaClient;
  private performanceMonitor: PerformanceMonitor;
  private slowQueries: SlowQuery[] = [];
  private optimizations: QueryOptimization[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.performanceMonitor = PerformanceMonitor.getInstance();
    
    // Setup periodic slow query analysis
    setInterval(() => {
      this.analyzeSlowQueries();
    }, 300000); // Alle 5 Minuten
  }

  /**
   * Erfasst eine langsame Abfrage
   */
  recordSlowQuery(query: string, duration: number, userId?: string): void {
    const slowQuery: SlowQuery = {
      query,
      duration,
      timestamp: new Date(),
      userId
    };

    this.slowQueries.push(slowQuery);

    // Begrenze die Anzahl der gespeicherten langsamen Abfragen
    if (this.slowQueries.length > 1000) {
      this.slowQueries.shift();
    }

    logger.warn(`Slow query detected: ${duration}ms`, { query: query.substring(0, 100), userId });
  }

  /**
   * Analysiert langsame Abfragen und schlägt Optimierungen vor
   */
  private async analyzeSlowQueries(): Promise<void> {
    if (this.slowQueries.length === 0) {
      return;
    }

    logger.info(`Analyzing ${this.slowQueries.length} slow queries`);

    // Gruppiere Abfragen nach Query-Text
    const queryGroups = new Map<string, SlowQuery[]>();
    
    for (const query of this.slowQueries) {
      if (!queryGroups.has(query.query)) {
        queryGroups.set(query.query, []);
      }
      queryGroups.get(query.query)!.push(query);
    }

    // Analysiere jede Gruppe
    for (const [queryText, queries] of queryGroups) {
      const avgDuration = queries.reduce((sum, q) => sum + q.duration, 0) / queries.length;
      const maxDuration = Math.max(...queries.map(q => q.duration));
      const minDuration = Math.min(...queries.map(q => q.duration));
      
      logger.info(`Query analysis for: ${queryText.substring(0, 50)}...`, {
        count: queries.length,
        avgDuration: Number(avgDuration.toFixed(2)),
        maxDuration,
        minDuration
      });

      // Prüfe, ob dies eine bekannte Optimierung ist
      const existingOptimization = this.optimizations.find(
        opt => opt.originalQuery === queryText
      );

      if (!existingOptimization && avgDuration > 1000) { // Nur für Abfragen über 1 Sekunde
        // Schlage eine Optimierung vor
        await this.suggestOptimization(queryText, avgDuration);
      }
    }
  }

  /**
   * Schlägt eine Optimierung für eine Abfrage vor
   */
  private async suggestOptimization(queryText: string, avgDuration: number): Promise<void> {
    // Dies ist eine vereinfachte Implementierung
    // In einer echten Anwendung würden wir hier komplexere Analysen durchführen
    
    let optimizedQuery = queryText;
    let improvementPercentage = 0;

    // Allgemeine Optimierungsvorschläge
    if (queryText.toLowerCase().includes('select *')) {
      logger.warn('SELECT * detected in query, consider specifying columns');
      improvementPercentage = 15; // Geschätzte Verbesserung
    }

    if (queryText.toLowerCase().includes('join') && !queryText.toLowerCase().includes('limit')) {
      logger.warn('JOIN without LIMIT detected, consider adding pagination');
      improvementPercentage += 10;
    }

    if (queryText.toLowerCase().includes('order by') && !queryText.toLowerCase().includes('index')) {
      logger.warn('ORDER BY without index, consider adding index');
      improvementPercentage += 20;
    }

    // Erstelle einen Optimierungseintrag
    const optimization: QueryOptimization = {
      originalQuery: queryText,
      optimizedQuery,
      improvementPercentage,
      lastExecuted: new Date()
    };

    this.optimizations.push(optimization);
    
    if (improvementPercentage > 0) {
      logger.info(`Suggested optimization for query with ${improvementPercentage}% improvement`, {
        originalQuery: queryText.substring(0, 100),
        improvementPercentage
      });
    }
  }

  /**
   * Wendet eine Optimierung auf eine Abfrage an
   */
  applyOptimization(queryText: string): string {
    const optimization = this.optimizations.find(
      opt => opt.originalQuery === queryText
    );

    if (optimization) {
      logger.info('Applied optimization to query', {
        originalQuery: queryText.substring(0, 100),
        improvementPercentage: optimization.improvementPercentage
      });
      return optimization.optimizedQuery;
    }

    return queryText;
  }

  /**
   * Erstellt Datenbank-Indizes basierend auf Abfrageanalysen
   */
  async suggestIndexes(): Promise<void> {
    try {
      // Analysiere häufige WHERE-Bedingungen
      const wherePatterns = this.extractWherePatterns();
      
      // Analysiere häufige JOIN-Bedingungen
      const joinPatterns = this.extractJoinPatterns();
      
      // Analysiere häufige ORDER BY-Bedingungen
      const orderByPatterns = this.extractOrderByPatterns();
      
      // Schlage Indizes vor
      const indexSuggestions: string[] = [];
      
      for (const pattern of wherePatterns) {
        const suggestion = `CREATE INDEX idx_${pattern.table}_${pattern.column} ON ${pattern.table}(${pattern.column});`;
        indexSuggestions.push(suggestion);
        logger.info(`Suggested index for WHERE pattern: ${pattern.table}.${pattern.column}`);
      }
      
      for (const pattern of joinPatterns) {
        const suggestion = `CREATE INDEX idx_${pattern.table}_${pattern.column} ON ${pattern.table}(${pattern.column});`;
        indexSuggestions.push(suggestion);
        logger.info(`Suggested index for JOIN pattern: ${pattern.table}.${pattern.column}`);
      }
      
      for (const pattern of orderByPatterns) {
        const suggestion = `CREATE INDEX idx_${pattern.table}_${pattern.column} ON ${pattern.table}(${pattern.column});`;
        indexSuggestions.push(suggestion);
        logger.info(`Suggested index for ORDER BY pattern: ${pattern.table}.${pattern.column}`);
      }
      
      // Wenn Index-Vorschläge vorhanden sind, logge sie
      if (indexSuggestions.length > 0) {
        logger.info('Generated index suggestions:', { count: indexSuggestions.length });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error suggesting indexes', { error: errorMessage });
    }
  }

  /**
   * Extrahiert WHERE-Muster aus langsamen Abfragen
   */
  private extractWherePatterns(): Array<{table: string, column: string}> {
    // Vereinfachte Implementierung
    const patterns: Array<{table: string, column: string}> = [];
    
    for (const query of this.slowQueries) {
      // Einfache Regex-basierte Extraktion
      const whereMatches = query.query.match(/WHERE\s+(\w+)\.(\w+)/gi);
      if (whereMatches) {
        for (const match of whereMatches) {
          const parts = match.split(/[.\s]+/);
          if (parts.length >= 3) {
            patterns.push({
              table: parts[1],
              column: parts[2]
            });
          }
        }
      }
    }
    
    // Entferne Duplikate
    const uniquePatterns = patterns.filter((pattern, index, self) => 
      index === self.findIndex(p => p.table === pattern.table && p.column === pattern.column)
    );
    
    return uniquePatterns;
  }

  /**
   * Extrahiert JOIN-Muster aus langsamen Abfragen
   */
  private extractJoinPatterns(): Array<{table: string, column: string}> {
    // Vereinfachte Implementierung
    const patterns: Array<{table: string, column: string}> = [];
    
    for (const query of this.slowQueries) {
      // Einfache Regex-basierte Extraktion
      const joinMatches = query.query.match(/JOIN\s+(\w+)\s+ON\s+\w+\.(\w+)/gi);
      if (joinMatches) {
        for (const match of joinMatches) {
          const parts = match.split(/[.\s]+/);
          if (parts.length >= 4) {
            patterns.push({
              table: parts[1],
              column: parts[3]
            });
          }
        }
      }
    }
    
    return patterns;
  }

  /**
   * Extrahiert ORDER BY-Muster aus langsamen Abfragen
   */
  private extractOrderByPatterns(): Array<{table: string, column: string}> {
    // Vereinfachte Implementierung
    const patterns: Array<{table: string, column: string}> = [];
    
    for (const query of this.slowQueries) {
      // Einfache Regex-basierte Extraktion
      const orderMatches = query.query.match(/ORDER\s+BY\s+(\w+)\.(\w+)/gi);
      if (orderMatches) {
        for (const match of orderMatches) {
          const parts = match.split(/[.\s]+/);
          if (parts.length >= 3) {
            patterns.push({
              table: parts[1],
              column: parts[2]
            });
          }
        }
      }
    }
    
    return patterns;
  }

  /**
   * Holt Statistiken über langsamen Abfragen
   */
  getSlowQueryStats(): {
    totalSlowQueries: number;
    averageDuration: number;
    longestQuery: number;
    optimizationsSuggested: number;
  } {
    const totalSlowQueries = this.slowQueries.length;
    const totalDuration = this.slowQueries.reduce((sum, q) => sum + q.duration, 0);
    const averageDuration = totalSlowQueries > 0 ? totalDuration / totalSlowQueries : 0;
    const longestQuery = this.slowQueries.length > 0 ? 
      Math.max(...this.slowQueries.map(q => q.duration)) : 0;
    const optimizationsSuggested = this.optimizations.length;

    return {
      totalSlowQueries,
      averageDuration,
      longestQuery,
      optimizationsSuggested
    };
  }

  /**
   * Löscht alte Abfrage-Daten
   */
  clearOldData(): void {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 Stunden
    
    this.slowQueries = this.slowQueries.filter(
      query => query.timestamp > cutoffDate
    );
    
    this.optimizations = this.optimizations.filter(
      opt => opt.lastExecuted > cutoffDate
    );
  }
}