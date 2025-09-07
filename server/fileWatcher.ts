import { promises as fs } from 'fs';
import path from 'path';
import { WebSocket } from 'ws';

const JSON_DB_FOLDER = '06jbjz5PvFtImMG2VzFz6LHiD0Uom5E9ltYCAfKtS2sZAXCixewC4BfqBHBha5HUh328YEL2BBHEKpTe';

interface FileWatcher {
  filePath: string;
  lastModified: number;
  collection: string;
}

class JSONFileWatcher {
  private watchers: FileWatcher[] = [];
  private clients: Set<WebSocket> = new Set();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeWatchers();
    this.startWatching();
  }

  private async initializeWatchers(): Promise<void> {
    try {
      const files = await fs.readdir(JSON_DB_FOLDER);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(JSON_DB_FOLDER, file);
        const stats = await fs.stat(filePath);
        const collection = file.replace('.json', '');

        this.watchers.push({
          filePath,
          lastModified: stats.mtime.getTime(),
          collection
        });
      }

      console.log(`🔍 File Watcher initialized - monitoring ${this.watchers.length} JSON files`);
    } catch (error) {
      console.error('Error initializing file watchers:', error);
    }
  }

  private startWatching(): void {
    // Check files every 5 seconds
    this.intervalId = setInterval(async () => {
      await this.checkForChanges();
    }, 5000);

    console.log('📡 File monitoring started - checking every 5 seconds');
  }

  private async checkForChanges(): Promise<void> {
    try {
      for (const watcher of this.watchers) {
        const stats = await fs.stat(watcher.filePath);
        const currentModified = stats.mtime.getTime();

        if (currentModified > watcher.lastModified) {
          console.log(`🔄 File changed: ${watcher.collection}.json`);
          watcher.lastModified = currentModified;

          // Notify all connected clients
          this.notifyClients({
            type: 'file_changed',
            collection: watcher.collection,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error checking for file changes:', error);
    }
  }

  private notifyClients(message: any): void {
    const messageStr = JSON.stringify(message);
    
    // Clean up closed connections
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      } else {
        this.clients.delete(ws);
      }
    });

    console.log(`📤 Notified ${this.clients.size} clients about ${message.collection} change`);
  }

  public addClient(ws: WebSocket): void {
    this.clients.add(ws);
    
    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'File watcher connected - monitoring JSON files',
      watchedFiles: this.watchers.map(w => w.collection)
    }));

    console.log(`👤 Client connected - total clients: ${this.clients.size}`);

    ws.on('close', () => {
      this.clients.delete(ws);
      console.log(`👤 Client disconnected - total clients: ${this.clients.size}`);
    });
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Close all client connections
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    
    this.clients.clear();
    console.log('🛑 File watcher stopped');
  }

  public getStatus(): any {
    return {
      isActive: this.intervalId !== null,
      watchedFiles: this.watchers.length,
      connectedClients: this.clients.size,
      lastCheck: new Date().toISOString()
    };
  }

  // Force refresh all files (useful for manual testing)
  public async forceRefresh(): Promise<void> {
    console.log('🔄 Force refreshing all files...');
    
    for (const watcher of this.watchers) {
      this.notifyClients({
        type: 'force_refresh',
        collection: watcher.collection,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const fileWatcher = new JSONFileWatcher();