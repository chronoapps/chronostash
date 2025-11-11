import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { pino } from 'pino';
import { prisma, connectDatabase, disconnectDatabase } from './services/prisma.js';
import { closeQueues } from './services/queue.js';
import { backupWorker } from './jobs/backup-job.js';
import { restoreWorker } from './jobs/restore-job.js';
import { startScheduleChecker } from './jobs/schedule-checker.js';
import { startCleanupJob } from './jobs/cleanup-job.js';

config();

const logger = process.env.NODE_ENV === 'development'
  ? pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    })
  : pino({
      level: process.env.LOG_LEVEL || 'info',
    });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
import authRoutes from './routes/auth.js';
import databaseRoutes from './routes/databases.js';
import storageTargetRoutes from './routes/storage-targets.js';
import backupRoutes from './routes/backups.js';
import restoreRoutes from './routes/restores.js';
import scheduleRoutes from './routes/schedules.js';
import settingsRoutes from './routes/settings.js';
import { authenticateToken } from './middleware/auth.js';

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/databases', authenticateToken, databaseRoutes);
app.use('/api/storage-targets', authenticateToken, storageTargetRoutes);
app.use('/api/backups', authenticateToken, backupRoutes);
app.use('/api/restores', authenticateToken, restoreRoutes);
app.use('/api/schedules', authenticateToken, scheduleRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);

// Health check with database status
app.get('/health', async (_req, res) => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'error';
  }

  const status = dbStatus === 'ok' ? 200 : 503;
  res.status(status).json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: 'ok', // TODO: Check Redis
    },
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, req: { method: req.method, url: req.url } }, 'Request error');
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Store cleanup functions
let stopScheduleChecker: (() => void) | undefined;
let stopCleanupJob: (() => void) | undefined;

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  stopScheduleChecker?.();
  stopCleanupJob?.();
  await backupWorker.close();
  await restoreWorker.close();
  await closeQueues();
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  stopScheduleChecker?.();
  stopCleanupJob?.();
  await backupWorker.close();
  await restoreWorker.close();
  await closeQueues();
  await disconnectDatabase();
  process.exit(0);
});

async function start() {
  await connectDatabase();

  // Start background jobs
  stopScheduleChecker = startScheduleChecker();
  stopCleanupJob = startCleanupJob();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

start().catch((error) => {
  logger.error({ error }, 'Failed to start server');
  process.exit(1);
});
