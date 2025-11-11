import { Router, type IRouter } from 'express';
import { prisma } from '../services/prisma.js';
import { validate } from '../middleware/validate.js';
import { createStorageTargetSchema, updateStorageTargetSchema } from '@chronostash/shared';
import { S3StorageAdapter, GoogleDriveStorageAdapter } from '@chronostash/storage-adapters';

const router: IRouter = Router();

// List all storage targets
router.get('/', async (_req, res, next) => {
  try {
    const targets = await prisma.storageTarget.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(targets);
  } catch (error) {
    return next(error);
  }
});

// Get single storage target
router.get('/:id', async (req, res, next) => {
  try {
    const target = await prisma.storageTarget.findUnique({
      where: { id: req.params.id },
      include: {
        backups: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        schedules: true,
      },
    });

    if (!target) {
      return res.status(404).json({ error: 'Storage target not found' });
    }

    return res.json(target);
  } catch (error) {
    return next(error);
  }
});

// Create storage target
router.post('/', validate(createStorageTargetSchema), async (req, res, next) => {
  try {
    const target = await prisma.storageTarget.create({
      data: req.body,
    });
    res.status(201).json(target);
  } catch (error) {
    return next(error);
  }
});

// Update storage target
router.put('/:id', validate(updateStorageTargetSchema), async (req, res, next) => {
  try {
    const target = await prisma.storageTarget.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json(target);
  } catch (error) {
    return next(error);
  }
});

// Delete storage target
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.storageTarget.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

// Test storage connection
router.post('/:id/test', async (req, res, next) => {
  try {
    const target = await prisma.storageTarget.findUnique({
      where: { id: req.params.id },
    });

    if (!target) {
      return res.status(404).json({ error: 'Storage target not found' });
    }

    let connected = false;
    let error: string | undefined;

    try {
      const config = target.config as any;

      if (target.type === 'S3' || target.type === 'CLOUDFLARE_R2') {
        const adapter = new S3StorageAdapter({
          bucket: config.bucket,
          region: config.region,
          endpoint: config.endpoint,
          accountId: config.accountId,
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        });
        connected = await adapter.test();
      } else if (target.type === 'GOOGLE_DRIVE') {
        const adapter = new GoogleDriveStorageAdapter({
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          refreshToken: config.refreshToken,
          folderId: config.folderId,
        });
        connected = await adapter.test();
      } else {
        error = `Storage type ${target.type} not supported`;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    return res.json({ connected, error });
  } catch (error) {
    return next(error);
  }
});

export default router;
