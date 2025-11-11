import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDatabase, testDatabaseConnection } from '@/lib/api';
import { DatabaseEngine, type Database } from '@chronostash/shared';
import { X } from 'lucide-react';

interface EditDatabaseModalProps {
  open: boolean;
  onClose: () => void;
  database: Database | null;
}

export default function EditDatabaseModal({ open, onClose, database }: EditDatabaseModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    engine: DatabaseEngine.POSTGRESQL,
    host: '',
    port: 5432,
    username: '',
    password: '',
    database: '',
    sslMode: 'PREFER',
  });
  const [testResult, setTestResult] = useState<{ connected: boolean; error?: string } | null>(null);

  // Update form when database changes
  useEffect(() => {
    if (database) {
      setFormData({
        name: database.name,
        engine: database.engine,
        host: database.host,
        port: database.port,
        username: database.username,
        password: database.password,
        database: database.database || '',
        sslMode: database.sslMode || 'PREFER',
      });
      setTestResult(null);
    }
  }, [database]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateDatabase(database!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
      onClose();
    },
  });

  const testMutation = useMutation({
    mutationFn: () => testDatabaseConnection(database!.id),
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: (error) => {
      setTestResult({ connected: false, error: (error as Error).message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleTestConnection = () => {
    setTestResult(null);
    testMutation.mutate();
  };

  if (!open || !database) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/20 dark:bg-black/40 backdrop-blur-md animate-fade-in flex items-center justify-center z-50">
      <div className="glass-light dark:glass-strong rounded-2xl shadow-2xl dark:shadow-blue-500/10 animate-slide-up border-2 border-gray-200 dark:border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Database</h2>
            <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Engine
            </label>
            <select
              value={formData.engine}
              onChange={(e) => setFormData({ ...formData, engine: e.target.value as DatabaseEngine })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              disabled
            >
              <option value={DatabaseEngine.POSTGRESQL}>PostgreSQL</option>
              <option value={DatabaseEngine.MYSQL}>MySQL</option>
              <option value={DatabaseEngine.MONGODB}>MongoDB</option>
            </select>
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">Engine type cannot be changed</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Host
              </label>
              <input
                type="text"
                required
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Port
              </label>
              <input
                type="number"
                required
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Enter password to update"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Database Name (optional)
            </label>
            <input
              type="text"
              value={formData.database}
              onChange={(e) => setFormData({ ...formData, database: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              SSL Mode
            </label>
            <select
              value={formData.sslMode}
              onChange={(e) => setFormData({ ...formData, sslMode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="DISABLE">Disable</option>
              <option value="PREFER">Prefer</option>
              <option value="REQUIRE">Require</option>
              <option value="VERIFY_CA">Verify CA</option>
              <option value="VERIFY_FULL">Verify Full</option>
            </select>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {testMutation.isPending ? 'Testing...' : 'Test Connection'}
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {updateMutation.isError && (
            <div className="text-sm text-red-600 dark:text-red-400 mt-2">
              Error: {(updateMutation.error as Error).message}
            </div>
          )}

          {testResult && (
            <div className={`text-sm mt-2 p-3 rounded-md ${testResult.connected ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {testResult.connected ? '✓ Connection successful' : `✗ Connection failed: ${testResult.error}`}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
