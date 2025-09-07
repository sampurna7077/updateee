import { promises as fs } from 'fs';
import { createHash, createCipher, createDecipher, randomBytes } from 'crypto';
import path from 'path';
import { nanoid } from 'nanoid';

const DB_FOLDER = '06jbjz5PvFtImMG2VzFz6LHiD0Uom5E9ltYCAfKtS2sZAXCixewC4BfqBHBha5HUh328YEL2BBHEKpTe';
const MAIN_DB_FILE = 'JzySs1ab82KcitLkMH5HHIhRGqqjYJiITdLnPREcIjckBYJlFrKC0K5fgGBoq80rwmQn6B3LH5njDvcCB4dwdYmp.json';

interface DatabaseMetadata {
  version: string;
  created_at: string;
  last_updated: string;
  checksum: string;
  encryption_enabled: boolean;
  sync_status: string;
}

interface EntityConfig {
  file: string;
  primary_key: string;
  indexes: string[];
  relations: Record<string, string>;
  last_sync: string;
  record_count: number;
}

interface MainDatabase {
  metadata: DatabaseMetadata;
  entities: Record<string, EntityConfig>;
  transaction_log: TransactionLog[];
  cache_invalidation: {
    last_clear: string;
    auto_clear_interval: number;
  };
}

interface TransactionLog {
  id: string;
  timestamp: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  record_id: string;
  changes: any;
  checksum: string;
}

class JSONDatabase {
  private cache = new Map<string, any[]>();
  private mainDb: MainDatabase | null = null;
  private lockfile = new Set<string>();
  private encryptionKey = process.env.DB_ENCRYPTION_KEY || 'udaan-secure-key-2025';

  constructor() {
    this.loadMainDatabase();
    this.setupCleanupInterval();
  }

  private async loadMainDatabase(): Promise<void> {
    try {
      const mainDbPath = path.join(DB_FOLDER, MAIN_DB_FILE);
      const data = await fs.readFile(mainDbPath, 'utf-8');
      this.mainDb = JSON.parse(data);
    } catch (error) {
      console.error('Failed to load main database:', error);
      throw new Error('Database initialization failed');
    }
  }

  private async saveMainDatabase(): Promise<void> {
    if (!this.mainDb) return;
    
    const mainDbPath = path.join(DB_FOLDER, MAIN_DB_FILE);
    this.mainDb.metadata.last_updated = new Date().toISOString();
    this.mainDb.metadata.checksum = this.generateChecksum(JSON.stringify(this.mainDb));
    
    await fs.writeFile(mainDbPath, JSON.stringify(this.mainDb, null, 2));
  }

