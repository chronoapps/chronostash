import { describe, it, expect } from '@jest/globals';
import {
  createDatabaseSchema,
  updateDatabaseSchema,
  createStorageTargetSchema,
  updateStorageTargetSchema,
  createBackupSchema,
  createRestoreSchema,
  createScheduleSchema,
  updateScheduleSchema,
} from '../schemas.js';
import { DatabaseEngine, StorageType } from '../types.js';

describe('Database Schemas', () => {
  describe('createDatabaseSchema', () => {
    it('should validate a valid database config', () => {
      const valid = {
        name: 'My Database',
        engine: DatabaseEngine.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'secret',
        database: 'mydb',
        sslMode: 'DISABLE' as const,
      };

      expect(() => createDatabaseSchema.parse(valid)).not.toThrow();
    });

    it('should fail with empty name', () => {
      const invalid = {
        name: '',
        engine: DatabaseEngine.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'secret',
      };

      expect(() => createDatabaseSchema.parse(invalid)).toThrow();
    });

    it('should fail with invalid port', () => {
      const invalid = {
        name: 'Test',
        engine: DatabaseEngine.POSTGRESQL,
        host: 'localhost',
        port: 70000, // Invalid port
        username: 'postgres',
        password: 'secret',
      };

      expect(() => createDatabaseSchema.parse(invalid)).toThrow();
    });

    it('should allow optional database and sslMode', () => {
      const valid = {
        name: 'Test',
        engine: DatabaseEngine.MYSQL,
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'secret',
      };

      const result = createDatabaseSchema.parse(valid);
      expect(result.database).toBeUndefined();
      expect(result.sslMode).toBeUndefined();
    });

    it('should validate all database engines', () => {
      const engines = [DatabaseEngine.POSTGRESQL, DatabaseEngine.MYSQL, DatabaseEngine.MONGODB];

      engines.forEach((engine) => {
        const valid = {
          name: 'Test',
          engine,
          host: 'localhost',
          port: 5432,
          username: 'user',
          password: 'pass',
        };

        expect(() => createDatabaseSchema.parse(valid)).not.toThrow();
      });
    });
  });

  describe('updateDatabaseSchema', () => {
    it('should allow partial updates', () => {
      const partial = { name: 'Updated Name' };
      expect(() => updateDatabaseSchema.parse(partial)).not.toThrow();
    });

    it('should allow empty object', () => {
      expect(() => updateDatabaseSchema.parse({})).not.toThrow();
    });
  });
});

describe('Storage Target Schemas', () => {
  describe('createStorageTargetSchema', () => {
    it('should validate S3 storage config', () => {
      const valid = {
        name: 'S3 Backup',
        type: StorageType.S3,
        config: {
          endpoint: 'https://s3.amazonaws.com',
          bucket: 'my-backups',
          region: 'us-east-1',
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        },
      };

      expect(() => createStorageTargetSchema.parse(valid)).not.toThrow();
    });

    it('should validate with encryption key', () => {
      const valid = {
        name: 'Encrypted Storage',
        type: StorageType.S3,
        config: {},
        encryptionKey: '12345678901234567890123456789012', // 32 chars
      };

      expect(() => createStorageTargetSchema.parse(valid)).not.toThrow();
    });

    it('should fail with invalid encryption key length', () => {
      const invalid = {
        name: 'Test',
        type: StorageType.S3,
        config: {},
        encryptionKey: 'tooshort', // Not 32 chars
      };

      expect(() => createStorageTargetSchema.parse(invalid)).toThrow();
    });

    it('should validate all storage types', () => {
      const types = [StorageType.S3, StorageType.GOOGLE_DRIVE, StorageType.CLOUDFLARE_R2];

      types.forEach((type) => {
        const valid = {
          name: 'Test',
          type,
          config: {},
        };

        expect(() => createStorageTargetSchema.parse(valid)).not.toThrow();
      });
    });
  });

  describe('updateStorageTargetSchema', () => {
    it('should allow partial updates', () => {
      const partial = { name: 'Updated' };
      expect(() => updateStorageTargetSchema.parse(partial)).not.toThrow();
    });
  });
});

describe('Backup Schema', () => {
  it('should validate valid backup request', () => {
    const valid = {
      databaseId: 'cjld2cyuq0000t3rmniod1foy',
      storageId: 'cjld2cyuq0001t3rmniod1foz',
    };

    expect(() => createBackupSchema.parse(valid)).not.toThrow();
  });

  it('should fail with invalid CUID format', () => {
    const invalid = {
      databaseId: 'not-a-valid-cuid',
      storageId: 'cjld2cyuq0001t3rmniod1foz',
    };

    expect(() => createBackupSchema.parse(invalid)).toThrow();
  });

  it('should require both IDs', () => {
    const invalid = { databaseId: 'cjld2cyuq0000t3rmniod1foy' };

    expect(() => createBackupSchema.parse(invalid)).toThrow();
  });
});

