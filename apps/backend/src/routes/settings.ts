import { Router, type IRouter } from 'express';
import { PrismaClient } from '@prisma/client';
import { notificationService } from '../services/notification.js';

const router: IRouter = Router();
const prisma = new PrismaClient();

// Get all settings
router.get('/', async (req, res, next) => {
  try {
    const settings = await prisma.settings.findMany();

    const settingsMap: Record<string, any> = {};
    settings.forEach(setting => {
      try {
        settingsMap[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsMap[setting.key] = setting.value;
      }
    });

    res.json({
      profile: settingsMap.profile || {
        name: 'Admin User',
        email: 'admin@chronostash.github.io',
        organization: 'ChronoStash Organization',
      },
      notifications: {
        slack: settingsMap.slack || {
          enabled: false,
          webhookUrl: '',
          channel: '#backups',
          username: 'ChronoStash Bot',
          notifyOnSuccess: true,
          notifyOnFailure: true,
        },
        telegram: settingsMap.telegram || {
          enabled: false,
          botToken: '',
          chatId: '',
          notifyOnSuccess: true,
          notifyOnFailure: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/profile', async (req, res, next) => {
  try {
    const { name, email, organization } = req.body;

    if (!name || !email || !organization) {
      return res.status(400).json({ error: 'Name, email, and organization are required' });
    }

    const profileData = { name, email, organization };

    const setting = await prisma.settings.upsert({
      where: { key: 'profile' },
      create: {
        key: 'profile',
        value: JSON.stringify(profileData),
      },
      update: {
        value: JSON.stringify(profileData),
      },
    });

    res.json(JSON.parse(setting.value));
  } catch (error) {
    next(error);
  }
});

// Update password
router.put('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // TODO: Implement actual password verification and hashing
    // For now, just validate the new password meets requirements

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Get notification settings
router.get('/notifications', async (req, res, next) => {
  try {
    const slackSettings = await prisma.settings.findUnique({
      where: { key: 'slack' },
    });

    const telegramSettings = await prisma.settings.findUnique({
      where: { key: 'telegram' },
    });

    res.json({
      slack: slackSettings?.value ? JSON.parse(slackSettings.value) : {
        enabled: false,
        webhookUrl: '',
        channel: '#backups',
        username: 'ChronoStash Bot',
        notifyOnSuccess: true,
        notifyOnFailure: true,
      },
      telegram: telegramSettings?.value ? JSON.parse(telegramSettings.value) : {
        enabled: false,
        botToken: '',
        chatId: '',
        notifyOnSuccess: true,
        notifyOnFailure: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update Slack settings
router.put('/notifications/slack', async (req, res, next) => {
  try {
    const { enabled, webhookUrl, channel, username, notifyOnSuccess, notifyOnFailure } = req.body;

    if (enabled && !webhookUrl) {
      return res.status(400).json({ error: 'Webhook URL is required when Slack is enabled' });
    }

    const settings = {
      enabled: enabled || false,
      webhookUrl: webhookUrl || '',
      channel: channel || '#backups',
      username: username || 'ChronoStash Bot',
      notifyOnSuccess: notifyOnSuccess !== undefined ? notifyOnSuccess : true,
      notifyOnFailure: notifyOnFailure !== undefined ? notifyOnFailure : true,
    };

    const setting = await prisma.settings.upsert({
      where: { key: 'slack' },
      create: {
        key: 'slack',
        value: JSON.stringify(settings),
      },
      update: {
        value: JSON.stringify(settings),
      },
    });

    res.json(JSON.parse(setting.value));
  } catch (error) {
    next(error);
  }
});

// Update Telegram settings
router.put('/notifications/telegram', async (req, res, next) => {
  try {
    const { enabled, botToken, chatId, notifyOnSuccess, notifyOnFailure } = req.body;

    if (enabled && (!botToken || !chatId)) {
      return res.status(400).json({ error: 'Bot token and chat ID are required when Telegram is enabled' });
    }

    const settings = {
      enabled: enabled || false,
      botToken: botToken || '',
      chatId: chatId || '',
      notifyOnSuccess: notifyOnSuccess !== undefined ? notifyOnSuccess : true,
      notifyOnFailure: notifyOnFailure !== undefined ? notifyOnFailure : true,
    };

    const setting = await prisma.settings.upsert({
      where: { key: 'telegram' },
      create: {
        key: 'telegram',
        value: JSON.stringify(settings),
      },
      update: {
        value: JSON.stringify(settings),
      },
    });

    res.json(JSON.parse(setting.value));
  } catch (error) {
    next(error);
  }
});

// Test Slack notification
router.post('/notifications/slack/test', async (req, res, next) => {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'slack' },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Slack settings not found' });
    }

    const slackSettings = setting.value as any;

    if (!slackSettings.enabled) {
      return res.status(400).json({ error: 'Slack notifications are not enabled' });
    }

    await notificationService.sendTestSlackMessage(slackSettings);

    res.json({ message: 'Test message sent successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send test message' });
  }
});

// Test Telegram notification
router.post('/notifications/telegram/test', async (req, res, next) => {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'telegram' },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Telegram settings not found' });
    }

    const telegramSettings = setting.value as any;

    if (!telegramSettings.enabled) {
      return res.status(400).json({ error: 'Telegram notifications are not enabled' });
    }

    await notificationService.sendTestTelegramMessage(telegramSettings);

    res.json({ message: 'Test message sent successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send test message' });
  }
});

// Export all settings
router.get('/export', async (req, res, next) => {
  try {
    const [databases, storageTargets, schedules, settings] = await Promise.all([
      prisma.database.findMany(),
      prisma.storageTarget.findMany(),
      prisma.schedule.findMany({
        include: {
          database: true,
          storage: true,
        },
      }),
      prisma.settings.findMany(),
    ]);

    const settingsMap: Record<string, any> = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      databases,
      storageTargets,
      schedules,
      settings: {
        profile: settingsMap.profile || null,
        notifications: {
          slack: settingsMap.slack || null,
          telegram: settingsMap.telegram || null,
        },
      },
    };

    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

// Import settings
router.post('/import', async (req, res, next) => {
  try {
    const { databases, storageTargets, schedules, settings } = req.body;

    if (!databases || !storageTargets) {
      return res.status(400).json({ error: 'Invalid import data format' });
    }

    const results = {
      databases: 0,
      storageTargets: 0,
      schedules: 0,
      settings: 0,
    };

    // Import databases
    for (const db of databases) {
      try {
        await prisma.database.create({
          data: {
            name: db.name,
            engine: db.engine,
            host: db.host,
            port: db.port,
            username: db.username,
            password: db.password,
            database: db.database,
            sslMode: db.sslMode,
          },
        });
        results.databases++;
      } catch (error) {
        // Skip if already exists
        console.warn(`Database ${db.name} already exists, skipping`);
      }
    }

    // Import storage targets
    for (const storage of storageTargets) {
      try {
        await prisma.storageTarget.create({
          data: {
            name: storage.name,
            type: storage.type,
            config: storage.config,
            encryptionKey: storage.encryptionKey,
          },
        });
        results.storageTargets++;
      } catch (error) {
        console.warn(`Storage target ${storage.name} already exists, skipping`);
      }
    }

    // Import schedules
    if (schedules) {
      for (const schedule of schedules) {
        try {
          // Find matching database and storage by name
          const db = await prisma.database.findUnique({
            where: { name: schedule.database.name },
          });
          const storage = await prisma.storageTarget.findUnique({
            where: { name: schedule.storage.name },
          });

          if (db && storage) {
            await prisma.schedule.create({
              data: {
                name: schedule.name,
                enabled: schedule.enabled,
                databaseId: db.id,
                storageId: storage.id,
                cronExpression: schedule.cronExpression,
                timezone: schedule.timezone,
                retentionDays: schedule.retentionDays,
                retentionCount: schedule.retentionCount,
              },
            });
            results.schedules++;
          }
        } catch (error) {
          console.warn(`Schedule ${schedule.name} failed to import, skipping`);
        }
      }
    }

    // Import settings
    if (settings) {
      if (settings.profile) {
        await prisma.settings.upsert({
          where: { key: 'profile' },
          create: { key: 'profile', value: settings.profile },
          update: { value: settings.profile },
        });
        results.settings++;
      }

      if (settings.notifications?.slack) {
        await prisma.settings.upsert({
          where: { key: 'slack' },
          create: { key: 'slack', value: settings.notifications.slack },
          update: { value: settings.notifications.slack },
        });
        results.settings++;
      }

      if (settings.notifications?.telegram) {
        await prisma.settings.upsert({
          where: { key: 'telegram' },
          create: { key: 'telegram', value: settings.notifications.telegram },
          update: { value: settings.notifications.telegram },
        });
        results.settings++;
      }
    }

    res.json({
      message: 'Import completed',
      results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
