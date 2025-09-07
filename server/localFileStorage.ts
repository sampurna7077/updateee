import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export class LocalFileStorage {
  private baseUploadDir = path.join(process.cwd(), 'server', 'uploads');
  private uploadDir = path.join(this.baseUploadDir, 'advertisements');
  
  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir(subdir?: string) {
    const targetDir = subdir ? path.join(this.baseUploadDir, subdir) : this.uploadDir;
    try {
      await fs.access(targetDir);
    } catch {
      await fs.mkdir(targetDir, { recursive: true });
    }
  }

  /**
   * Save a file buffer to local storage
   */
  async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    subdir?: string
  ): Promise<string> {
    const targetDir = subdir ? path.join(this.baseUploadDir, subdir) : this.uploadDir;
    
    // Ensure target directory exists
    await this.ensureUploadDir(subdir);
    
    const fileExtension = originalName.split('.').pop() || 'bin';
    const fileName = `${randomUUID()}.${fileExtension}`;
    const filePath = path.join(targetDir, fileName);

    await fs.writeFile(filePath, fileBuffer);
    
    // Return relative path for serving
    const relativePath = subdir ? `/uploads/${subdir}/${fileName}` : `/uploads/advertisements/${fileName}`;
    return relativePath;
  }

  /**
   * Get file from local storage
   */
  async getFile(fileName: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  /**
   * Delete a file from local storage
   */
  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get file path for serving
   */
  getFilePath(fileName: string): string {
    return path.join(this.uploadDir, fileName);
  }

  /**
   * Check if file exists
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all files in the upload directory
   */
  async listFiles(): Promise<string[]> {
    try {
      return await fs.readdir(this.uploadDir);
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Clean up expired advertisement files
   */
  async cleanupExpiredFiles(expiredFilePaths: string[]): Promise<number> {
    let deletedCount = 0;
    
    for (const filePath of expiredFilePaths) {
      // Extract filename from path like "/uploads/advertisements/filename.jpg"
      const fileName = filePath.split('/').pop();
      if (fileName && await this.deleteFile(fileName)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
}