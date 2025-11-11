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

export class NotificationService {
  async sendSlackNotification(settings: SlackSettings, message: string, isSuccess: boolean = true): Promise<void> {
    if (!settings.enabled) {
      throw new Error('Slack notifications are not enabled');
    }

    if (!settings.webhookUrl) {
      throw new Error('Slack webhook URL is not configured');
    }

    const color = isSuccess ? '#10b981' : '#ef4444';
    const emoji = isSuccess ? '✅' : '❌';

    const payload = {
      channel: settings.channel,
      username: settings.username,
      attachments: [
        {
          color,
          text: `${emoji} ${message}`,
          footer: 'ChronoStash',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const response = await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }
  }

  async sendTelegramNotification(settings: TelegramSettings, message: string, isSuccess: boolean = true): Promise<void> {
    if (!settings.enabled) {
      throw new Error('Telegram notifications are not enabled');
    }

    if (!settings.botToken || !settings.chatId) {
      throw new Error('Telegram bot token and chat ID are required');
    }

    const emoji = isSuccess ? '✅' : '❌';
    const text = `${emoji} *ChronoStash Notification*\n\n${message}`;

    const url = `https://api.telegram.org/bot${settings.botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: settings.chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const error = await response.json() as { description?: string };
      throw new Error(`Telegram API error: ${error.description || response.statusText}`);
    }
  }

  async sendTestSlackMessage(settings: SlackSettings): Promise<void> {
    await this.sendSlackNotification(
      settings,
      'This is a test message from ChronoStash. If you can see this, your Slack integration is working correctly!',
      true
    );
  }

  async sendTestTelegramMessage(settings: TelegramSettings): Promise<void> {
    await this.sendTelegramNotification(
      settings,
      'This is a test message from ChronoStash. If you can see this, your Telegram integration is working correctly!',
      true
    );
  }
}

export const notificationService = new NotificationService();
