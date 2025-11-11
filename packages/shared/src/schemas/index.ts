import { z } from 'zod';
import { DatabaseEngine, StorageType } from '../types/index.js';

export const createDatabaseSchema = z.object({
  name: z.string().min(1).max(255),
  engine: z.nativeEnum(DatabaseEngine),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1),
  password: z.string().min(1),
  database: z.string().optional(),
  sslMode: z.enum(['DISABLE', 'REQUIRE', 'PREFER', 'VERIFY_CA', 'VERIFY_FULL']).optional(),
});

export const updateDatabaseSchema = createDatabaseSchema.partial();

export const createStorageTargetSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(StorageType),
  config: z.record(z.unknown()),
  encryptionKey: z.string().length(32).optional(), // AES-256 requires 32 bytes
});

export const updateStorageTargetSchema = createStorageTargetSchema.partial();

export const createBackupSchema = z.object({
  databaseId: z.string().cuid(),
  storageId: z.string().cuid(),
});

export const createRestoreSchema = z.object({
  backupId: z.string().cuid(),
  targetHost: z.string().optional(),
  targetPort: z.number().int().min(1).max(65535).optional(),
  targetDb: z.string().optional(),
  targetUsername: z.string().optional(),
  targetPassword: z.string().optional(),
  dropExisting: z.boolean().optional().default(true),
});

export const createScheduleSchema = z.object({
  name: z.string().min(1).max(255),
  enabled: z.boolean().default(true),
  databaseId: z.string().cuid(),
  storageId: z.string().cuid(),
  cronExpression: z.string().regex(/^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|((\*|\d+)(\/|-)\d+)|\d+|\*) ?){5,7})$/),
  timezone: z.string().default('UTC'),
  retentionDays: z.number().int().positive().optional(),
  retentionCount: z.number().int().positive().optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial();
