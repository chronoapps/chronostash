import { Readable } from 'stream';

export interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;
  sslMode?: string;
}

export interface BackupConfig extends ConnectionConfig {
  mode?: 'logical' | 'physical';
  compression?: boolean;
}

export interface BackupResult {
  stream: Readable;
  size?: number;
  metadata: {
    engine: string;
    version: string;
    databases?: string[];
  };
}

export interface RestoreConfig extends ConnectionConfig {
  stream: Readable;
  dropExisting?: boolean;
}

export interface RestoreResult {
  success: boolean;
  tablesRestored?: number;
  rowsRestored?: number;
}

export interface DatabaseEngine {
  testConnection(config: ConnectionConfig): Promise<boolean>;
  getDatabaseSize(config: ConnectionConfig): Promise<number>;
  backup(config: BackupConfig): Promise<BackupResult>;
  restore(config: RestoreConfig): Promise<RestoreResult>;
}
