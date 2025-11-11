import { pino } from 'pino';
import { prisma } from '../services/prisma.js';
import { S3StorageAdapter } from '@chronostash/storage-adapters';

const logger = pino({ name: 'cleanup-job' });

/**
 * Clean up old backups based on schedule retention policies
 */
export async function cleanupOldBackups() {
  try {
    logger.info('Starting backup cleanup');

    // Get all schedules with retention policies
    const schedules = await prisma.schedule.findMany({
      where: {
        OR: [
          { retentionDays: { not: null } },
          { retentionCount: { not: null } },
        ],
      },
      include: {
        backups: {
          orderBy: { createdAt: 'desc' },
        },
        storage: true,
      },
    });

    let totalDeleted = 0;

    for (const schedule of schedules) {
      try {
        const backupsToDelete: string[] = [];

        // Retention by count
        if (schedule.retentionCount && schedule.backups.length > schedule.retentionCount) {
          const toDelete = schedule.backups
            .slice(schedule.retentionCount)
            .map(b => b.id);
          backupsToDelete.push(...toDelete);
        }

        // Retention by days
        if (schedule.retentionDays) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - schedule.retentionDays);

          const toDelete = schedule.backups
            .filter(b => b.createdAt < cutoffDate && !backupsToDelete.includes(b.id))
            .map(b => b.id);
          backupsToDelete.push(...toDelete);
        }

        if (backupsToDelete.length === 0) continue;

        logger.info({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          toDelete: backupsToDelete.length,
        }, 'Deleting old backups');

        // Delete from storage and database
        for (const backupId of backupsToDelete) {
          const backup = schedule.backups.find(b => b.id === backupId);
          if (!backup || !backup.storagePath) continue;

          try {
            // Delete from storage
            const storageConfig = schedule.storage.config as any;
            const adapter = new S3StorageAdapter({
              bucket: storageConfig.bucket,
              region: storageConfig.region,
              endpoint: storageConfig.endpoint,
              accountId: storageConfig.accountId,
              accessKeyId: storageConfig.accessKeyId,
              secretAccessKey: storageConfig.secretAccessKey,
            });

            await adapter.delete(backup.storagePath);

            // Delete from database
            await prisma.backup.delete({
              where: { id: backupId },
            });

            totalDeleted++;
          } catch (error) {
            logger.error({
              backupId,
              error,
            }, 'Failed to delete backup');
          }
        }
      } catch (error) {
        logger.error({
          scheduleId: schedule.id,
          error,
        }, 'Failed to process schedule cleanup');
      }
    }

    logger.info({ totalDeleted }, 'Backup cleanup completed');
  } catch (error) {
    logger.error({ error }, 'Cleanup job failed');
  }
}

/**
 * Start cleanup job interval
 * Runs every hour
 */
export function startCleanupJob() {
  logger.info('Starting cleanup job (runs every hour)');

  // Run after 5 minutes
  setTimeout(() => {
    cleanupOldBackups();
  }, 5 * 60 * 1000);

  // Run every hour
  const interval = setInterval(() => {
    cleanupOldBackups();
  }, 60 * 60 * 1000);

  return () => {
    clearInterval(interval);
    logger.info('Cleanup job stopped');
  };
}
