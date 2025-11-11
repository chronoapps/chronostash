import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { pino } from 'pino';
import { prisma } from '../services/prisma.js';
import { PostgreSQLEngine } from '@chronostash/database-engines';
import { S3StorageAdapter, GoogleDriveStorageAdapter, StorageAdapter } from '@chronostash/storage-adapters';
import { RestoreStatus, DatabaseEngine, StorageType } from '@chronostash/shared';
import { sendRestoreNotification } from '../services/notification-helper.js';

const logger = pino({ name: 'restore-job' });

interface RestoreJobData {
  restoreId: string;
}

const Redis = (IORedis as any).default || IORedis;
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const restoreWorker = new Worker<RestoreJobData>(
  'restore-jobs',
  async (job: Job<RestoreJobData>) => {
    const { restoreId } = job.data;

    logger.info({ restoreId }, 'Starting restore job');

    // Update status to IN_PROGRESS
    await prisma.restore.update({
      where: { id: restoreId },
      data: {
        status: RestoreStatus.IN_PROGRESS,
        startedAt: new Date(),
        progress: 0,
      },
    });

    try {
      // Fetch restore with relations
      const restore = await prisma.restore.findUnique({
        where: { id: restoreId },
        include: {
          backup: {
            include: {
              database: true,
              storage: true,
            },
          },
        },
      });

      if (!restore) {
        throw new Error(`Restore ${restoreId} not found`);
      }

      if (!restore.backup.storagePath) {
        throw new Error('Backup storage path not found');
      }

      // Initialize storage adapter
      const storageConfig = restore.backup.storage.config as any;
      let storage: StorageAdapter;

      if (restore.backup.storage.type === StorageType.S3 || restore.backup.storage.type === StorageType.CLOUDFLARE_R2) {
        storage = new S3StorageAdapter({
          bucket: storageConfig.bucket,
          region: storageConfig.region,
          endpoint: storageConfig.endpoint,
          accountId: storageConfig.accountId,
          accessKeyId: storageConfig.accessKeyId,
          secretAccessKey: storageConfig.secretAccessKey,
        });
      } else if (restore.backup.storage.type === StorageType.GOOGLE_DRIVE) {
        storage = new GoogleDriveStorageAdapter({
          clientId: storageConfig.clientId,
          clientSecret: storageConfig.clientSecret,
          refreshToken: storageConfig.refreshToken,
          folderId: storageConfig.folderId,
        });
      } else {
        throw new Error(`Storage type ${restore.backup.storage.type} not supported`);
      }

      await job.updateProgress(20);
      await prisma.restore.update({
        where: { id: restoreId },
        data: { progress: 20 },
      });

      // Download backup from storage
      logger.info({ restoreId, path: restore.backup.storagePath }, 'Downloading backup');
      const stream = await storage.download(restore.backup.storagePath);

      await job.updateProgress(50);
      await prisma.restore.update({
        where: { id: restoreId },
        data: { progress: 50 },
      });

      // Initialize database engine
      let engine;
      if (restore.backup.database.engine === DatabaseEngine.POSTGRESQL) {
        engine = new PostgreSQLEngine();
      } else {
        throw new Error(`Engine ${restore.backup.database.engine} not yet implemented`);
      }

      // Determine target connection (use restore target or original source)
      const targetConfig = {
        host: restore.targetHost || restore.backup.database.host,
        port: restore.targetPort || restore.backup.database.port,
        username: restore.targetUsername || restore.backup.database.username,
        password: restore.targetPassword || restore.backup.database.password,
        database: restore.targetDb || restore.backup.database.database || undefined,
        sslMode: restore.backup.database.sslMode || undefined,
      };

      // Execute restore
      const startTime = Date.now();
      logger.info({
        restoreId,
        target: targetConfig.host,
        database: targetConfig.database,
        dropExisting: restore.dropExisting
      }, 'Executing restore');

      await engine.restore({
        ...targetConfig,
        stream,
        dropExisting: restore.dropExisting ?? true, // Default to true if not specified
      });

      await job.updateProgress(90);
      await prisma.restore.update({
        where: { id: restoreId },
        data: { progress: 90 },
      });

      const duration = Math.round((Date.now() - startTime) / 1000);

      // Update restore record with success
      await prisma.restore.update({
        where: { id: restoreId },
        data: {
          status: RestoreStatus.COMPLETED,
          completedAt: new Date(),
          duration,
          progress: 100,
        },
      });

      logger.info({ restoreId, duration }, 'Restore completed successfully');

      // Send success notification
      await sendRestoreNotification(restoreId, true);

      return { success: true };
    } catch (error) {
      logger.error({ restoreId, error }, 'Restore failed');

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update restore record with failure
      await prisma.restore.update({
        where: { id: restoreId },
        data: {
          status: RestoreStatus.FAILED,
          completedAt: new Date(),
          error: errorMessage,
        },
      });

      // Send failure notification
      await sendRestoreNotification(restoreId, false, errorMessage);

      throw error;
    }
  },
  {
    connection,
    concurrency: 2, // Process up to 2 restores concurrently
    limiter: {
      max: 5,
      duration: 60000, // Max 5 jobs per minute
    },
  }
);

restoreWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Restore worker completed job');
});

restoreWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Restore worker failed job');
});