  private generateChecksum(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private encrypt(data: string): string {
    if (!this.mainDb?.metadata.encryption_enabled) return data;
    
    const cipher = createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decrypt(encryptedData: string): string {
    if (!this.mainDb?.metadata.encryption_enabled) return encryptedData;
    
    try {
      const decipher = createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return encryptedData; // Return original if decryption fails
    }
  }

  private async acquireLock(entity: string): Promise<void> {
    while (this.lockfile.has(entity)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.lockfile.add(entity);
  }

  private releaseLock(entity: string): void {
    this.lockfile.delete(entity);
  }

  private async loadEntity(entity: string): Promise<any[]> {
    if (this.cache.has(entity)) {
      return this.cache.get(entity)!;
    }

    await this.acquireLock(entity);
    
    try {
      const entityConfig = this.mainDb?.entities[entity];
      if (!entityConfig) throw new Error(`Entity ${entity} not found`);

      const filePath = path.join(DB_FOLDER, entityConfig.file);
      const data = await fs.readFile(filePath, 'utf-8');
      const records = JSON.parse(this.decrypt(data));
      
      this.cache.set(entity, records);
      return records;
    } catch (error) {
      console.error(`Failed to load entity ${entity}:`, error);
      return [];
    } finally {
      this.releaseLock(entity);
    }
  }

  private async saveEntity(entity: string, records: any[]): Promise<void> {
    await this.acquireLock(entity);
    
    try {
      const entityConfig = this.mainDb?.entities[entity];
      if (!entityConfig) throw new Error(`Entity ${entity} not found`);

      const filePath = path.join(DB_FOLDER, entityConfig.file);
      const encryptedData = this.encrypt(JSON.stringify(records, null, 2));
      await fs.writeFile(filePath, encryptedData);
      
      // Update cache and metadata
      this.cache.set(entity, records);
      entityConfig.record_count = records.length;
      entityConfig.last_sync = new Date().toISOString();
      
      await this.saveMainDatabase();
    } finally {
      this.releaseLock(entity);
    }
  }

  private async logTransaction(operation: string, entity: string, recordId: string, changes: any): Promise<void> {
    if (!this.mainDb) return;

    const transaction: TransactionLog = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      operation: operation as any,
      entity,
      record_id: recordId,
      changes,
      checksum: this.generateChecksum(JSON.stringify(changes))
    };

    this.mainDb.transaction_log.push(transaction);
    
    // Keep only last 1000 transactions
    if (this.mainDb.transaction_log.length > 1000) {
      this.mainDb.transaction_log = this.mainDb.transaction_log.slice(-1000);
    }
  }

  private async updateRelatedEntities(entity: string, record: any, operation: string): Promise<void> {
    const entityConfig = this.mainDb?.entities[entity];
    if (!entityConfig) return;

    // Handle cascading updates for relations
    for (const [relationName, relationPath] of Object.entries(entityConfig.relations)) {
      const [targetEntity, targetField] = relationPath.split('.');
      
      if (operation === 'DELETE') {
        // Remove related records on delete
        const relatedRecords = await this.loadEntity(targetEntity);
        const updatedRecords = relatedRecords.filter(r => r[targetField] !== record[entityConfig.primary_key]);
        if (updatedRecords.length !== relatedRecords.length) {
          await this.saveEntity(targetEntity, updatedRecords);
        }
      }
    }
  }

  private setupCleanupInterval(): void {
    setInterval(() => {
      this.clearExpiredCache();
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }

  private clearExpiredCache(): void {
    if (!this.mainDb) return;
    
    const cacheInterval = this.mainDb.cache_invalidation.auto_clear_interval * 1000;
    const lastClear = new Date(this.mainDb.cache_invalidation.last_clear).getTime();
    
    if (Date.now() - lastClear > cacheInterval) {
      this.cache.clear();
      this.mainDb.cache_invalidation.last_clear = new Date().toISOString();
      this.saveMainDatabase();
    }
  }

  // Public API Methods
  async find(entity: string, query: any = {}): Promise<any[]> {
    const records = await this.loadEntity(entity);
    
    if (Object.keys(query).length === 0) return records;
    
    return records.filter(record => {
      return Object.entries(query).every(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle complex queries like { status: { $in: ['active', 'pending'] } }
          const queryValue = value as any;
          if (queryValue.$in && Array.isArray(queryValue.$in)) {
            return queryValue.$in.includes(record[key]);
          }
          if (queryValue.$ne !== undefined) {
            return record[key] !== queryValue.$ne;
          }
          if (queryValue.$gt !== undefined) {
            return record[key] > queryValue.$gt;
          }
          if (queryValue.$lt !== undefined) {
            return record[key] < queryValue.$lt;
          }
        }
        return record[key] === value;
      });
    });
  }

  async findById(entity: string, id: string): Promise<any | null> {
    const records = await this.loadEntity(entity);
    const entityConfig = this.mainDb?.entities[entity];
    if (!entityConfig) return null;
    
    return records.find(record => record[entityConfig.primary_key] === id) || null;
  }

  async create(entity: string, data: any): Promise<any> {
    const records = await this.loadEntity(entity);
    const entityConfig = this.mainDb?.entities[entity];
    if (!entityConfig) throw new Error(`Entity ${entity} not found`);

    // Generate ID if not provided
    if (!data[entityConfig.primary_key]) {
      data[entityConfig.primary_key] = nanoid();
    }
    
    // Add timestamps
    data.created_at = data.created_at || new Date().toISOString();
    data.updated_at = new Date().toISOString();

    records.push(data);
    await this.saveEntity(entity, records);
    await this.logTransaction('CREATE', entity, data[entityConfig.primary_key], data);
    await this.updateRelatedEntities(entity, data, 'CREATE');

    return data;
  }

  async update(entity: string, id: string, updates: any): Promise<any | null> {
    const records = await this.loadEntity(entity);
    const entityConfig = this.mainDb?.entities[entity];
    if (!entityConfig) throw new Error(`Entity ${entity} not found`);

    const index = records.findIndex(record => record[entityConfig.primary_key] === id);
    if (index === -1) return null;

    const originalRecord = { ...records[index] };
    records[index] = { ...records[index], ...updates, updated_at: new Date().toISOString() };
    
    await this.saveEntity(entity, records);
    await this.logTransaction('UPDATE', entity, id, { before: originalRecord, after: records[index] });
    await this.updateRelatedEntities(entity, records[index], 'UPDATE');

    return records[index];
  }

  async delete(entity: string, id: string): Promise<boolean> {
    const records = await this.loadEntity(entity);
    const entityConfig = this.mainDb?.entities[entity];
    if (!entityConfig) throw new Error(`Entity ${entity} not found`);

    const index = records.findIndex(record => record[entityConfig.primary_key] === id);
    if (index === -1) return false;

    const deletedRecord = records[index];
    records.splice(index, 1);
    
    await this.saveEntity(entity, records);
    await this.logTransaction('DELETE', entity, id, deletedRecord);
    await this.updateRelatedEntities(entity, deletedRecord, 'DELETE');

    return true;
  }

  async findWithRelations(entity: string, id: string, relations: string[] = []): Promise<any | null> {
    const record = await this.findById(entity, id);
    if (!record) return null;

    const entityConfig = this.mainDb?.entities[entity];
    if (!entityConfig) return record;

    // Load related data
    for (const relation of relations) {
      const relationPath = entityConfig.relations[relation];
      if (relationPath) {
        const [targetEntity, targetField] = relationPath.split('.');
        const relatedRecords = await this.find(targetEntity, { [targetField]: record[entityConfig.primary_key] });
        record[relation] = relatedRecords;
      }
    }

    return record;
  }

  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    // Create a transaction checkpoint
    const checkpointId = nanoid();
    const checkpoint = new Map(this.cache);
    
    try {
      const result = await operations();
      return result;
    } catch (error) {
      // Rollback on error
      this.cache = checkpoint;
      throw error;
    }
  }

  async getStats(): Promise<any> {
    if (!this.mainDb) return {};
    
    const stats: any = {
      entities: {},
      cache_size: this.cache.size,
      last_transaction: this.mainDb.transaction_log[this.mainDb.transaction_log.length - 1]?.timestamp,
      total_transactions: this.mainDb.transaction_log.length
    };

    for (const [entityName, config] of Object.entries(this.mainDb.entities)) {
      stats.entities[entityName] = {
        record_count: config.record_count,
        last_sync: config.last_sync
      };
    }

    return stats;
  }

  invalidateCache(entity?: string): void {
    if (entity) {
      this.cache.delete(entity);
    } else {
      this.cache.clear();
    }
  }
}

export const jsonDb = new JSONDatabase();