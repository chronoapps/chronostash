import { prisma } from './prisma.js';
import { notificationService } from './notification.js';
import { pino } from 'pino';

const logger = pino({ name: 'notification-helper' });

interface SlackSettings {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
  username: string;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

interface TelegramSettings {
  enabled: boolean;
  botToken: string;
  chatId: string;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

export async function sendBackupNotification(
  backupId: string,
  isSuccess: boolean,
  error?: string
): Promise<void> {
  try {
    // Fetch notification settings
    const [slackSetting, telegramSetting] = await Promise.all([
      prisma.settings.findUnique({ where: { key: 'slack' } }),
      prisma.settings.findUnique({ where: { key: 'telegram' } }),
    ]);

    // Fetch backup details
    const backup = await prisma.backup.findUnique({
      where: { id: backupId },
      include: {
        database: true,
      },
    });

    if (!backup) {
      logger.warn({ backupId }, 'Backup not found for notification');
      return;
    }

    // Format message
    let message: string;
    if (isSuccess) {
      const sizeMB = backup.size ? (Number(backup.size) / 1024 / 1024).toFixed(2) : 'unknown';
      const duration = backup.duration || 0;
      message = `Backup completed successfully!\n\nDatabase: ${backup.database.name}\nEngine: ${backup.database.engine}\nSize: ${sizeMB} MB\nDuration: ${duration}s`;
    } else {
      message = `Backup failed!\n\nDatabase: ${backup.database.name}\nEngine: ${backup.database.engine}\nError: ${error || 'Unknown error'}`;
    }

    // Send Slack notification
    if (slackSetting?.value) {
      const slackSettings = slackSetting.value as unknown as SlackSettings;
      if (
        slackSettings.enabled &&
        ((isSuccess && slackSettings.notifyOnSuccess) || (!isSuccess && slackSettings.notifyOnFailure))
      ) {
        try {
          await notificationService.sendSlackNotification(slackSettings, message, isSuccess);
          logger.info({ backupId, isSuccess }, 'Slack notification sent');
        } catch (error) {
          logger.error({ backupId, error }, 'Failed to send Slack notification');
        }
      }
    }

    // Send Telegram notification
    if (telegramSetting?.value) {
      const telegramSettings = telegramSetting.value as unknown as TelegramSettings;
      if (
        telegramSettings.enabled &&
        ((isSuccess && telegramSettings.notifyOnSuccess) || (!isSuccess && telegramSettings.notifyOnFailure))
      ) {
        try {
          await notificationService.sendTelegramNotification(telegramSettings, message, isSuccess);
          logger.info({ backupId, isSuccess }, 'Telegram notification sent');
        } catch (error) {
          logger.error({ backupId, error }, 'Failed to send Telegram notification');
        }
      }
    }
  } catch (error) {
    logger.error({ backupId, error }, 'Failed to send notifications');
  }
}

export async function sendRestoreNotification(
  restoreId: string,
  isSuccess: boolean,
  error?: string
): Promise<void> {
  try {
    // Fetch notification settings
    const [slackSetting, telegramSetting] = await Promise.all([
      prisma.settings.findUnique({ where: { key: 'slack' } }),
      prisma.settings.findUnique({ where: { key: 'telegram' } }),
    ]);

    // Fetch restore details
    const restore = await prisma.restore.findUnique({
      where: { id: restoreId },
      include: {
        backup: {
          include: {
            database: true,
          },
        },
      },
    });

    if (!restore) {
      logger.warn({ restoreId }, 'Restore not found for notification');
      return;
    }

    // Format message
    let message: string;
    if (isSuccess) {
      const duration = restore.duration || 0;
      const targetInfo = restore.targetHost
        ? `\nTarget: ${restore.targetHost}:${restore.targetPort}/${restore.targetDb || restore.backup.database.database}`
        : '\nTarget: Original database';
      message = `Restore completed successfully!\n\nDatabase: ${restore.backup.database.name}\nEngine: ${restore.backup.database.engine}${targetInfo}\nDuration: ${duration}s`;
    } else {
      message = `Restore failed!\n\nDatabase: ${restore.backup.database.name}\nEngine: ${restore.backup.database.engine}\nError: ${error || 'Unknown error'}`;
    }

    // Send Slack notification
    if (slackSetting?.value) {
      const slackSettings = slackSetting.value as unknown as SlackSettings;
      if (
        slackSettings.enabled &&
        ((isSuccess && slackSettings.notifyOnSuccess) || (!isSuccess && slackSettings.notifyOnFailure))
      ) {
        try {
          await notificationService.sendSlackNotification(slackSettings, message, isSuccess);
          logger.info({ restoreId, isSuccess }, 'Slack notification sent');
        } catch (error) {
          logger.error({ restoreId, error }, 'Failed to send Slack notification');
        }
      }
    }

    // Send Telegram notification
    if (telegramSetting?.value) {
      const telegramSettings = telegramSetting.value as unknown as TelegramSettings;
      if (
        telegramSettings.enabled &&
        ((isSuccess && telegramSettings.notifyOnSuccess) || (!isSuccess && telegramSettings.notifyOnFailure))
      ) {
        try {
          await notificationService.sendTelegramNotification(telegramSettings, message, isSuccess);
          logger.info({ restoreId, isSuccess }, 'Telegram notification sent');
        } catch (error) {
          logger.error({ restoreId, error }, 'Failed to send Telegram notification');
        }
      }
    }
  } catch (error) {
    logger.error({ restoreId, error }, 'Failed to send notifications');
  }
}
