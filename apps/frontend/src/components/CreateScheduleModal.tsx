import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createSchedule, getDatabases, getStorageTargets } from '@/lib/api';
import { X, Info } from 'lucide-react';

interface CreateScheduleModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateScheduleModal({ open, onClose }: CreateScheduleModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    databaseId: '',
    storageId: '',
    cronExpression: '0 2 * * *',
    timezone: 'UTC',
    retentionDays: 30,
    retentionCount: undefined as number | undefined,
    enabled: true,
  });

  // Fetch databases and storage targets for dropdowns
  const { data: databases } = useQuery({
    queryKey: ['databases'],
    queryFn: getDatabases,
  });
  const { data: storageTargets } = useQuery({
    queryKey: ['storage-targets'],
    queryFn: getStorageTargets,
  });

  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule created successfully');
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      databaseId: '',
      storageId: '',
      cronExpression: '0 2 * * *',
      timezone: 'UTC',
      retentionDays: 30,
      retentionCount: undefined,
      enabled: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate cron expression format (basic check)
    const cronParts = formData.cronExpression.trim().split(/\s+/);
    if (cronParts.length < 5) {
      toast.error('Invalid cron expression. Expected format: minute hour day month weekday');
      return;
    }

    const submitData = {
      ...formData,
      retentionCount: formData.retentionCount || undefined,
    };

    createMutation.mutate(submitData);
  };

  const cronExamples = [
    { label: 'Every day at 2:00 AM', value: '0 2 * * *' },
    { label: 'Every 6 hours', value: '0 */6 * * *' },
    { label: 'Every Sunday at midnight', value: '0 0 * * 0' },
    { label: 'Every weekday at 3:00 AM', value: '0 3 * * 1-5' },
    { label: 'First day of month at 1:00 AM', value: '0 1 1 * *' },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/20 dark:bg-black/40 backdrop-blur-md animate-fade-in flex items-center justify-center z-50">
      <div className="glass-light dark:glass-strong rounded-2xl shadow-2xl dark:shadow-blue-500/10 animate-slide-up border-2 border-gray-200 dark:border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Backup Schedule</h2>
            <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Schedule Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Daily Production Backup"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Database
              </label>
              <select
                required
                value={formData.databaseId}
                onChange={(e) => setFormData({ ...formData, databaseId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">Select a database</option>
                {databases?.map((db: any) => (
                  <option key={db.id} value={db.id}>
                    {db.name} ({db.engine})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Storage Target
              </label>
              <select
                required
                value={formData.storageId}
                onChange={(e) => setFormData({ ...formData, storageId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">Select storage</option>
                {storageTargets?.map((storage: any) => (
                  <option key={storage.id} value={storage.id}>
                    {storage.name} ({storage.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Cron Expression
            </label>
            <input
              type="text"
              required
              value={formData.cronExpression}
              onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="0 2 * * *"
            />
            <div className="mt-2 text-xs text-gray-600 dark:text-slate-400 space-y-1">
              <div className="flex items-start">
                <Info className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                <span>Format: minute hour day month weekday</span>
              </div>
              <div className="ml-4 space-y-0.5">
                {cronExamples.map((example, idx) => (
                  <div key={idx}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cronExpression: example.value })}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {example.value}
                    </button>
                    {' - '}
                    <span className="text-gray-600 dark:text-slate-400">{example.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New York (EST/EDT)</option>
                <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                <option value="America/Denver">America/Denver (MST/MDT)</option>
                <option value="America/Los_Angeles">America/Los Angeles (PST/PDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEDT/AEST)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Enabled
              </label>
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-slate-300">
                  Start schedule immediately
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Retention Policy</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Retention Days
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.retentionDays}
                  onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">
                  Delete backups older than this many days
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Retention Count (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.retentionCount || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    retentionCount: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="No limit"
                />
                <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">
                  Keep only the most recent N backups
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>

          {createMutation.isError && (
            <div className="text-sm text-red-600 dark:text-red-400 mt-2">
              Error: {(createMutation.error as Error).message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
