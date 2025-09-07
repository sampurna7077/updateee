// import { storage } from './storage'; // PostgreSQL storage - REMOVED
import { JSONStorageAdapter } from "./json-storage-adapter";

// Create JSON storage instance for cleanup
const storage = new JSONStorageAdapter();
import { LocalFileStorage } from './localFileStorage';

export class CleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private fileStorage: LocalFileStorage;

  constructor() {
    this.fileStorage = new LocalFileStorage();
  }

  /**
   * Start automatic cleanup service
   * Runs every hour to check for expired advertisements
   */
  start() {
    if (this.cleanupInterval) {
      console.log('Cleanup service is already running');
      return;
    }

    console.log('Starting advertisement cleanup service...');
    
    // Run cleanup immediately on start
    this.runCleanup();
    
    // Then run every hour (3600000 ms)
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, 3600000); // 1 hour
    
    console.log('Advertisement cleanup service started (runs every hour)');
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Advertisement cleanup service stopped');
    }
  }

  /**
   * Run cleanup process manually
   */
  async runCleanup(): Promise<{ deletedAds: number; deletedFiles: number }> {
    try {
      console.log('Running advertisement cleanup...');
      
      // Delete expired advertisements from JSON database
      await storage.deleteExpiredAdvertisements();
      const expiredFilePaths: string[] = []; // JSON storage handles this internally
      
      if (expiredFilePaths.length === 0) {
        console.log('No expired advertisements to clean up');
        return { deletedAds: 0, deletedFiles: 0 };
      }
      
      // Delete the actual files from local storage
      const deletedFilesCount = await this.fileStorage.cleanupExpiredFiles(expiredFilePaths);
      
      console.log(`Cleanup completed: ${expiredFilePaths.length} expired ads removed, ${deletedFilesCount} files deleted`);
      
      return { 
        deletedAds: expiredFilePaths.length, 
        deletedFiles: deletedFilesCount 
      };
    } catch (error) {
      console.error('Error during cleanup process:', error);
      return { deletedAds: 0, deletedFiles: 0 };
    }
  }

  /**
   * Get cleanup status
   */
  isRunning(): boolean {
    return this.cleanupInterval !== null;
  }
}

// Create singleton instance
export const cleanupService = new CleanupService();