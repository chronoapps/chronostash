import { spawn } from 'child_process';
import { Readable } from 'stream';
import { Client } from 'pg';
import {
  DatabaseEngine,
  ConnectionConfig,
  BackupConfig,
  BackupResult,
  RestoreConfig,
  RestoreResult,
} from './interface.js';

export class PostgreSQLEngine implements DatabaseEngine {
  async testConnection(config: ConnectionConfig): Promise<boolean> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database || 'postgres',
      ssl: config.sslMode === 'REQUIRE' ? { rejectUnauthorized: false } : false,
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getDatabaseSize(config: ConnectionConfig): Promise<number> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database || 'postgres',
      ssl: config.sslMode === 'REQUIRE' ? { rejectUnauthorized: false } : false,
    });

    try {
      await client.connect();
      const result = await client.query(
        `SELECT pg_database_size($1) as size`,
        [config.database || 'postgres']
      );
      await client.end();
      return parseInt(result.rows[0].size);
    } catch (error) {
      throw new Error(`Failed to get database size: ${error}`);
    }
  }

  async backup(config: BackupConfig): Promise<BackupResult> {
    const args = [
      '-h', config.host,
      '-p', config.port.toString(),
      '-U', config.username,
      '-Fc', // Custom format (compressed)
      '--no-owner',
      '--no-privileges',
      '--no-comments', // Exclude comments to reduce size
      '--exclude-schema=information_schema', // Exclude system schemas
      '--exclude-schema=pg_catalog',
    ];

    if (config.database) {
      args.push('-d', config.database);
    }

    const env = {
      ...process.env,
      PGPASSWORD: config.password,
    };

    return new Promise((resolve, reject) => {
      const pgDump = spawn('pg_dump', args, { env });

      const stream = Readable.from(pgDump.stdout);
      let stderr = '';

      pgDump.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pgDump.on('error', (error) => {
        reject(new Error(`pg_dump failed to start: ${error.message}`));
      });

      pgDump.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`pg_dump exited with code ${code}: ${stderr}`));
        }
      });

      // Get PostgreSQL version
      const version = '15.0'; // TODO: Query actual version

      resolve({
        stream,
        metadata: {
          engine: 'postgresql',
          version,
          databases: config.database ? [config.database] : [],
        },
      });
    });
  }

  async restore(config: RestoreConfig): Promise<RestoreResult> {
    const args = [
      '-h', config.host,
      '-p', config.port.toString(),
      '-U', config.username,
      '-d', config.database || 'postgres',
      '--no-owner', // Don't try to set ownership (may not have permissions)
      '--no-privileges', // Don't restore privileges (may not have permissions)
      // Note: We don't use --exit-on-error to allow version compatibility issues to be ignored
    ];

    if (config.dropExisting) {
      args.push('--clean', '--if-exists');
    }

    const env = {
      ...process.env,
      PGPASSWORD: config.password,
    };

    return new Promise((resolve, reject) => {
      const pgRestore = spawn('pg_restore', args, { env });

      let stderr = '';

      config.stream.pipe(pgRestore.stdin);

      pgRestore.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pgRestore.on('error', (error) => {
        reject(new Error(`pg_restore failed to start: ${error.message}`));
      });

      pgRestore.on('close', (code) => {
        // pg_restore may exit with code 1 for warnings (e.g., version compatibility issues)
        // but the data is still restored successfully. Check stderr for actual failures.
        const hasWarningsOnly = stderr.includes('errors ignored on restore:') ||
                                stderr.includes('warning:');
        const hasCriticalErrors = stderr.toLowerCase().includes('fatal') ||
                                  stderr.toLowerCase().includes('could not restore') ||
                                  stderr.toLowerCase().includes('connection refused');

        if (code !== 0 && hasCriticalErrors) {
          // Critical error - fail the restore
          reject(new Error(`pg_restore exited with code ${code}: ${stderr}`));
        } else if (code !== 0 && hasWarningsOnly) {
          // Non-critical warnings - log but succeed
          console.warn(`pg_restore completed with warnings (exit code ${code}): ${stderr}`);
          resolve({
            success: true,
          });
        } else if (code !== 0) {
          // Unknown error - fail to be safe
          reject(new Error(`pg_restore exited with code ${code}: ${stderr}`));
        } else {
          // Success
          resolve({
            success: true,
          });
        }
      });
    });
  }
}
