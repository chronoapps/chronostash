import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getRestores, deleteRestore } from '@/lib/api';
import { RotateCcw, Plus, Trash2 } from 'lucide-react';
import { RestoreStatus } from '@chronostash/shared';
import CreateRestoreModal from '@/components/CreateRestoreModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useRealtimeRestores } from '@/hooks/useRealtimeUpdates';
import type { Restore } from '@chronostash/shared';

export default function Restores() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['restores'], queryFn: () => getRestores() });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRestore, setSelectedRestore] = useState<Restore | null>(null);

  // Real-time updates with toast notifications
  useRealtimeRestores({
    enabled: true,
    onComplete: () => {
      queryClient.invalidateQueries({ queryKey: ['restores'] });
    },
    onFailed: () => {
      queryClient.invalidateQueries({ queryKey: ['restores'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRestore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restores'] });
      setShowDeleteModal(false);
      setSelectedRestore(null);
      toast.success('Restore record deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete restore: ${error.message}`);
    },
  });

  const handleDelete = (restore: Restore) => {
    setSelectedRestore(restore);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedRestore) {
      deleteMutation.mutate(selectedRestore.id);
    }
  };

  const getStatusBadge = (status: RestoreStatus) => {
    const badges = {
      [RestoreStatus.PENDING]: 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300',
      [RestoreStatus.IN_PROGRESS]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      [RestoreStatus.COMPLETED]: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      [RestoreStatus.FAILED]: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
        {status}
      </span>
    );
  };

  if (isLoading) return <div>Loading...</div>;

  const restores = data?.restores || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Restores</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Restore
        </button>
      </div>

      <CreateRestoreModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Restore"
        message="Are you sure you want to delete this restore record?"
        itemName={selectedRestore?.id.slice(0, 8)}
        isDeleting={deleteMutation.isPending}
      />

      <div className="glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700/50">
          <thead className="bg-gray-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Backup</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Database</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700/50">
            {restores.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-600 dark:text-slate-400">
                  <RotateCcw className="mx-auto h-12 w-12 text-gray-500 dark:text-slate-400 mb-3" />
                  <p>No restores yet</p>
                </td>
              </tr>
            ) : (
              restores.map((restore: any) => (
                <tr key={restore.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {restore.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {restore.backup?.id.slice(0, 8) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="font-medium">{restore.backup?.database?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">{restore.backup?.database?.engine}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(restore.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 dark:bg-slate-700 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                          style={{ width: `${restore.progress}%` }}
                        />
                      </div>
                      <span>{restore.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {restore.duration ? `${restore.duration}s` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {new Date(restore.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(restore)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900"
                      title="Delete restore"
                      disabled={restore.status === RestoreStatus.IN_PROGRESS}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {restores.some((r: any) => r.error) && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Recent Errors</h4>
          {restores
            .filter((r: any) => r.error)
            .map((r: any) => (
              <div key={r.id} className="text-sm text-red-700">
                <span className="font-medium">{r.id.slice(0, 8)}:</span> {r.error}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
