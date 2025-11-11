import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDatabase, testConnectionWithoutSaving } from '@/lib/api';
import { DatabaseEngine } from '@chronostash/shared';
import { X, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface AddDatabaseModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddDatabaseModal({ open, onClose }: AddDatabaseModalProps) {
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
  const [showHelp, setShowHelp] = useState(false);

  const createMutation = useMutation({
    mutationFn: createDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
      onClose();
      setFormData({
        name: '',
        engine: DatabaseEngine.POSTGRESQL,
        host: '',
        port: 5432,
        username: '',
        password: '',
        database: '',
        sslMode: 'PREFER',
      });
      setTestResult(null);
    },
  });

  const testMutation = useMutation({
    mutationFn: testConnectionWithoutSaving,
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: (error) => {
      setTestResult({ connected: false, error: (error as Error).message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleTestConnection = () => {
    setTestResult(null);
    testMutation.mutate(formData);
  };

  const handleEngineChange = (engine: DatabaseEngine) => {
    const defaultPorts = {
      [DatabaseEngine.POSTGRESQL]: 5432,
      [DatabaseEngine.MYSQL]: 3306,
      [DatabaseEngine.MONGODB]: 27017,
    };
    setFormData({ ...formData, engine, port: defaultPorts[engine] });
    setTestResult(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/20 dark:bg-black/40 backdrop-blur-md animate-fade-in flex items-center justify-center z-50">
      <div className="glass-light dark:glass-strong rounded-2xl shadow-2xl dark:shadow-blue-500/10 animate-slide-up border-2 border-gray-200 dark:border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Database</h2>
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
              placeholder="My Database"
            />
          </div>

          {/* Help Section */}
          <div className="border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Connection Examples (RDS, Kubernetes, Cloud DBs)</span>
              </div>
              {showHelp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showHelp && (
              <div className="px-4 py-3 text-xs space-y-3 border-t border-blue-200 dark:border-blue-800">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">🔵 Kubernetes Pod Database</p>
                  <code className="block bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-slate-200">
                    Host: postgres.production.svc.cluster.local<br />
                    Port: 5432<br />
                    SSL Mode: PREFER
                  </code>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">🟠 AWS RDS PostgreSQL</p>
                  <code className="block bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-slate-200">
                    Host: mydb.abc123.us-east-1.rds.amazonaws.com<br />
                    Port: 5432<br />
                    SSL Mode: REQUIRE
                  </code>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">🟢 Azure Database for PostgreSQL</p>
                  <code className="block bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-slate-200">
                    Host: myserver.postgres.database.azure.com<br />
                    Port: 5432<br />
                    Username: admin@myserver<br />
                    SSL Mode: REQUIRE
                  </code>
                  <p className="text-gray-600 dark:text-slate-400 mt-1">Note: Azure requires @servername in username</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">🔴 Google Cloud SQL</p>
                  <code className="block bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-slate-200">
                    Host: 10.1.2.3 (private IP)<br />
                    Port: 5432<br />
                    SSL Mode: REQUIRE
                  </code>
                  <p className="text-gray-600 dark:text-slate-400 mt-1">Tip: Use Cloud SQL Proxy for secure access</p>
                </div>

                <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-gray-700 dark:text-slate-300">
                    📘 <a href="/docs/SECURED_DATABASES.md" target="_blank" className="text-blue-600 hover:underline">
                      View full documentation
                    </a> for certificates, IAM auth, and troubleshooting
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Engine
            </label>
            <select
              value={formData.engine}
              onChange={(e) => handleEngineChange(e.target.value as DatabaseEngine)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value={DatabaseEngine.POSTGRESQL}>PostgreSQL</option>
              <option value={DatabaseEngine.MYSQL}>MySQL</option>
              <option value={DatabaseEngine.MONGODB}>MongoDB</option>
            </select>
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
                placeholder="localhost or service.namespace.svc.cluster.local"
              />
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                Kubernetes: Use <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">service.namespace.svc.cluster.local</code> or IP
              </p>
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
              placeholder="Leave empty for all databases"
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
              <option value="DISABLE">Disable (Local only)</option>
              <option value="PREFER">Prefer (Default)</option>
              <option value="REQUIRE">Require (RDS/Cloud DBs)</option>
              <option value="VERIFY_CA">Verify CA (Limited support)</option>
              <option value="VERIFY_FULL">Verify Full (Limited support)</option>
            </select>
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
              Use <strong>REQUIRE</strong> for AWS RDS, Azure, Google Cloud SQL
            </p>
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
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Adding...' : 'Add Database'}
              </button>
            </div>
          </div>

          {createMutation.isError && (
            <div className="text-sm text-red-600 dark:text-red-400 mt-2">
              Error: {(createMutation.error as Error).message}
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
