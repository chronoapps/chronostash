import { Router, type IRouter } from 'express';
import { prisma } from '../services/prisma.js';
import { validate } from '../middleware/validate.js';
import { createBackupSchema, DatabaseEngine } from '@chronostash/shared';
import { backupQueue } from '../services/queue.js';
import { S3StorageAdapter } from '@chronostash/storage-adapters';

const router: IRouter = Router();

// Helper to convert BigInt to string for JSON serialization
function serializeBackup(backup: any) {
  return {
    ...backup,
    size: backup.size ? backup.size.toString() : null,
  };
}

// List all backups
router.get('/', async (req, res, next) => {
  try {
    const { databaseId, status, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (databaseId) where.databaseId = databaseId as string;
    if (status) where.status = status as string;

    const backups = await prisma.backup.findMany({
      where,
      include: {
        database: { select: { name: true, engine: true } },
        storage: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.backup.count({ where });

    return res.json({
      backups: backups.map(serializeBackup),
      total
    });
  } catch (error) {
    return next(error);
  }
});

// Get single backup
router.get('/:id', async (req, res, next) => {
  try {
    const backup = await prisma.backup.findUnique({
      where: { id: req.params.id },
      include: {
        database: true,
        storage: true,
        restores: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    return res.json(serializeBackup(backup));
  } catch (error) {
    return next(error);
  }
});

// Create backup (triggers backup job)
router.post('/', validate(createBackupSchema), async (req, res, next) => {
  try {
    const backup = await prisma.backup.create({
      data: req.body,
    });

    // Queue backup job
    await backupQueue.add('backup', { backupId: backup.id });

    res.status(201).json(serializeBackup(backup));
  } catch (error) {
    return next(error);
  }
});

// Delete backup
router.delete('/:id', async (req, res, next) => {
  try {
    // TODO: Delete from storage backend before deleting record
    await prisma.backup.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

// Cancel backup (if in progress)
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const backup = await prisma.backup.findUnique({
      where: { id: req.params.id },
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    if (backup.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Backup is not in progress' });
    }

    // Update status to cancelled
    const updated = await prisma.backup.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    return res.json(serializeBackup(updated));
  } catch (error) {
    return next(error);
  }
});

// Download backup file
router.get('/:id/download', async (req, res, next) => {
  try {
    const backup = await prisma.backup.findUnique({
      where: { id: req.params.id },
      include: {
        storage: true,
        database: true,
      },
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    if (backup.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Backup is not completed yet' });
    }

    if (!backup.storagePath) {
      return res.status(400).json({ error: 'Backup storage path not found' });
    }

    // Get storage configuration
    const storageConfig = backup.storage.config as any;

    // Only S3/R2 supported for now
    if (backup.storage.type !== 'S3' && backup.storage.type !== 'CLOUDFLARE_R2') {
      return res.status(400).json({ error: 'Download only supported for S3/R2 storage' });
    }

    // Create storage adapter
    const storage = new S3StorageAdapter({
      bucket: storageConfig.bucket,
      region: storageConfig.region,
      endpoint: storageConfig.endpoint,
      accountId: storageConfig.accountId,
      accessKeyId: storageConfig.accessKeyId,
      secretAccessKey: storageConfig.secretAccessKey,
    });

    // Download from storage
    const stream = await storage.download(backup.storagePath);

    // Extract file extension from storage path
    const pathParts = backup.storagePath.split('.');
    const extension = pathParts[pathParts.length - 1];
    const isArchiveGz = backup.storagePath.endsWith('.archive.gz');
    const actualExtension = isArchiveGz ? 'archive.gz' : extension;

    // Determine content type based on file extension
    let contentType: string;
    switch (backup.database.engine) {
      case DatabaseEngine.POSTGRESQL:
        contentType = 'application/octet-stream'; // PostgreSQL custom format
        break;
      case DatabaseEngine.MYSQL:
        contentType = 'application/sql'; // MySQL SQL
        break;
      case DatabaseEngine.MONGODB:
        contentType = 'application/gzip'; // MongoDB gzipped archive
        break;
      default:
        contentType = 'application/octet-stream';
    }

    // Generate filename with proper extension
    const date = new Date(backup.createdAt).toISOString().split('T')[0];
    const filename = `backup-${backup.database.name}-${backup.id.slice(0, 8)}-${date}.${actualExtension}`;

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (backup.size) {
      res.setHeader('Content-Length', backup.size.toString());
    }

    // Pipe the stream to response
    stream.pipe(res);

    // Handle stream errors
    stream.on('error', (error) => {
      console.error('Download stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download backup' });
      }
    });

  } catch (error) {
    return next(error);
  }
});

export default router;
