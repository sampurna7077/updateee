import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const JSON_DB_FOLDER = '06jbjz5PvFtImMG2VzFz6LHiD0Uom5E9ltYCAfKtS2sZAXCixewC4BfqBHBha5HUh328YEL2BBHEKpTe';

interface SimpleEntity {
  id: string;
  [key: string]: any;
}

class SimpleJSONStorage {
  private cache = new Map<string, SimpleEntity[]>();

  // Method to clear cache for immediate data refresh
  clearCache(collection?: string): void {
    if (collection) {
      const fileName = `${collection}.json`;
      this.cache.delete(fileName);
    } else {
      this.cache.clear();
    }
  }

  private async ensureFolder(): Promise<void> {
    try {
      await fs.access(JSON_DB_FOLDER);
    } catch {
      await fs.mkdir(JSON_DB_FOLDER, { recursive: true });
    }
  }

  private async loadFile(fileName: string): Promise<SimpleEntity[]> {
    await this.ensureFolder();
    const filePath = path.join(JSON_DB_FOLDER, fileName);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      // File doesn't exist, return empty array
      return [];
    }
  }

  private async saveFile(fileName: string, data: SimpleEntity[]): Promise<void> {
    await this.ensureFolder();
    const filePath = path.join(JSON_DB_FOLDER, fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    this.cache.set(fileName, data);
  }

  private async getCollection(collection: string): Promise<SimpleEntity[]> {
    const fileName = `${collection}.json`;
    
    // Always reload from disk to get fresh data (especially important for manual edits)
    const data = await this.loadFile(fileName);
    this.cache.set(fileName, data);
    return data;
  }

  async find(collection: string, query: any = {}): Promise<SimpleEntity[]> {
    const data = await this.getCollection(collection);
    
    if (Object.keys(query).length === 0) {
      return data;
    }

    return data.filter(item => {
      return Object.entries(query).every(([key, value]) => {
        return item[key] === value;
      });
    });
  }

  async findById(collection: string, id: string): Promise<SimpleEntity | null> {
    const data = await this.getCollection(collection);
    return data.find(item => item.id === id) || null;
  }

  async create(collection: string, item: Partial<SimpleEntity>): Promise<SimpleEntity> {
    const data = await this.getCollection(collection);
    const newItem: SimpleEntity = {
      id: item.id || nanoid(),
      ...item,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    data.push(newItem);
    await this.saveFile(`${collection}.json`, data);
    return newItem;
  }

  async update(collection: string, id: string, updates: Partial<SimpleEntity>): Promise<SimpleEntity | null> {
    const data = await this.getCollection(collection);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      return null;
    }

    data[index] = { 
      ...data[index], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    
    await this.saveFile(`${collection}.json`, data);
    return data[index];
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const data = await this.getCollection(collection);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      return false;
    }

    data.splice(index, 1);
    await this.saveFile(`${collection}.json`, data);
    return true;
  }

  // Clear cache
  invalidateCache(collection?: string): void {
    if (collection) {
      this.cache.delete(`${collection}.json`);
    } else {
      this.cache.clear();
    }
  }
}

export const simpleJsonDb = new SimpleJSONStorage();