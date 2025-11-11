import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createRestore, getBackups } from '@/lib/api';
import { X } from 'lucide-react';
import { BackupStatus } from '@chronostash/shared';

interface CreateRestoreModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateRestoreModal({ open, onClose }: CreateRestoreModalProps) {
  const queryClient = useQueryClient();
  const { data: backupsData } = useQuery({
    queryKey: ['backups'],
    queryFn: () => getBackups({ status: BackupStatus.COMPLETED })
  });

  const [formData, setFormData] = useState({
    backupId: '',
    customTarget: false,
    targetHost: '',
    targetPort: 5432,
    targetDb: '',
    targetUsername: '',
    targetPassword: '',
    dropExisting: true,
  });

  const createMutation = useMutation({
    mutationFn: createRestore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restores'] });
      onClose();
      setFormData({
        backupId: '',
        customTarget: false,
        targetHost: '',
        targetPort: 5432,
        targetDb: '',
        targetUsername: '',
        targetPassword: '',
        dropExisting: true,
      });
      toast.success('Restore started! You will receive notifications as it progresses.');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create restore: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: any = {
      backupId: formData.backupId,
      dropExisting: formData.dropExisting,
    };

    if (formData.customTarget) {
      data.targetHost = formData.targetHost;
      data.targetPort = formData.targetPort;
      data.targetDb = formData.targetDb;
      data.targetUsername = formData.targetUsername;
      data.targetPassword = formData.targetPassword;
    }

    createMutation.mutate(data);
  };

  if (!open) return null;

  const completedBackups = backupsData?.backups?.filter(
    b => b.status === BackupStatus.COMPLETED
  ) || [];

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/20 dark:bg-black/40 backdrop-blur-md animate-fade-in flex items-center justify-center z-50">
      <div className="glass-light dark:glass-strong rounded-2xl shadow-2xl dark:shadow-blue-500/10 animate-slide-up border-2 border-gray-200 dark:border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Restore</h2>
            <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Select Backup
            </label>
            <select
              required
              value={formData.backupId}
              onChange={(e) => setFormData({ ...formData, backupId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">Choose a backup...</option>
              {completedBackups.map((backup) => (
                <option key={backup.id} value={backup.id}>
                  {backup.id.slice(0, 8)} - {new Date(backup.createdAt).toLocaleString()}
                  {backup.size ? ` (${(Number(backup.size) / 1024 / 1024).toFixed(2)} MB)` : ''}
                </option>
              ))}
            </select>
            {completedBackups.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No completed backups available</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="customTarget"
              checked={formData.customTarget}
              onChange={(e) => setFormData({ ...formData, customTarget: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="customTarget" className="ml-2 text-sm text-gray-700 dark:text-slate-300">
              Restore to different location
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="dropExisting"
              checked={formData.dropExisting}
              onChange={(e) => setFormData({ ...formData, dropExisting: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="dropExisting" className="ml-2 text-sm text-gray-700 dark:text-slate-300">
              Drop existing objects before restore (--clean)
            </label>
          </div>

          {formData.dropExisting && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This will drop all existing database objects (tables, types, etc.)
                before restoring. Only uncheck this if you're restoring to an empty database or want to merge data.
              </p>
            </div>
          )}

          {formData.customTarget && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <p className="text-sm text-blue-800">
                  By default, the backup will be restored to the original database.
                  Specify custom connection details to restore to a different location.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    required={formData.customTarget}
                    value={formData.targetHost}
                    onChange={(e) => setFormData({ ...formData, targetHost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    required={formData.customTarget}
                    value={formData.targetPort}
                    onChange={(e) => setFormData({ ...formData, targetPort: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Database Name (optional)
                </label>
                <input
                  type="text"
                  value={formData.targetDb}
                  onChange={(e) => setFormData({ ...formData, targetDb: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Leave empty to use original database name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required={formData.customTarget}
                  value={formData.targetUsername}
                  onChange={(e) => setFormData({ ...formData, targetUsername: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required={formData.customTarget}
                  value={formData.targetPassword}
                  onChange={(e) => setFormData({ ...formData, targetPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
            </>
          )}

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
              disabled={createMutation.isPending || completedBackups.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Restore'}
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
