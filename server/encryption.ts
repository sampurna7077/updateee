import { createCipheriv, createDecipheriv, randomBytes, scrypt, createHmac } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Encryption configuration - Using AES-256-GCM equivalent with AES-256-CBC + HMAC
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // 128-bit IV
const SALT_LENGTH = 32; // 256-bit salt for key derivation
const KEY_LENGTH = 32; // 256-bit key
const HMAC_KEY_LENGTH = 32; // 256-bit HMAC key

// Environment variables for key management
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'default_dev_key_' + 'x'.repeat(50);
const KEY_ROTATION_SECRET = process.env.KEY_ROTATION_SECRET || 'default_dev_rotation_' + 'y'.repeat(20);
const CURRENT_KEY_VERSION = parseInt(process.env.ENCRYPTION_KEY_VERSION || '1');

interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded IV
  authTag: string; // Base64 encoded authentication tag (HMAC)
  salt: string; // Base64 encoded salt
  keyVersion: number; // Key version for rotation support
}

interface AuditLog {
  timestamp: Date;
  operation: 'encrypt' | 'decrypt' | 'key_rotation' | 'access_attempt';
  fieldType: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  keyVersion: number;
  success: boolean;
  errorMessage?: string;
}

class EncryptionService {
  private auditLogs: AuditLog[] = [];

  /**
   * Derive encryption key from master key and salt
   */
  private async deriveKey(salt: Buffer, keyVersion: number = CURRENT_KEY_VERSION): Promise<{ encKey: Buffer; hmacKey: Buffer }> {
    const baseKey = `${MASTER_KEY}_v${keyVersion}_${KEY_ROTATION_SECRET}`;
    
    // Derive encryption key
    const encKey = await scryptAsync(baseKey + '_enc', salt, KEY_LENGTH) as Buffer;
    
    // Derive HMAC key
    const hmacKey = await scryptAsync(baseKey + '_hmac', salt, HMAC_KEY_LENGTH) as Buffer;
    
    return { encKey, hmacKey };
  }

  /**
   * Create HMAC authentication tag
   */
  private createAuthTag(data: string, hmacKey: Buffer, iv: Buffer, fieldType: string): string {
    const hmac = createHmac('sha256', hmacKey);
    hmac.update(data);
    hmac.update(iv);
    hmac.update(fieldType); // Additional authenticated data
    return hmac.digest('base64');
  }

