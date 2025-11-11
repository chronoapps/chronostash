import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStorageTarget } from '@/lib/api';
import { StorageType, type StorageTarget } from '@chronostash/shared';
import { X } from 'lucide-react';

interface EditStorageTargetModalProps {
  open: boolean;
  onClose: () => void;
  target: StorageTarget | null;
}

export default function EditStorageTargetModal({ open, onClose, target }: EditStorageTargetModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    type: StorageType.S3,
    config: {
      bucket: '',
      region: '',
      endpoint: '',
      accountId: '',
      accessKeyId: '',
      secretAccessKey: '',
      clientId: '',
      clientSecret: '',
      refreshToken: '',
      folderId: '',
    },
    encryptionKey: '',
  });

  useEffect(() => {
    if (target) {
      const config = target.config as any;
      setFormData({
        name: target.name,
        type: target.type,
        config: {
          bucket: config.bucket || '',
          region: config.region || '',
          endpoint: config.endpoint || '',
          accountId: config.accountId || '',
          accessKeyId: config.accessKeyId || '',
          secretAccessKey: config.secretAccessKey || '',
          clientId: config.clientId || '',
          clientSecret: config.clientSecret || '',
          refreshToken: config.refreshToken || '',
          folderId: config.folderId || '',
        },
        encryptionKey: target.encryptionKey || '',
      });
    }
  }, [target]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateStorageTarget(target!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-targets'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      encryptionKey: formData.encryptionKey || undefined,
    };
    updateMutation.mutate(data);
  };

  if (!open || !target) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/20 dark:bg-black/40 backdrop-blur-md animate-fade-in flex items-center justify-center z-50">
      <div className="glass-light dark:glass-strong rounded-2xl shadow-2xl dark:shadow-blue-500/10 animate-slide-up border-2 border-gray-200 dark:border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Storage Target</h2>
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
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as StorageType })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              disabled
            >
              <option value={StorageType.S3}>AWS S3</option>
              <option value={StorageType.CLOUDFLARE_R2}>Cloudflare R2</option>
              <option value={StorageType.GOOGLE_DRIVE}>Google Drive</option>
            </select>
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">Storage type cannot be changed</p>
          </div>

          {formData.type === StorageType.S3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Bucket Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.config.bucket}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, bucket: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  required
                  value={formData.config.region}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, region: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Endpoint (optional)
                </label>
                <input
                  type="text"
                  value={formData.config.endpoint}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, endpoint: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Access Key ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.config.accessKeyId}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, accessKeyId: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Secret Access Key
                </label>
                <input
                  type="password"
                  required
                  value={formData.config.secretAccessKey}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, secretAccessKey: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Enter to update"
                />
              </div>
            </>
          )}

          {formData.type === StorageType.CLOUDFLARE_R2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Bucket Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.config.bucket}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, bucket: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Account ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.config.accountId}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, accountId: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Access Key ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.config.accessKeyId}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, accessKeyId: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Secret Access Key
                </label>
                <input
                  type="password"
                  required
                  value={formData.config.secretAccessKey}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, secretAccessKey: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Enter to update"
                />
              </div>
            </>
          )}

          {formData.type === StorageType.GOOGLE_DRIVE && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.config.clientId}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, clientId: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Client Secret
                </label>
                <input
                  type="password"
                  required
                  value={formData.config.clientSecret}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, clientSecret: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Enter to update"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Refresh Token
                </label>
                <input
                  type="password"
                  required
                  value={formData.config.refreshToken}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, refreshToken: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Enter to update"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Folder ID (optional)
                </label>
                <input
                  type="text"
                  value={formData.config.folderId}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, folderId: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Leave empty for root folder"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Encryption Key (optional, 32 characters)
            </label>
            <input
              type="password"
              value={formData.encryptionKey}
              onChange={(e) => setFormData({ ...formData, encryptionKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              maxLength={32}
              placeholder="Leave empty to keep current"
            />
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
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {updateMutation.isError && (
            <div className="text-sm text-red-600 dark:text-red-400 mt-2">
              Error: {(updateMutation.error as Error).message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