describe('Restore Schema', () => {
  it('should validate minimal restore request', () => {
    const valid = {
      backupId: 'cjld2cyuq0000t3rmniod1foy',
    };

    expect(() => createRestoreSchema.parse(valid)).not.toThrow();
  });

  it('should validate restore to different target', () => {
    const valid = {
      backupId: 'cjld2cyuq0000t3rmniod1foy',
      targetHost: 'restore-server.example.com',
      targetPort: 5433,
      targetDb: 'restored_db',
      targetUsername: 'restore_user',
      targetPassword: 'restore_pass',
    };

    const result = createRestoreSchema.parse(valid);
    expect(result.targetHost).toBe('restore-server.example.com');
    expect(result.targetPort).toBe(5433);
  });

  it('should fail with invalid target port', () => {
    const invalid = {
      backupId: 'cjld2cyuq0000t3rmniod1foy',
      targetPort: 99999, // Invalid port
    };

    expect(() => createRestoreSchema.parse(invalid)).toThrow();
  });
});

describe('Schedule Schemas', () => {
  describe('createScheduleSchema', () => {
    it('should validate schedule with standard cron', () => {
      const valid = {
        name: 'Daily Backup',
        enabled: true,
        databaseId: 'cjld2cyuq0000t3rmniod1foy',
        storageId: 'cjld2cyuq0001t3rmniod1foz',
        cronExpression: '0 2 * * *', // Daily at 2 AM
        timezone: 'America/New_York',
        retentionDays: 30,
        retentionCount: 10,
      };

      expect(() => createScheduleSchema.parse(valid)).not.toThrow();
    });

    it('should validate schedule with named cron expressions', () => {
      const namedExpressions = [
        '@hourly',
        '@daily',
        '@weekly',
        '@monthly',
        '@yearly',
        '@annually',
      ];

      namedExpressions.forEach((cronExpression) => {
        const valid = {
          name: 'Test Schedule',
          databaseId: 'cjld2cyuq0000t3rmniod1foy',
          storageId: 'cjld2cyuq0001t3rmniod1foz',
          cronExpression,
        };

        expect(() => createScheduleSchema.parse(valid)).not.toThrow();
      });
    });

    it('should validate schedule with step cron expressions (*/N syntax)', () => {
      const stepExpressions = [
        '*/5 * * * *',      // Every 5 minutes
        '0 */2 * * *',      // Every 2 hours at minute 0
        '0 */1 * * *',      // Every 1 hour at minute 0
        '*/15 * * * *',     // Every 15 minutes
        '0 0 */2 * *',      // Every 2 days at midnight
      ];

      stepExpressions.forEach((cronExpression) => {
        const valid = {
          name: 'Test Schedule',
          databaseId: 'cjld2cyuq0000t3rmniod1foy',
          storageId: 'cjld2cyuq0001t3rmniod1foz',
          cronExpression,
        };

        expect(() => createScheduleSchema.parse(valid)).not.toThrow();
      });
    });

    it('should default enabled to true', () => {
      const valid = {
        name: 'Test',
        databaseId: 'cjld2cyuq0000t3rmniod1foy',
        storageId: 'cjld2cyuq0001t3rmniod1foz',
        cronExpression: '@daily',
      };

      const result = createScheduleSchema.parse(valid);
      expect(result.enabled).toBe(true);
    });

    it('should default timezone to UTC', () => {
      const valid = {
        name: 'Test',
        databaseId: 'cjld2cyuq0000t3rmniod1foy',
        storageId: 'cjld2cyuq0001t3rmniod1foz',
        cronExpression: '@daily',
      };

      const result = createScheduleSchema.parse(valid);
      expect(result.timezone).toBe('UTC');
    });

    it('should fail with invalid cron expression', () => {
      const invalid = {
        name: 'Test',
        databaseId: 'cjld2cyuq0000t3rmniod1foy',
        storageId: 'cjld2cyuq0001t3rmniod1foz',
        cronExpression: 'not-a-valid-cron',
      };

      expect(() => createScheduleSchema.parse(invalid)).toThrow();
    });

    it('should fail with negative retention values', () => {
      const invalid = {
        name: 'Test',
        databaseId: 'cjld2cyuq0000t3rmniod1foy',
        storageId: 'cjld2cyuq0001t3rmniod1foz',
        cronExpression: '@daily',
        retentionDays: -5,
      };

      expect(() => createScheduleSchema.parse(invalid)).toThrow();
    });
  });

  describe('updateScheduleSchema', () => {
    it('should allow partial updates', () => {
      const partial = { enabled: false };
      expect(() => updateScheduleSchema.parse(partial)).not.toThrow();
    });

    it('should allow updating cron expression only', () => {
      const partial = { cronExpression: '0 3 * * *' };
      expect(() => updateScheduleSchema.parse(partial)).not.toThrow();
    });
  });
});