  /**
   * Verify HMAC authentication tag
   */
  private verifyAuthTag(data: string, hmacKey: Buffer, iv: Buffer, fieldType: string, authTag: string): boolean {
    const expectedTag = this.createAuthTag(data, hmacKey, iv, fieldType);
    
    // Use constant-time comparison to prevent timing attacks
    if (expectedTag.length !== authTag.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < expectedTag.length; i++) {
      result |= expectedTag.charCodeAt(i) ^ authTag.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Create audit log entry
   */
  private createAuditLog(
    operation: AuditLog['operation'],
    fieldType: string,
    success: boolean,
    context?: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
    }
  ): void {
    const auditEntry: AuditLog = {
      timestamp: new Date(),
      operation,
      fieldType,
      keyVersion: CURRENT_KEY_VERSION,
      success,
      ...context
    };

    this.auditLogs.push(auditEntry);
    
    // Log to console in development, should be sent to secure logging service in production
    if (process.env.NODE_ENV === 'development') {
      console.log('[ENCRYPTION_AUDIT]', JSON.stringify(auditEntry));
    }
    
    // TODO: Send to secure audit logging service
    // await secureAuditService.log(auditEntry);
  }

  /**
   * Encrypt sensitive PII data using AES-256-CBC with HMAC authentication
   */
  async encryptPII(
    plaintext: string,
    fieldType: string,
    context?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<EncryptedData> {
    try {
      if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('Invalid plaintext data');
      }

      // Generate random salt and IV
      const salt = randomBytes(SALT_LENGTH);
      const iv = randomBytes(IV_LENGTH);

      // Derive encryption and HMAC keys
      const { encKey, hmacKey } = await this.deriveKey(salt);

      // Create cipher and encrypt
      const cipher = createCipheriv(ALGORITHM, encKey, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const encryptedBase64 = encrypted.toString('base64');

      // Create authentication tag
      const authTag = this.createAuthTag(encryptedBase64, hmacKey, iv, fieldType);

      const encryptedData: EncryptedData = {
        data: encryptedBase64,
        iv: iv.toString('base64'),
        authTag: authTag,
        salt: salt.toString('base64'),
        keyVersion: CURRENT_KEY_VERSION
      };

      // Audit log
      this.createAuditLog('encrypt', fieldType, true, context);

      return encryptedData;
    } catch (error) {
      this.createAuditLog('encrypt', fieldType, false, {
        ...context,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt sensitive PII data using AES-256-CBC with HMAC verification
   */
  async decryptPII(
    encryptedData: EncryptedData,
    fieldType: string,
    context?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<string> {
    try {
      if (!encryptedData || !encryptedData.data || !encryptedData.iv || !encryptedData.authTag || !encryptedData.salt) {
        throw new Error('Invalid encrypted data structure');
      }

      // Convert from base64
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const salt = Buffer.from(encryptedData.salt, 'base64');
      const encryptedBuffer = Buffer.from(encryptedData.data, 'base64');

      // Derive keys using the version from encrypted data (supports key rotation)
      const { encKey, hmacKey } = await this.deriveKey(salt, encryptedData.keyVersion);

      // Verify authentication tag
      if (!this.verifyAuthTag(encryptedData.data, hmacKey, iv, fieldType, encryptedData.authTag)) {
        throw new Error('Authentication verification failed - data may be tampered');
      }

      // Create decipher and decrypt
      const decipher = createDecipheriv(ALGORITHM, encKey, iv);
      
      let decrypted = decipher.update(encryptedBuffer);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      const decryptedString = decrypted.toString('utf8');

      // Audit log
      this.createAuditLog('decrypt', fieldType, true, context);

      return decryptedString;
    } catch (error) {
      this.createAuditLog('decrypt', fieldType, false, {
        ...context,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rotate encryption keys - re-encrypt data with new key version
   */
  async rotateKey(
    encryptedData: EncryptedData,
    fieldType: string,
    context?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<EncryptedData> {
    try {
      // First decrypt with old key
      const plaintext = await this.decryptPII(encryptedData, fieldType, context);
      
      // Then encrypt with new key version
      const newEncryptedData = await this.encryptPII(plaintext, fieldType, context);

      // Audit log
      this.createAuditLog('key_rotation', fieldType, true, {
        ...context,
        errorMessage: `Rotated from version ${encryptedData.keyVersion} to ${newEncryptedData.keyVersion}`
      });

      return newEncryptedData;
    } catch (error) {
      this.createAuditLog('key_rotation', fieldType, false, {
        ...context,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Key rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if data needs key rotation
   */
  needsKeyRotation(encryptedData: EncryptedData): boolean {
    return encryptedData.keyVersion < CURRENT_KEY_VERSION;
  }

  /**
   * Get audit logs (in production, this should query secure audit service)
   */
  getAuditLogs(filters?: {
    operation?: AuditLog['operation'];
    fieldType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.operation) {
        logs = logs.filter(log => log.operation === filters.operation);
      }
      if (filters.fieldType) {
        logs = logs.filter(log => log.fieldType === filters.fieldType);
      }
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate secure environment variables for initial setup
   */
  static generateSecurityKeys(): { masterKey: string; rotationSecret: string } {
    return {
      masterKey: randomBytes(64).toString('hex'),
      rotationSecret: randomBytes(32).toString('hex')
    };
  }

  /**
   * Validate that all required environment variables are set
   */
  static validateEnvironment(): void {
    const requiredVars = [
      'ENCRYPTION_MASTER_KEY',
      'KEY_ROTATION_SECRET',
      'ENCRYPTION_KEY_VERSION'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0 && process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required encryption environment variables: ${missing.join(', ')}`);
    }

    if (process.env.ENCRYPTION_MASTER_KEY && process.env.ENCRYPTION_MASTER_KEY.length < 64) {
      throw new Error('ENCRYPTION_MASTER_KEY must be at least 64 characters long');
    }

    if (process.env.KEY_ROTATION_SECRET && process.env.KEY_ROTATION_SECRET.length < 32) {
      throw new Error('KEY_ROTATION_SECRET must be at least 32 characters long');
    }
  }
}

// Validate environment on import (but allow dev defaults)
try {
  EncryptionService.validateEnvironment();
} catch (error) {
  if (process.env.NODE_ENV === 'production') {
    throw error;
  } else {
    console.warn('[ENCRYPTION] Using development defaults. Set proper environment variables for production.');
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
export { EncryptedData, AuditLog };
export default EncryptionService;