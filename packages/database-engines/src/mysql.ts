import { spawn } from 'child_process';
import { Readable } from 'stream';
import mysql from 'mysql2/promise';
import {
  DatabaseEngine,
  ConnectionConfig,
  BackupConfig,
  BackupResult,
  RestoreConfig,
  RestoreResult,
} from './interface.js';

export class MySQLEngine implements DatabaseEngine {
  async testConnection(config: ConnectionConfig): Promise<boolean> {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      ssl: config.sslMode === 'REQUIRE' ? {} : undefined,
    });

    try {
      await connection.query('SELECT 1');
      await connection.end();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getDatabaseSize(config: ConnectionConfig): Promise<number> {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      ssl: config.sslMode === 'REQUIRE' ? {} : undefined,
    });

    try {
      const [rows] = await connection.query<any[]>(
        `SELECT SUM(data_length + index_length) as size
         FROM information_schema.tables
         WHERE table_schema = ?`,
        [config.database]
      );
      await connection.end();
      return parseInt(rows[0]?.size || '0');
    } catch (error) {
      throw new Error(`Failed to get database size: ${error}`);
    }
  }

  async backup(config: BackupConfig): Promise<BackupResult> {
    const args = [
      `-h${config.host}`,
      `-P${config.port}`,
      `-u${config.username}`,
      `-p${config.password}`,
      '--single-transaction',
      '--routines',
      '--triggers',
      '--events',
    ];

    if (config.database) {
      args.push(config.database);
    } else {
      args.push('--all-databases');
    }

    return new Promise((resolve, reject) => {
      const mysqldump = spawn('mysqldump', args);

      const stream = Readable.from(mysqldump.stdout);
      let stderr = '';

      mysqldump.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      mysqldump.on('error', (error) => {
        reject(new Error(`mysqldump failed to start: ${error.message}`));
      });

      mysqldump.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`mysqldump exited with code ${code}: ${stderr}`));
        }
      });

      // Get MySQL version
      const version = '8.0'; // TODO: Query actual version

      resolve({
        stream,
        metadata: {
          engine: 'mysql',
          version,
          databases: config.database ? [config.database] : [],
        },
      });
    });
  }

  async restore(config: RestoreConfig): Promise<RestoreResult> {
    const args = [
      `-h${config.host}`,
      `-P${config.port}`,
      `-u${config.username}`,
      `-p${config.password}`,
    ];

    if (config.database) {
      args.push(config.database);
    }

    return new Promise((resolve, reject) => {
      const mysqlRestore = spawn('mysql', args);

      let stderr = '';

      config.stream.pipe(mysqlRestore.stdin);

      mysqlRestore.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      mysqlRestore.on('error', (error) => {
        reject(new Error(`mysql restore failed to start: ${error.message}`));
      });

      mysqlRestore.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`mysql restore exited with code ${code}: ${stderr}`));
        } else {
          resolve({
            success: true,
          });
        }
      });
    });
  }
}
