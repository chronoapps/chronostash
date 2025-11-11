import { pino } from 'pino';
import { prisma } from '../services/prisma.js';
import { backupQueue } from '../services/queue.js';
import parser from 'cron-parser';

const logger = pino({ name: 'schedule-checker' });

/**
 * Check for schedules that need to run and create backup jobs
 */
export async function checkSchedules() {
  try {
    const now = new Date();

    // Find all enabled schedules where nextRunAt <= now
    const dueSchedules = await prisma.schedule.findMany({
      where: {
        enabled: true,
        nextRunAt: {
          lte: now,
        },
      },
      include: {
        database: true,
        storage: true,
      },
    });

    logger.info({ count: dueSchedules.length }, 'Found due schedules');

    for (const schedule of dueSchedules) {
      try {
        // Create backup job
        const backup = await prisma.backup.create({
          data: {
            databaseId: schedule.databaseId,
            storageId: schedule.storageId,
            scheduleId: schedule.id,
          },
        });

        // Queue backup
        await backupQueue.add('backup', { backupId: backup.id });

        // Calculate next run time
        const interval = parser.parseExpression(schedule.cronExpression, {
          currentDate: now,
          tz: schedule.timezone,
        });
        const nextRunAt = interval.next().toDate();

        // Update schedule
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            nextRunAt,
          },
        });

        logger.info({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          backupId: backup.id,
          nextRunAt,
        }, 'Scheduled backup created');
      } catch (error) {
        logger.error({
          scheduleId: schedule.id,
          error,
        }, 'Failed to process schedule');
      }
    }
  } catch (error) {
    logger.error({ error }, 'Schedule checker failed');
  }
}

/**
 * Start schedule checker interval
 * Runs every minute
 */
export function startScheduleChecker() {
  logger.info('Starting schedule checker (runs every 60s)');

  // Run immediately
  checkSchedules();

  // Run every minute
  const interval = setInterval(() => {
    checkSchedules();
  }, 60 * 1000);

  return () => {
    clearInterval(interval);
    logger.info('Schedule checker stopped');
  };
}
