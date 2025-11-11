import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { pino } from 'pino';
import { prisma } from '../services/prisma.js';
import { PostgreSQLEngine } from '@chronostash/database-engines';
import { S3StorageAdapter, GoogleDriveStorageAdapter, StorageAdapter } from '@chronostash/storage-adapters';
import { BackupStatus, DatabaseEngine, StorageType } from '@chronostash/shared';
import { sendBackupNotification } from '../services/notification-helper.js';

const logger = pino({ name: 'backup-job' });

interface BackupJobData {
  backupId: string;
}

const Redis = (IORedis as any).default || IORedis;
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const backupWorker = new Worker<BackupJobData>(
  'backup-jobs',
  async (job: Job<BackupJobData>) => {
    const { backupId } = job.data;

    logger.info({ backupId }, 'Starting backup job');

    // Update status to IN_PROGRESS
    await prisma.backup.update({
      where: { id: backupId },
      data: {
        status: BackupStatus.IN_PROGRESS,
        startedAt: new Date(),
        progress: 0,
      },
    });

    try {
      // Fetch backup with relations
      const backup = await prisma.backup.findUnique({
        where: { id: backupId },
        include: {
          database: true,
          storage: true,
        },
      });

      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Initialize database engine
      let engine;
      if (backup.database.engine === DatabaseEngine.POSTGRESQL) {
        engine = new PostgreSQLEngine();
      } else {
        throw new Error(`Engine ${backup.database.engine} not yet implemented`);
      }

      // Execute backup
      const startTime = Date.now();
      const backupResult = await engine.backup({
        host: backup.database.host,
        port: backup.database.port,
        username: backup.database.username,
        password: backup.database.password,
        database: backup.database.database || undefined,
        sslMode: backup.database.sslMode || undefined,
      });

      await job.updateProgress(30);
      await prisma.backup.update({
        where: { id: backupId },
        data: { progress: 30 },
      });

      // Initialize storage adapter
      const storageConfig = backup.storage.config as any;
      let storage: StorageAdapter;

      if (backup.storage.type === StorageType.S3 || backup.storage.type === StorageType.CLOUDFLARE_R2) {
        storage = new S3StorageAdapter({
          bucket: storageConfig.bucket,
          region: storageConfig.region,
          endpoint: storageConfig.endpoint,
          accountId: storageConfig.accountId,
          accessKeyId: storageConfig.accessKeyId,
          secretAccessKey: storageConfig.secretAccessKey,
        });
      } else if (backup.storage.type === StorageType.GOOGLE_DRIVE) {
        storage = new GoogleDriveStorageAdapter({
          clientId: storageConfig.clientId,
          clientSecret: storageConfig.clientSecret,
          refreshToken: storageConfig.refreshToken,
          folderId: storageConfig.folderId,
        });
      } else {
        throw new Error(`Storage type ${backup.storage.type} not supported`);
      }

      // Determine file extension based on database engine
      let fileExtension: string;
      if (backup.database.engine === DatabaseEngine.POSTGRESQL) {
        fileExtension = 'pgdump';
      } else if (backup.database.engine === DatabaseEngine.MYSQL) {
        fileExtension = 'sql';
      } else if (backup.database.engine === DatabaseEngine.MONGODB) {
        fileExtension = 'archive.gz';
      } else {
        fileExtension = 'dump';
      }

      // Upload to storage
      const storagePath = `backups/${backup.databaseId}/${Date.now()}-${backupId}.${fileExtension}`;

      // Serialize metadata to Record<string, string>
      const metadata: Record<string, string> = {
        engine: backupResult.metadata.engine,
        version: backupResult.metadata.version,
        ...(backupResult.metadata.databases && {
          databases: JSON.stringify(backupResult.metadata.databases),
        }),
      };

      const uploadResult = await storage.upload({
        stream: backupResult.stream,
        path: storagePath,
        metadata,
        onProgress: (uploaded: number, total?: number) => {
          const progress = total ? Math.round((uploaded / total) * 100) : 0;
          job.updateProgress(30 + Math.round(progress * 0.6)); // 30-90%
        },
      });

      await job.updateProgress(90);
      await prisma.backup.update({
        where: { id: backupId },
        data: { progress: 90 },
      });

      const duration = Math.round((Date.now() - startTime) / 1000);

      // Update backup record with success
      await prisma.backup.update({
        where: { id: backupId },
        data: {
          status: BackupStatus.COMPLETED,
          completedAt: new Date(),
          duration,
          size: BigInt(uploadResult.size),
          storagePath,
          manifest: JSON.stringify({
            ...backupResult.metadata,
            etag: uploadResult.etag,
          }),
          progress: 100,
        },
      });

      logger.info({ backupId, duration, size: uploadResult.size }, 'Backup completed successfully');

      // Send success notification
      await sendBackupNotification(backupId, true);

      return { success: true };
    } catch (error) {
      logger.error({ backupId, error }, 'Backup failed');

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update backup record with failure
      await prisma.backup.update({
        where: { id: backupId },
        data: {
          status: BackupStatus.FAILED,
          completedAt: new Date(),
          error: errorMessage,
        },
      });

      // Send failure notification
      await sendBackupNotification(backupId, false, errorMessage);

      throw error;
    }
  },
  {
    connection,
    concurrency: 3, // Process up to 3 backups concurrently
    limiter: {
      max: 10,
      duration: 60000, // Max 10 jobs per minute
    },
  }
);

backupWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Backup worker completed job');
});

backupWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Backup worker failed job');
});
