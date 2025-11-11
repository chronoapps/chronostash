import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BackupStatus, RestoreStatus } from '@chronostash/shared';
import type { Backup, Restore } from '@chronostash/shared';

interface UseRealtimeBackupsOptions {
  enabled?: boolean;
  onComplete?: (backup: Backup) => void;
  onFailed?: (backup: Backup) => void;
}

interface UseRealtimeRestoresOptions {
  enabled?: boolean;
  onComplete?: (restore: Restore) => void;
  onFailed?: (restore: Restore) => void;
}

/**
 * Hook to poll for backup updates and show toast notifications
 */
export function useRealtimeBackups(options: UseRealtimeBackupsOptions = {}) {
  const { enabled = true, onComplete, onFailed } = options;
  const queryClient = useQueryClient();
  const previousBackupsRef = useRef<Map<string, BackupStatus>>(new Map());
  const toastIdsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(async () => {
      // Get current backups from cache
      const cachedData = queryClient.getQueryData<{ backups: Backup[]; total: number }>(['backups']);
      if (!cachedData) return;

      const backups = cachedData.backups;

      // Check for status changes
      backups.forEach((backup: any) => {
        const prevStatus = previousBackupsRef.current.get(backup.id);
        const currentStatus = backup.status;

        // Skip if no previous status (first render)
        if (!prevStatus) {
          previousBackupsRef.current.set(backup.id, currentStatus);
          return;
        }

        // Status changed
        if (prevStatus !== currentStatus) {
          const backupName = `${backup.database?.name || 'Unknown'} backup`;

          // Dismiss any existing toast for this backup
          const existingToastId = toastIdsRef.current.get(backup.id);
          if (existingToastId) {
            toast.dismiss(existingToastId);
          }

          // Show toast based on new status
          if (currentStatus === BackupStatus.COMPLETED) {
            const size = backup.size ? `${(Number(backup.size) / 1024 / 1024).toFixed(2)} MB` : '';
            const duration = backup.duration ? `${Math.round(backup.duration / 1000)}s` : '';
            toast.success(
              `${backupName} completed successfully! ${size}${size && duration ? ' in ' : ''}${duration}`,
              { id: backup.id }
            );
            onComplete?.(backup);
          } else if (currentStatus === BackupStatus.FAILED) {
            toast.error(
              `${backupName} failed: ${backup.error || 'Unknown error'}`,
              { id: backup.id, duration: 6000 }
            );
            onFailed?.(backup);
          } else if (currentStatus === BackupStatus.CANCELLED) {
            toast.error(`${backupName} was cancelled`, { id: backup.id });
          } else if (currentStatus === BackupStatus.IN_PROGRESS && prevStatus === BackupStatus.PENDING) {
            const toastId = toast.loading(`${backupName} is running... ${backup.progress}%`, {
              id: backup.id,
            });
            toastIdsRef.current.set(backup.id, toastId);
          }

          previousBackupsRef.current.set(backup.id, currentStatus);
        }

        // Update progress for in-progress backups
        if (currentStatus === BackupStatus.IN_PROGRESS) {
          const existingToastId = toastIdsRef.current.get(backup.id);
          if (existingToastId) {
            toast.loading(
              `${backup.database?.name || 'Unknown'} backup is running... ${backup.progress}%`,
              { id: existingToastId }
            );
          }
        }
      });

      // Refetch if there are any in-progress backups
      const hasInProgress = backups.some((b: any) => b.status === BackupStatus.IN_PROGRESS);
      if (hasInProgress) {
        queryClient.invalidateQueries({ queryKey: ['backups'] });
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [enabled, queryClient, onComplete, onFailed]);
}

/**
 * Hook to poll for restore updates and show toast notifications
 */
export function useRealtimeRestores(options: UseRealtimeRestoresOptions = {}) {
  const { enabled = true, onComplete, onFailed } = options;
  const queryClient = useQueryClient();
  const previousRestoresRef = useRef<Map<string, RestoreStatus>>(new Map());
  const toastIdsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(async () => {
      // Get current restores from cache
      const cachedData = queryClient.getQueryData<{ restores: Restore[]; total: number }>(['restores']);
      if (!cachedData) return;

      const restores = cachedData.restores;

      // Check for status changes
      restores.forEach((restore: any) => {
        const prevStatus = previousRestoresRef.current.get(restore.id);
        const currentStatus = restore.status;

        // Skip if no previous status (first render)
        if (!prevStatus) {
          previousRestoresRef.current.set(restore.id, currentStatus);
          return;
        }

        // Status changed
        if (prevStatus !== currentStatus) {
          const restoreName = `${restore.backup?.database?.name || 'Unknown'} restore`;

          // Dismiss any existing toast for this restore
          const existingToastId = toastIdsRef.current.get(restore.id);
          if (existingToastId) {
            toast.dismiss(existingToastId);
          }

          // Show toast based on new status
          if (currentStatus === RestoreStatus.COMPLETED) {
            const duration = restore.duration ? `${Math.round(restore.duration / 1000)}s` : '';
            toast.success(
              `${restoreName} completed successfully!${duration ? ` (${duration})` : ''}`,
              { id: restore.id }
            );
            onComplete?.(restore);
          } else if (currentStatus === RestoreStatus.FAILED) {
            toast.error(
              `${restoreName} failed: ${restore.error || 'Unknown error'}`,
              { id: restore.id, duration: 6000 }
            );
            onFailed?.(restore);
          } else if (currentStatus === RestoreStatus.IN_PROGRESS && prevStatus === RestoreStatus.PENDING) {
            const toastId = toast.loading(`${restoreName} is running... ${restore.progress}%`, {
              id: restore.id,
            });
            toastIdsRef.current.set(restore.id, toastId);
          }

          previousRestoresRef.current.set(restore.id, currentStatus);
        }

        // Update progress for in-progress restores
        if (currentStatus === RestoreStatus.IN_PROGRESS) {
          const existingToastId = toastIdsRef.current.get(restore.id);
          if (existingToastId) {
            toast.loading(
              `${restore.backup?.database?.name || 'Unknown'} restore is running... ${restore.progress}%`,
              { id: existingToastId }
            );
          }
        }
      });

      // Refetch if there are any in-progress restores
      const hasInProgress = restores.some((r: any) => r.status === RestoreStatus.IN_PROGRESS);
      if (hasInProgress) {
        queryClient.invalidateQueries({ queryKey: ['restores'] });
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [enabled, queryClient, onComplete, onFailed]);
}
