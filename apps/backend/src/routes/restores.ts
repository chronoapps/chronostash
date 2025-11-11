import { Router, type IRouter } from 'express';
import { prisma } from '../services/prisma.js';
import { validate } from '../middleware/validate.js';
import { createRestoreSchema } from '@chronostash/shared';
import { restoreQueue } from '../services/queue.js';

const router: IRouter = Router();

// Helper function to serialize restore data (handles BigInt in backup.size)
function serializeRestore(restore: any) {
  if (!restore) return restore;

  return {
    ...restore,
    backup: restore.backup ? {
      ...restore.backup,
      size: restore.backup.size ? restore.backup.size.toString() : null,
    } : null,
  };
}

// List all restores
router.get('/', async (req, res, next) => {
  try {
    const { backupId, status, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (backupId) where.backupId = backupId as string;
    if (status) where.status = status as string;

    const restores = await prisma.restore.findMany({
      where,
      include: {
        backup: {
          include: {
            database: { select: { name: true, engine: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.restore.count({ where });

    return res.json({ restores: restores.map(serializeRestore), total });
  } catch (error) {
    return next(error);
  }
});

// Get single restore
router.get('/:id', async (req, res, next) => {
  try {
    const restore = await prisma.restore.findUnique({
      where: { id: req.params.id },
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
      return res.status(404).json({ error: 'Restore not found' });
    }

    return res.json(serializeRestore(restore));
  } catch (error) {
    return next(error);
  }
});

// Create restore (triggers restore job)
router.post('/', validate(createRestoreSchema), async (req, res, next) => {
  try {
    const restore = await prisma.restore.create({
      data: req.body,
    });

    // Queue restore job
    await restoreQueue.add('restore', { restoreId: restore.id });

    res.status(201).json(serializeRestore(restore));
  } catch (error) {
    return next(error);
  }
});

// Delete restore record
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.restore.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
