import type { Request, Response, NextFunction } from 'express';
import { apiCache } from './cache';

// Cache middleware for shared hosting optimization
export function cacheMiddleware(ttlMinutes: number = 5) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.originalUrl}`;
    const cachedData = apiCache.get(cacheKey);

    if (cachedData) {
      console.log(`📦 Cache HIT: ${cacheKey}`);
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        apiCache.set(cacheKey, data, ttlMinutes);
        console.log(`💾 Cache SET: ${cacheKey} (TTL: ${ttlMinutes}m)`);
      }
      return originalJson.call(this, data);
    };

    next();
  };
}

// Health check endpoint for shared hosting
export function addHealthCheck(app: any) {
  app.get('/api/health', (req: Request, res: Response) => {
    const isSharedHosting = process.env.SHARED_HOSTING === 'true' || 
                           (process.env.NODE_ENV === 'production' && !process.env.VPS_MODE);
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hostingType: isSharedHosting ? 'shared' : 'vps',
        websocketEnabled: !isSharedHosting
      },
      cache: apiCache.getStats()
    };

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json(health);
  });
}

// Memory optimization for shared hosting
export function optimizeForSharedHosting() {
  const isSharedHosting = process.env.SHARED_HOSTING === 'true' || 
                         (process.env.NODE_ENV === 'production' && !process.env.VPS_MODE);

  if (isSharedHosting) {
    // Reduce memory usage
    if (typeof global.gc === 'function') {
      setInterval(() => {
        global.gc?.();
        console.log('🧹 Garbage collection triggered');
      }, 30 * 60 * 1000); // Every 30 minutes
    }

    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      if (memMB > 100) { // Alert if over 100MB
        console.warn(`⚠️ High memory usage: ${memMB}MB`);
        
        // Clear cache if memory is too high
        if (memMB > 150) {
          apiCache.clear();
          console.log('🗑️ Cache cleared due to high memory usage');
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

// File operation optimization for shared hosting
export async function safeFileWrite(filePath: string, data: string): Promise<boolean> {
  try {
    const fs = await import('fs/promises');
    
    // Create backup before writing (shared hosting safety)
    const backupPath = `${filePath}.backup`;
    try {
      const existingData = await fs.readFile(filePath, 'utf8');
      await fs.writeFile(backupPath, existingData);
    } catch (error) {
      // File might not exist, that's okay
    }

    // Write data
    await fs.writeFile(filePath, data, 'utf8');
    
    // Verify write was successful
    const written = await fs.readFile(filePath, 'utf8');
    if (written === data) {
      // Clean up backup
      try {
        await fs.unlink(backupPath);
      } catch (error) {
        // Backup cleanup failed, but write succeeded
      }
      return true;
    } else {
      throw new Error('Data verification failed after write');
    }
  } catch (error) {
    console.error('Safe file write failed:', error);
    return false;
  }
}