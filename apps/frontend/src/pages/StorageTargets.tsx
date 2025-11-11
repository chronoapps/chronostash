import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStorageTargets, deleteStorageTarget } from '@/lib/api';
import { HardDrive, Plus, Edit, Trash2 } from 'lucide-react';
import AddStorageTargetModal from '@/components/AddStorageTargetModal';
import EditStorageTargetModal from '@/components/EditStorageTargetModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import type { StorageTarget } from '@chronostash/shared';

export default function StorageTargets() {
  const queryClient = useQueryClient();
  const { data: targets, isLoading } = useQuery({ queryKey: ['storage-targets'], queryFn: getStorageTargets });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<StorageTarget | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteStorageTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-targets'] });
      setShowDeleteModal(false);
      setSelectedTarget(null);
    },
  });

  const handleEdit = (target: StorageTarget) => {
    setSelectedTarget(target);
    setShowEditModal(true);
  };

  const handleDelete = (target: StorageTarget) => {
    setSelectedTarget(target);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedTarget) {
      deleteMutation.mutate(selectedTarget.id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Storage Targets</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Storage Target
        </button>
      </div>

      <AddStorageTargetModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      <EditStorageTargetModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        target={selectedTarget}
      />
      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Storage Target"
        message="Are you sure you want to delete this storage target? Backups using this target will be affected."
        itemName={selectedTarget?.name}
        isDeleting={deleteMutation.isPending}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targets?.length === 0 ? (
          <div className="col-span-full glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50 p-12 text-center">
            <HardDrive className="mx-auto h-12 w-12 text-gray-500 dark:text-slate-400 mb-3" />
            <p className="text-gray-600 dark:text-slate-400">No storage targets configured</p>
          </div>
        ) : (
          targets?.map((target) => (
            <div key={target.id} className="glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <HardDrive className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{target.name}</h3>
                    <p className="text-sm text-gray-700 dark:text-slate-300">{target.type}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(target)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Edit storage target"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(target)}
                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    title="Delete storage target"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">
                <p>Created: {new Date(target.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
