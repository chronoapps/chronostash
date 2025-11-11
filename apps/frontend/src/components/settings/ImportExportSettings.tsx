import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { exportSettings, importSettings, type ExportData } from '@/lib/api';

export default function ImportExportSettings() {
  const queryClient = useQueryClient();
  const [, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ExportData | null>(null);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const exportData = await exportSettings();

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chronostash-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return exportData;
    },
    onSuccess: () => {
      toast.success('Settings exported successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to export settings: ${error.message}`);
    },
  });

  const importMutation = useMutation({
    mutationFn: importSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
      queryClient.invalidateQueries({ queryKey: ['storage-targets'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });

      const { results } = data;
      toast.success(
        `Import completed: ${results.databases} databases, ${results.storageTargets} storage targets, ${results.schedules} schedules, ${results.settings} settings`
      );
      setImportFile(null);
      setImportPreview(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to import settings: ${error.message}`);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      toast.error('Please select a valid JSON file');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;

      // Validate structure
      if (!data.version || !data.databases || !data.storageTargets) {
        toast.error('Invalid settings file format');
        return;
      }

      setImportFile(file);
      setImportPreview(data);
      toast.success('Settings file loaded. Review and confirm import.');
    } catch (error) {
      toast.error('Failed to parse JSON file');
    }
  };

  const handleImport = () => {
    if (!importPreview) return;
    importMutation.mutate(importPreview);
  };

  const handleCancelImport = () => {
    setImportFile(null);
    setImportPreview(null);
  };

  return (
    <div className="space-y-8">
      {/* Export Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Settings</h3>
        <div className="max-w-2xl">
          <p className="text-sm text-gray-600 mb-4">
            Export all your databases, storage targets, schedules, and notification settings to a
            JSON file. This can be used as a backup or to transfer settings to another instance.
          </p>

          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {exportMutation.isPending ? 'Exporting...' : 'Export All Settings'}
          </button>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>What's included:</strong>
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside mt-2 space-y-1">
              <li>All database configurations</li>
              <li>All storage target configurations</li>
              <li>All backup schedules</li>
              <li>Notification settings (Slack, Telegram)</li>
            </ul>
            <p className="text-sm text-blue-800 mt-2">
              <strong>Not included:</strong> Backup history, restore history, account credentials
            </p>
          </div>
        </div>
      </div>

      {/* Import Settings */}
      <div className="pt-8 border-t border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Settings</h3>
        <div className="max-w-2xl">
          <p className="text-sm text-gray-600 mb-4">
            Import settings from a previously exported JSON file. This will create new databases,
            storage targets, and schedules.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Warning</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Importing settings will create new resources. It will not overwrite existing
                  databases or storage targets. Review the preview before confirming.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Settings File
              </label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none"
              />
            </div>

            {importPreview && (
              <div className="bg-white border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Import Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">File Version:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{importPreview.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Exported At:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(importPreview.exportedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Databases:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {importPreview.databases.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Storage Targets:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {importPreview.storageTargets.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Schedules:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {importPreview.schedules.length}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={handleImport}
                    disabled={importMutation.isPending}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {importMutation.isPending ? 'Importing...' : 'Confirm Import'}
                  </button>
                  <button
                    onClick={handleCancelImport}
                    disabled={importMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backup Current Settings */}
      <div className="pt-8 border-t border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Best Practices</h3>
        <div className="max-w-2xl space-y-3 text-sm text-gray-600 dark:text-slate-400">
          <p>
            <strong className="text-gray-900">Before importing:</strong> Export your current
            settings as a backup in case you need to revert changes.
          </p>
          <p>
            <strong className="text-gray-900">Test imports:</strong> Consider testing imports on a
            non-production instance first to verify the data.
          </p>
          <p>
            <strong className="text-gray-900">Version compatibility:</strong> Only import settings
            files from the same or compatible ChronoStash versions.
          </p>
          <p>
            <strong className="text-gray-900">Sensitive data:</strong> Settings files may contain
            credentials and API keys. Store them securely and never commit to version control.
          </p>
        </div>
      </div>
    </div>
  );
}
