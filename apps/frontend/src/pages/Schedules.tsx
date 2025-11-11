import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getSchedules, getDatabases, getStorageTargets, deleteSchedule, toggleSchedule, runSchedule } from '@/lib/api';
import { Calendar, Plus, Edit2, Trash2, Power, PlayCircle } from 'lucide-react';
import type { Schedule } from '@chronostash/shared';
import CreateScheduleModal from '@/components/CreateScheduleModal';
import EditScheduleModal from '@/components/EditScheduleModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function Schedules() {
  const queryClient = useQueryClient();
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => getSchedules()
  });
  const { data: databases } = useQuery({ queryKey: ['databases'], queryFn: getDatabases });
  const { data: storageTargets } = useQuery({ queryKey: ['storage-targets'], queryFn: getStorageTargets });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Get database and storage names by ID
  const getDatabaseName = (databaseId: string) => {
    const db = databases?.find((d: any) => d.id === databaseId);
    return db ? `${db.name} (${db.engine})` : databaseId.slice(0, 8);
  };

  const getStorageName = (storageId: string) => {
    const storage = storageTargets?.find((s: any) => s.id === storageId);
    return storage ? `${storage.name} (${storage.type})` : storageId.slice(0, 8);
  };

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowDeleteModal(false);
      setSelectedSchedule(null);
      toast.success('Schedule deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete schedule: ${error.message}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleSchedule,
    onSuccess: (updatedSchedule) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success(`Schedule ${updatedSchedule.enabled ? 'enabled' : 'disabled'} successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle schedule: ${error.message}`);
    },
  });

  const runNowMutation = useMutation({
    mutationFn: runSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast.success('Backup job created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to run schedule: ${error.message}`);
    },
  });

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowEditModal(true);
  };

  const handleDelete = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedSchedule) {
      deleteMutation.mutate(selectedSchedule.id);
    }
  };

  const handleToggle = (schedule: Schedule) => {
    toggleMutation.mutate(schedule.id);
  };

  const handleRunNow = (schedule: Schedule) => {
    runNowMutation.mutate(schedule.id);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Backup Schedules</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </button>
      </div>

      <CreateScheduleModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <EditScheduleModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        schedule={selectedSchedule}
      />
      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Schedule"
        message="Are you sure you want to delete this backup schedule? This will not delete existing backups."
        itemName={selectedSchedule?.name}
        isDeleting={deleteMutation.isPending}
      />

      <div className="glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700/50">
          <thead className="bg-gray-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Database</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Storage</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Cron</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Retention</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Last Run</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Next Run</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700/50">
            {schedules?.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-600 dark:text-slate-400">
                  <Calendar className="mx-auto h-12 w-12 text-gray-500 dark:text-slate-400 mb-3" />
                  <p>No schedules configured</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Create your first schedule
                  </button>
                </td>
              </tr>
            ) : (
              schedules?.map((schedule: any) => (
                <tr key={schedule.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {schedule.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {getDatabaseName(schedule.databaseId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {getStorageName(schedule.storageId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300 font-mono">
                    {schedule.cronExpression}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    <div className="text-xs">
                      {schedule.retentionDays && (
                        <div>{schedule.retentionDays} days</div>
                      )}
                      {schedule.retentionCount && (
                        <div>Keep {schedule.retentionCount}</div>
                      )}
                      {!schedule.retentionDays && !schedule.retentionCount && (
                        <span className="text-gray-500 dark:text-slate-400">No limit</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      schedule.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
                    }`}>
                      {schedule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {schedule.lastRunAt ? new Date(schedule.lastRunAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleToggle(schedule)}
                        className={`${
                          schedule.enabled
                            ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300'
                            : 'text-green-600 dark:text-green-400 hover:text-green-900'
                        }`}
                        title={schedule.enabled ? 'Disable schedule' : 'Enable schedule'}
                        disabled={toggleMutation.isPending}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRunNow(schedule)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Run now"
                        disabled={runNowMutation.isPending}
                      >
                        <PlayCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                        title="Edit schedule"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        title="Delete schedule"
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
  );
}
