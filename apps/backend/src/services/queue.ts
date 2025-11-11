import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { pino } from 'pino';

const logger = pino({ name: 'queue' });

const Redis = (IORedis as any).default || IORedis;
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const backupQueue = new Queue('backup-jobs', { connection });
export const restoreQueue = new Queue('restore-jobs', { connection });

// Queue events for monitoring
const backupEvents = new QueueEvents('backup-jobs', { connection });

backupEvents.on('completed', ({ jobId }) => {
  logger.info({ jobId }, 'Backup job completed');
});

backupEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error({ jobId, failedReason }, 'Backup job failed');
});

export async function closeQueues() {
  await backupQueue.close();
  await restoreQueue.close();
  await connection.quit();
  logger.info('Queues closed');
}
