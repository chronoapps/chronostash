import { Router, type IRouter } from 'express';
import { prisma } from '../services/prisma.js';
import { validate } from '../middleware/validate.js';
import { createScheduleSchema, updateScheduleSchema } from '@chronostash/shared';
import parser from 'cron-parser';

const router: IRouter = Router();

// Helper to serialize BigInt fields in backups
function serializeBackup(backup: any) {
  return {
    ...backup,
    size: backup.size ? backup.size.toString() : null,
  };
}

// Helper to serialize schedules with nested backups
function serializeSchedule(schedule: any) {
  return {
    ...schedule,
    // Serialize nested backups array if present
    backups: schedule.backups ? schedule.backups.map(serializeBackup) : undefined,
  };
}

// List all schedules
router.get('/', async (req, res, next) => {
  try {
    const { databaseId, enabled } = req.query;

    const where: any = {};
    if (databaseId) where.databaseId = databaseId as string;
    if (enabled !== undefined) where.enabled = enabled === 'true';

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        database: { select: { name: true, engine: true } },
        storage: { select: { name: true, type: true } },
        backups: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(schedules.map(serializeSchedule));
  } catch (error) {
    return next(error);
  }
});

// Get single schedule
router.get('/:id', async (req, res, next) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id },
      include: {
        database: true,
        storage: true,
        backups: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    return res.json(serializeSchedule(schedule));
  } catch (error) {
    return next(error);
  }
});

// Create schedule
router.post('/', validate(createScheduleSchema), async (req, res, next) => {
  try {
    // Calculate next run time
    let nextRunAt: Date | undefined;
    try {
      const interval = parser.parseExpression(req.body.cronExpression, {
        tz: req.body.timezone || 'UTC',
      });
      nextRunAt = interval.next().toDate();
    } catch (err) {
      return res.status(400).json({ error: 'Invalid cron expression' });
    }

    const schedule = await prisma.schedule.create({
      data: {
        ...req.body,
        nextRunAt,
      },
    });

    res.status(201).json(schedule);
  } catch (error) {
    return next(error);
  }
});

// Update schedule
router.put('/:id', validate(updateScheduleSchema), async (req, res, next) => {
  try {
    const data: any = req.body;

    // Recalculate next run time if cron expression changed
    if (data.cronExpression) {
      try {
        const interval = parser.parseExpression(data.cronExpression, {
          tz: data.timezone || 'UTC',
        });
        data.nextRunAt = interval.next().toDate();
      } catch (err) {
        return res.status(400).json({ error: 'Invalid cron expression' });
      }
    }

    const schedule = await prisma.schedule.update({
      where: { id: req.params.id },
      data,
    });

    return res.json(schedule);
  } catch (error) {
    return next(error);
  }
});

// Delete schedule
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.schedule.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

// Toggle schedule enabled/disabled
router.post('/:id/toggle', async (req, res, next) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const updated = await prisma.schedule.update({
      where: { id: req.params.id },
      data: { enabled: !schedule.enabled },
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

// Trigger schedule manually (run now)
router.post('/:id/run', async (req, res, next) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Create backup with schedule reference
    const backup = await prisma.backup.create({
      data: {
        databaseId: schedule.databaseId,
        storageId: schedule.storageId,
        scheduleId: schedule.id,
      },
    });

    // Queue backup job
    const { backupQueue } = await import('../services/queue.js');
    await backupQueue.add('backup', { backupId: backup.id });

    return res.json(serializeBackup(backup));
  } catch (error) {
    return next(error);
  }
});

export default router;
