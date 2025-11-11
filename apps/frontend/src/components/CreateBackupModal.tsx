import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createBackup, getDatabases, getStorageTargets } from '@/lib/api';
import { X } from 'lucide-react';

interface CreateBackupModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateBackupModal({ open, onClose }: CreateBackupModalProps) {
  const queryClient = useQueryClient();
  const { data: databases } = useQuery({ queryKey: ['databases'], queryFn: getDatabases });
  const { data: storageTargets } = useQuery({ queryKey: ['storage-targets'], queryFn: getStorageTargets });

  const [formData, setFormData] = useState({
    databaseId: '',
    storageId: '',
  });

  const createMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      onClose();
      setFormData({ databaseId: '', storageId: '' });
      toast.success('Backup started! You will receive notifications as it progresses.');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create backup: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/20 dark:bg-black/40 backdrop-blur-md animate-fade-in flex items-center justify-center z-50">
      <div className="glass-light dark:glass-strong rounded-2xl shadow-2xl dark:shadow-blue-500/10 animate-slide-up border-2 border-gray-200 dark:border-slate-700/50 max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Backup</h2>
            <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              {databases?.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.name} ({db.engine})
                </option>
              ))}
            </select>
            {databases?.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                No databases available. Please add a database first.
              </p>
            )}
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
              <option value="">Select a storage target</option>
              {storageTargets?.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name} ({target.type})
                </option>
              ))}
            </select>
            {storageTargets?.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                No storage targets available. Please add a storage target first.
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              The backup will be created immediately and you can monitor its progress in the Backups page.
            </p>
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
              disabled={createMutation.isPending || !databases?.length || !storageTargets?.length}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Backup'}
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
