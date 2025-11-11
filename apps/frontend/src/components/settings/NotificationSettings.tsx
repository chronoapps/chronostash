import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, TestTube, MessageSquare, Send } from 'lucide-react';
import {
  getNotificationSettings,
  updateSlackSettings,
  updateTelegramSettings,
  testSlackNotification,
  testTelegramNotification,
  type SlackSettings,
  type TelegramSettings
} from '@/lib/api';

export default function NotificationSettings() {
  const queryClient = useQueryClient();

  const { data: notificationSettings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: getNotificationSettings,
  });

  const [slackSettings, setSlackSettings] = useState<SlackSettings>({
    enabled: notificationSettings?.slack?.enabled || false,
    webhookUrl: notificationSettings?.slack?.webhookUrl || '',
    channel: notificationSettings?.slack?.channel || '#backups',
    username: notificationSettings?.slack?.username || 'ChronoStash Bot',
    notifyOnSuccess: notificationSettings?.slack?.notifyOnSuccess !== undefined ? notificationSettings.slack.notifyOnSuccess : true,
    notifyOnFailure: notificationSettings?.slack?.notifyOnFailure !== undefined ? notificationSettings.slack.notifyOnFailure : true,
  });

  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
    enabled: notificationSettings?.telegram?.enabled || false,
    botToken: notificationSettings?.telegram?.botToken || '',
    chatId: notificationSettings?.telegram?.chatId || '',
    notifyOnSuccess: notificationSettings?.telegram?.notifyOnSuccess !== undefined ? notificationSettings.telegram.notifyOnSuccess : true,
    notifyOnFailure: notificationSettings?.telegram?.notifyOnFailure !== undefined ? notificationSettings.telegram.notifyOnFailure : true,
  });

  const saveSlackMutation = useMutation({
    mutationFn: updateSlackSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Slack settings saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save Slack settings: ${error.message}`);
    },
  });

  const saveTelegramMutation = useMutation({
    mutationFn: updateTelegramSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Telegram settings saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save Telegram settings: ${error.message}`);
    },
  });

  const testSlackMutation = useMutation({
    mutationFn: testSlackNotification,
    onSuccess: () => {
      toast.success('Test message sent to Slack! Check your channel.');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send test message: ${error.message}`);
    },
  });

  const testTelegramMutation = useMutation({
    mutationFn: testTelegramNotification,
    onSuccess: () => {
      toast.success('Test message sent to Telegram! Check your chat.');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send test message: ${error.message}`);
    },
  });

  const handleSlackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSlackMutation.mutate(slackSettings);
  };

  const handleTelegramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveTelegramMutation.mutate(telegramSettings);
  };

  return (
    <div className="space-y-8">
      {/* Slack Settings */}
      <div>
        <div className="flex items-center mb-4">
          <MessageSquare className="h-6 w-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Slack Notifications</h3>
        </div>

        <form onSubmit={handleSlackSubmit} className="space-y-4 max-w-2xl">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="slack-enabled"
              checked={slackSettings.enabled}
              onChange={(e) =>
                setSlackSettings({ ...slackSettings, enabled: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="slack-enabled" className="ml-2 text-sm text-gray-700">
              Enable Slack notifications
            </label>
          </div>

          {slackSettings.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL *
                </label>
                <input
                  type="url"
                  value={slackSettings.webhookUrl}
                  onChange={(e) =>
                    setSlackSettings({ ...slackSettings, webhookUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://hooks.slack.com/services/..."
                  required={slackSettings.enabled}
                />
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                  Get your webhook URL from{' '}
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Slack API
                  </a>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel
                  </label>
                  <input
                    type="text"
                    value={slackSettings.channel}
                    onChange={(e) =>
                      setSlackSettings({ ...slackSettings, channel: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#backups"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={slackSettings.username}
                    onChange={(e) =>
                      setSlackSettings({ ...slackSettings, username: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ChronoStash Bot"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notify When:
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="slack-success"
                    checked={slackSettings.notifyOnSuccess}
                    onChange={(e) =>
                      setSlackSettings({ ...slackSettings, notifyOnSuccess: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="slack-success" className="ml-2 text-sm text-gray-700">
                    Backup/Restore succeeds
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="slack-failure"
                    checked={slackSettings.notifyOnFailure}
                    onChange={(e) =>
                      setSlackSettings({ ...slackSettings, notifyOnFailure: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="slack-failure" className="ml-2 text-sm text-gray-700">
                    Backup/Restore fails
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={saveSlackMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveSlackMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>

            {slackSettings.enabled && slackSettings.webhookUrl && (
              <button
                type="button"
                onClick={() => testSlackMutation.mutate()}
                disabled={testSlackMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testSlackMutation.isPending ? 'Sending...' : 'Send Test Message'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Telegram Settings */}
      <div className="pt-8 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center mb-4">
          <Send className="h-6 w-6 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Telegram Notifications</h3>
        </div>

        <form onSubmit={handleTelegramSubmit} className="space-y-4 max-w-2xl">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="telegram-enabled"
              checked={telegramSettings.enabled}
              onChange={(e) =>
                setTelegramSettings({ ...telegramSettings, enabled: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="telegram-enabled" className="ml-2 text-sm text-gray-700">
              Enable Telegram notifications
            </label>
          </div>

          {telegramSettings.enabled && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Message @BotFather on Telegram to create a bot</li>
                  <li>Copy the bot token and paste below</li>
                  <li>Start a chat with your bot</li>
                  <li>Get your chat ID from @userinfobot</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bot Token *
                </label>
                <input
                  type="password"
                  value={telegramSettings.botToken}
                  onChange={(e) =>
                    setTelegramSettings({ ...telegramSettings, botToken: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  required={telegramSettings.enabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chat ID *</label>
                <input
                  type="text"
                  value={telegramSettings.chatId}
                  onChange={(e) =>
                    setTelegramSettings({ ...telegramSettings, chatId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123456789"
                  required={telegramSettings.enabled}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notify When:
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="telegram-success"
                    checked={telegramSettings.notifyOnSuccess}
                    onChange={(e) =>
                      setTelegramSettings({
                        ...telegramSettings,
                        notifyOnSuccess: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="telegram-success" className="ml-2 text-sm text-gray-700">
                    Backup/Restore succeeds
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="telegram-failure"
                    checked={telegramSettings.notifyOnFailure}
                    onChange={(e) =>
                      setTelegramSettings({
                        ...telegramSettings,
                        notifyOnFailure: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="telegram-failure" className="ml-2 text-sm text-gray-700">
                    Backup/Restore fails
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={saveTelegramMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveTelegramMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>

            {telegramSettings.enabled && telegramSettings.botToken && telegramSettings.chatId && (
              <button
                type="button"
                onClick={() => testTelegramMutation.mutate()}
                disabled={testTelegramMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testTelegramMutation.isPending ? 'Sending...' : 'Send Test Message'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
