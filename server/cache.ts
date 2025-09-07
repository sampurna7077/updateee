// Simple in-memory cache for shared hosting optimization
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem>();
  private isSharedHosting: boolean;

  constructor() {
    this.isSharedHosting = process.env.SHARED_HOSTING === 'true' || 
                          (process.env.NODE_ENV === 'production' && !process.env.VPS_MODE);
    
    // Clean up expired items every 10 minutes
    if (this.isSharedHosting) {
      setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }
  }

  set(key: string, data: any, ttlMinutes: number = 5): void {
    // Only cache in shared hosting to reduce file I/O
    if (!this.isSharedHosting) return;
    
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get(key: string): any | null {
    if (!this.isSharedHosting) return null;
    
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, item] of entries) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const apiCache = new SimpleCache();