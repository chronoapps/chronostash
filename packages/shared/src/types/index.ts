export enum DatabaseEngine {
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
  MONGODB = 'MONGODB',
}

export enum StorageType {
  S3 = 'S3',
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  CLOUDFLARE_R2 = 'CLOUDFLARE_R2',
}

export enum BackupStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum RestoreStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Database {
  id: string;
  name: string;
  engine: DatabaseEngine;
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;
  sslMode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageTarget {
  id: string;
  name: string;
  type: StorageType;
  config: Record<string, unknown>;
  encryptionKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Backup {
  id: string;
  databaseId: string;
  storageId: string;
  status: BackupStatus;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  size?: bigint;
  storagePath?: string;
  manifest?: Record<string, unknown>;
  error?: string;
  scheduleId?: string;
  createdAt: Date;
}

export interface Restore {
  id: string;
  backupId: string;
  targetHost?: string;
  targetPort?: number;
  targetDb?: string;
  targetUsername?: string;
  targetPassword?: string;
  dropExisting?: boolean;
  status: RestoreStatus;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  createdAt: Date;
}

export interface Schedule {
  id: string;
  name: string;
  enabled: boolean;
  databaseId: string;
  storageId: string;
  cronExpression: string;
  timezone: string;
  retentionDays?: number;
  retentionCount?: number;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
