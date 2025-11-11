import { spawn } from 'child_process';
import { Readable } from 'stream';
import { MongoClient } from 'mongodb';
import {
  DatabaseEngine,
  ConnectionConfig,
  BackupConfig,
  BackupResult,
  RestoreConfig,
  RestoreResult,
} from './interface.js';

export class MongoDBEngine implements DatabaseEngine {
  private buildConnectionString(config: ConnectionConfig): string {
    const auth = `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}`;
    const host = `${config.host}:${config.port}`;
    const database = config.database || 'admin';
    return `mongodb://${auth}@${host}/${database}`;
  }

  async testConnection(config: ConnectionConfig): Promise<boolean> {
    const uri = this.buildConnectionString(config);
    const client = new MongoClient(uri);

    try {
      await client.connect();
      await client.db().admin().ping();
      await client.close();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getDatabaseSize(config: ConnectionConfig): Promise<number> {
    const uri = this.buildConnectionString(config);
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db(config.database);
      const stats = await db.stats();
      await client.close();
      return stats.dataSize + stats.indexSize;
    } catch (error) {
      throw new Error(`Failed to get database size: ${error}`);
    }
  }

  async backup(config: BackupConfig): Promise<BackupResult> {
    const args = [
      `--host=${config.host}`,
      `--port=${config.port}`,
      `--username=${config.username}`,
      `--password=${config.password}`,
      '--archive',
      '--gzip',
    ];

    if (config.database) {
      args.push(`--db=${config.database}`);
    }

    return new Promise((resolve, reject) => {
      const mongodump = spawn('mongodump', args);

      const stream = Readable.from(mongodump.stdout);
      let stderr = '';

      mongodump.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      mongodump.on('error', (error) => {
        reject(new Error(`mongodump failed to start: ${error.message}`));
      });

      mongodump.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`mongodump exited with code ${code}: ${stderr}`));
        }
      });

      // Get MongoDB version
      const version = '7.0'; // TODO: Query actual version

      resolve({
        stream,
        metadata: {
          engine: 'mongodb',
          version,
          databases: config.database ? [config.database] : [],
        },
      });
    });
  }

  async restore(config: RestoreConfig): Promise<RestoreResult> {
    const args = [
      `--host=${config.host}`,
      `--port=${config.port}`,
      `--username=${config.username}`,
      `--password=${config.password}`,
      '--archive',
      '--gzip',
    ];

    if (config.database) {
      args.push(`--db=${config.database}`);
    }

    if (config.dropExisting) {
      args.push('--drop');
    }

    return new Promise((resolve, reject) => {
      const mongorestore = spawn('mongorestore', args);

      let stderr = '';

      config.stream.pipe(mongorestore.stdin);

      mongorestore.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      mongorestore.on('error', (error) => {
        reject(new Error(`mongorestore failed to start: ${error.message}`));
      });

      mongorestore.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`mongorestore exited with code ${code}: ${stderr}`));
        } else {
          resolve({
            success: true,
          });
        }
      });
    });
  }
}
