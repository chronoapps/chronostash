import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStorageTarget } from '@/lib/api';
import { StorageType } from '@chronostash/shared';
import { X } from 'lucide-react';

interface AddStorageTargetModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddStorageTargetModal({ open, onClose }: AddStorageTargetModalProps) {
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

  const createMutation = useMutation({
    mutationFn: createStorageTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-targets'] });
      onClose();
      setFormData({
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
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      encryptionKey: formData.encryptionKey || undefined,
    };
    createMutation.mutate(data);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/20 dark:bg-black/40 backdrop-blur-md animate-fade-in flex items-center justify-center z-50">
      <div className="glass-light dark:glass-strong rounded-2xl shadow-2xl dark:shadow-blue-500/10 animate-slide-up border-2 border-gray-200 dark:border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Storage Target</h2>
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
              placeholder="My S3 Storage"
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
            >
              <option value={StorageType.S3}>AWS S3</option>
              <option value={StorageType.CLOUDFLARE_R2}>Cloudflare R2</option>
              <option value={StorageType.GOOGLE_DRIVE}>Google Drive</option>
            </select>
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
                  placeholder="us-east-1"
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
                  placeholder="Leave empty for AWS S3, or use custom endpoint"
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
                  placeholder="my-r2-bucket"
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
                  placeholder="Your Cloudflare Account ID"
                />
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                  Find this in your Cloudflare dashboard
                </p>
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
                  placeholder="R2 API Token Access Key"
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
                  placeholder="R2 API Token Secret"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">📘 Cloudflare R2 Setup</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Create an R2 bucket in your Cloudflare dashboard</li>
                  <li>Generate API tokens: R2 → Manage R2 API Tokens</li>
                  <li>Account ID is in your dashboard URL or R2 overview</li>
                  <li>Region is automatically set to "auto"</li>
                  <li>Endpoint format: <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">https://{'<account-id>'}.r2.cloudflarestorage.com</code></li>
                </ul>
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
                  placeholder="Google OAuth2 Client ID"
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
                  placeholder="Google OAuth2 Client Secret"
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
                  placeholder="Google OAuth2 Refresh Token"
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
                  placeholder="Leave empty to use root folder"
                />
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                  Google Drive folder ID where backups will be stored
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">📘 Google Drive Setup</h4>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Create Google Cloud Project:</strong>
                    <ul className="ml-6 mt-1 list-disc space-y-1">
                      <li>Visit <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Cloud Console</a></li>
                      <li>Create new project or select existing</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Enable Google Drive API:</strong>
                    <ul className="ml-6 mt-1 list-disc">
                      <li>Go to "APIs & Services" → "Enable APIs and Services"</li>
                      <li>Search for "Google Drive API" and enable it</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Create OAuth 2.0 Credentials:</strong>
                    <ul className="ml-6 mt-1 list-disc">
                      <li>Go to "APIs & Services" → "Credentials"</li>
                      <li>Click "Create Credentials" → "OAuth client ID"</li>
                      <li>Application type: <strong>Desktop app</strong></li>
                      <li>Copy your Client ID and Client Secret</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Get Refresh Token:</strong>
                    <ul className="ml-6 mt-1 list-disc space-y-1">
                      <li>Visit <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener noreferrer" className="underline font-medium">OAuth 2.0 Playground</a></li>
                      <li>Click settings (⚙️) → Check "Use your own OAuth credentials"</li>
                      <li>Enter your Client ID and Client Secret</li>
                      <li>In Step 1: Select "Drive API v3" → <code className="bg-blue-100 px-1 rounded">https://www.googleapis.com/auth/drive.file</code></li>
                      <li>Click "Authorize APIs" and sign in with Google</li>
                      <li>In Step 2: Click "Exchange authorization code for tokens"</li>
                      <li>Copy the <strong>Refresh token</strong> (not Access token!)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Optional - Folder ID:</strong>
                    <ul className="ml-6 mt-1 list-disc">
                      <li>Create a folder in Google Drive</li>
                      <li>Open the folder and copy ID from URL: <code className="bg-blue-100 px-1 rounded text-xs">drive.google.com/drive/folders/[FOLDER_ID]</code></li>
                    </ul>
                  </li>
                </ol>
                <div className="mt-3 pt-3 border-t border-blue-300">
                  <p className="text-xs text-blue-900 font-semibold">⚠️ Common Issues:</p>
                  <ul className="text-xs text-blue-800 mt-1 space-y-1 list-disc list-inside">
                    <li><strong>401 Unauthorized:</strong> Wrong Client ID/Secret or expired refresh token</li>
                    <li><strong>403 Forbidden:</strong> Drive API not enabled or wrong OAuth scope</li>
                    <li><strong>Refresh token expires:</strong> Only happens if app is in "Testing" mode - publish it or refresh token expires in 7 days</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Encryption Key (optional, 32 characters for AES-256)
            </label>
            <input
              type="password"
              value={formData.encryptionKey}
              onChange={(e) => setFormData({ ...formData, encryptionKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              maxLength={32}
              placeholder="Leave empty for no encryption"
            />
            {formData.encryptionKey && formData.encryptionKey.length !== 32 && (
              <p className="text-sm text-amber-600 mt-1">
                Encryption key must be exactly 32 characters
              </p>
            )}
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
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Storage Target'}
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
