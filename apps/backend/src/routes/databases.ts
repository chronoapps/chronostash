import { Router, type IRouter } from 'express';
import { prisma } from '../services/prisma.js';
import { validate } from '../middleware/validate.js';
import { createDatabaseSchema, updateDatabaseSchema } from '@chronostash/shared';
import { PostgreSQLEngine, MySQLEngine, MongoDBEngine } from '@chronostash/database-engines';

const router: IRouter = Router();

// List all databases
router.get('/', async (_req, res, next) => {
  try {
    const databases = await prisma.database.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(databases);
  } catch (error) {
    return next(error);
  }
});

// Get single database
router.get('/:id', async (req, res, next) => {
  try {
    const database = await prisma.database.findUnique({
      where: { id: req.params.id },
      include: {
        backups: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        schedules: true,
      },
    });

    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }

    return res.json(database);
  } catch (error) {
    return next(error);
  }
});

// Create database
router.post('/', validate(createDatabaseSchema), async (req, res, next) => {
  try {
    const database = await prisma.database.create({
      data: req.body,
    });
    res.status(201).json(database);
  } catch (error) {
    return next(error);
  }
});

// Update database
router.put('/:id', validate(updateDatabaseSchema), async (req, res, next) => {
  try {
    const database = await prisma.database.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json(database);
  } catch (error) {
    return next(error);
  }
});

// Delete database
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.database.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

// Test database connection without saving
router.post('/test-connection', async (req, res, next) => {
  try {
    const { engine, host, port, username, password, database, sslMode } = req.body;

    if (!engine || !host || !port || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let connected = false;
    let error: string | undefined;

    try {
      const config = { host, port, username, password, database, sslMode };

      if (engine === 'POSTGRESQL') {
        const dbEngine = new PostgreSQLEngine();
        connected = await dbEngine.testConnection(config);
      } else if (engine === 'MYSQL') {
        const dbEngine = new MySQLEngine();
        connected = await dbEngine.testConnection(config);
      } else if (engine === 'MONGODB') {
        const dbEngine = new MongoDBEngine();
        connected = await dbEngine.testConnection(config);
      } else {
        error = `Engine ${engine} not supported`;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    return res.json({ connected, error });
  } catch (error) {
    return next(error);
  }
});

// Test database connection
router.post('/:id/test', async (req, res, next) => {
  try {
    const database = await prisma.database.findUnique({
      where: { id: req.params.id },
    });

    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }

    let connected = false;
    let error: string | undefined;

    try {
      const config = {
        host: database.host,
        port: database.port,
        username: database.username,
        password: database.password,
        database: database.database || undefined,
        sslMode: database.sslMode || undefined,
      };

      if (database.engine === 'POSTGRESQL') {
        const engine = new PostgreSQLEngine();
        connected = await engine.testConnection(config);
      } else if (database.engine === 'MYSQL') {
        const engine = new MySQLEngine();
        connected = await engine.testConnection(config);
      } else if (database.engine === 'MONGODB') {
        const engine = new MongoDBEngine();
        connected = await engine.testConnection(config);
      } else {
        error = `Engine ${database.engine} not supported`;
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
