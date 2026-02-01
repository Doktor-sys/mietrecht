/**
 * Cache Service for Integration Performance Optimization
 * 
 * This service provides caching mechanisms to optimize integration performance
 * by reducing redundant API calls and improving response times.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Set data in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  /**
   * Delete entry from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clear all entries
   */
  clearAll(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const cacheService = new CacheService();