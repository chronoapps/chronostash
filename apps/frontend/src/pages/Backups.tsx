import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getBackups, deleteBackup, cancelBackup } from '@/lib/api';
import { Archive, Plus, Trash2, X, RotateCcw, Download } from 'lucide-react';
import { BackupStatus } from '@chronostash/shared';
import CreateBackupModal from '@/components/CreateBackupModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useRealtimeBackups } from '@/hooks/useRealtimeUpdates';
import type { Backup } from '@chronostash/shared';

export default function Backups() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['backups'], queryFn: () => getBackups() });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);

  // Real-time updates with toast notifications
  useRealtimeBackups({
    enabled: true,
    onComplete: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onFailed: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      setShowDeleteModal(false);
      setSelectedBackup(null);
      toast.success('Backup deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete backup: ${error.message}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast.success('Backup cancelled');
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel backup: ${error.message}`);
    },
  });

  const handleDelete = (backup: Backup) => {
    setSelectedBackup(backup);
    setShowDeleteModal(true);
  };

  const handleCancel = (backup: Backup) => {
    if (confirm(`Cancel backup ${backup.id.slice(0, 8)}?`)) {
      cancelMutation.mutate(backup.id);
    }
  };

  const handleDownload = (backup: Backup) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = `/api/backups/${backup.id}/download`;
    link.download = `backup-${backup.id.slice(0, 8)}.sql.gz`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = () => {
    if (selectedBackup) {
      deleteMutation.mutate(selectedBackup.id);
    }
  };

  const getStatusBadge = (status: BackupStatus) => {
    const badges = {
      [BackupStatus.PENDING]: 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300',
      [BackupStatus.IN_PROGRESS]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      [BackupStatus.COMPLETED]: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      [BackupStatus.FAILED]: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      [BackupStatus.CANCELLED]: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
        {status}
      </span>
    );
  };

  if (isLoading) return <div>Loading...</div>;

  const backups = data?.backups || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Backups</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Backup
        </button>
      </div>

      <CreateBackupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Backup"
        message="Are you sure you want to delete this backup? This will remove the backup record and the backup file from storage."
        itemName={selectedBackup?.id.slice(0, 8)}
        isDeleting={deleteMutation.isPending}
      />

      <div className="glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700/50">
          <thead className="bg-gray-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Database</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Storage</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700/50">
            {backups.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-600 dark:text-slate-400">
                  <Archive className="mx-auto h-12 w-12 text-gray-500 dark:text-slate-400 mb-3" />
                  <p>No backups yet</p>
                </td>
              </tr>
            ) : (
              backups.map((backup: any) => (
                <tr key={backup.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {backup.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="font-medium">{backup.database?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">{backup.database?.engine}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    <div>
                      <div>{backup.storage?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">{backup.storage?.type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(backup.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 dark:bg-slate-700 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                          style={{ width: `${backup.progress}%` }}
                        />
                      </div>
                      <span>{backup.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {backup.size ? `${(Number(backup.size) / 1024 / 1024).toFixed(2)} MB` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {backup.duration ? `${Math.round(backup.duration / 1000)}s` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {new Date(backup.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {backup.status === BackupStatus.IN_PROGRESS && (
                        <button
                          onClick={() => handleCancel(backup)}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                          title="Cancel backup"
                          disabled={cancelMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      {backup.status === BackupStatus.COMPLETED && (
                        <>
                          <button
                            onClick={() => handleDownload(backup)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            title="Download backup"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Implement restore from this backup */}}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            title="Restore from this backup"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(backup)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        title="Delete backup"
                        disabled={backup.status === BackupStatus.IN_PROGRESS}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {backups.some((b: any) => b.error) && (
        <div className="mt-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-md p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">Recent Errors</h4>
          {backups
            .filter((b: any) => b.error)
            .map((b: any) => (
              <div key={b.id} className="text-sm text-red-700 dark:text-red-300">
                <span className="font-medium">{b.id.slice(0, 8)}:</span> {b.error}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
