import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabases, deleteDatabase } from '@/lib/api';
import { Database as DatabaseIcon, Plus, Trash2, Edit } from 'lucide-react';
import AddDatabaseModal from '@/components/AddDatabaseModal';
import EditDatabaseModal from '@/components/EditDatabaseModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import type { Database } from '@chronostash/shared';

export default function Databases() {
  const queryClient = useQueryClient();
  const { data: databases, isLoading } = useQuery({ queryKey: ['databases'], queryFn: getDatabases });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
      setShowDeleteModal(false);
      setSelectedDatabase(null);
    },
  });

  const handleEdit = (db: Database) => {
    setSelectedDatabase(db);
    setShowEditModal(true);
  };

  const handleDelete = (db: Database) => {
    setSelectedDatabase(db);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedDatabase) {
      deleteMutation.mutate(selectedDatabase.id);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Databases</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Database
        </button>
      </div>

      <AddDatabaseModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      <EditDatabaseModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        database={selectedDatabase}
      />
      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Database"
        message="Are you sure you want to delete this database connection?"
        itemName={selectedDatabase?.name}
        isDeleting={deleteMutation.isPending}
      />

      <div className="glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700/50">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Engine
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Host
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700/50">
              {databases?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-600 dark:text-slate-400">
                    <DatabaseIcon className="mx-auto h-12 w-12 text-gray-500 dark:text-slate-400 mb-3" />
                    <p>No databases configured</p>
                  </td>
                </tr>
              ) : (
                databases?.map((db) => (
                  <tr key={db.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {db.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-300">
                      {db.engine}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-300">
                      {db.host}:{db.port}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-300">
                      {new Date(db.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(db)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="Edit database"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(db)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Delete database"
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
      </div>
    </div>
  );
}
