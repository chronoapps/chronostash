import axios from 'axios';
import type { Database, StorageTarget, Backup, Restore, Schedule } from '@chronostash/shared';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Databases
export const getDatabases = () => api.get<Database[]>('/databases').then(res => res.data);
export const getDatabase = (id: string) => api.get<Database>(`/databases/${id}`).then(res => res.data);
export const createDatabase = (data: Partial<Database>) => api.post<Database>('/databases', data).then(res => res.data);
export const updateDatabase = (id: string, data: Partial<Database>) => api.put<Database>(`/databases/${id}`, data).then(res => res.data);
export const deleteDatabase = (id: string) => api.delete(`/databases/${id}`);
export const testDatabaseConnection = (id: string) => api.post<{ connected: boolean; error?: string }>(`/databases/${id}/test`).then(res => res.data);
export const testConnectionWithoutSaving = (data: Partial<Database>) => api.post<{ connected: boolean; error?: string }>('/databases/test-connection', data).then(res => res.data);

// Storage Targets
export const getStorageTargets = () => api.get<StorageTarget[]>('/storage-targets').then(res => res.data);
export const getStorageTarget = (id: string) => api.get<StorageTarget>(`/storage-targets/${id}`).then(res => res.data);
export const createStorageTarget = (data: Partial<StorageTarget>) => api.post<StorageTarget>('/storage-targets', data).then(res => res.data);
export const updateStorageTarget = (id: string, data: Partial<StorageTarget>) => api.put<StorageTarget>(`/storage-targets/${id}`, data).then(res => res.data);
export const deleteStorageTarget = (id: string) => api.delete(`/storage-targets/${id}`);
export const testStorageConnection = (id: string) => api.post<{ connected: boolean; error?: string }>(`/storage-targets/${id}/test`).then(res => res.data);

// Backups
export const getBackups = (params?: { databaseId?: string; status?: string }) =>
  api.get<{ backups: Backup[]; total: number }>('/backups', { params }).then(res => res.data);
export const getBackup = (id: string) => api.get<Backup>(`/backups/${id}`).then(res => res.data);
export const createBackup = (data: { databaseId: string; storageId: string }) => api.post<Backup>('/backups', data).then(res => res.data);
export const deleteBackup = (id: string) => api.delete(`/backups/${id}`);
export const cancelBackup = (id: string) => api.post<Backup>(`/backups/${id}/cancel`).then(res => res.data);

// Restores
export const getRestores = (params?: { backupId?: string; status?: string }) =>
  api.get<{ restores: Restore[]; total: number }>('/restores', { params }).then(res => res.data);
export const getRestore = (id: string) => api.get<Restore>(`/restores/${id}`).then(res => res.data);
export const createRestore = (data: Partial<Restore>) => api.post<Restore>('/restores', data).then(res => res.data);
export const deleteRestore = (id: string) => api.delete(`/restores/${id}`);

// Schedules
export const getSchedules = (params?: { databaseId?: string; enabled?: boolean }) =>
  api.get<Schedule[]>('/schedules', { params }).then(res => res.data);
export const getSchedule = (id: string) => api.get<Schedule>(`/schedules/${id}`).then(res => res.data);
export const createSchedule = (data: Partial<Schedule>) => api.post<Schedule>('/schedules', data).then(res => res.data);
export const updateSchedule = (id: string, data: Partial<Schedule>) => api.put<Schedule>(`/schedules/${id}`, data).then(res => res.data);
export const deleteSchedule = (id: string) => api.delete(`/schedules/${id}`);
export const toggleSchedule = (id: string) => api.post<Schedule>(`/schedules/${id}/toggle`).then(res => res.data);
export const runSchedule = (id: string) => api.post<Backup>(`/schedules/${id}/run`).then(res => res.data);

// Settings
export interface ProfileData {
  name: string;
  email: string;
  organization: string;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SlackSettings {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
  username: string;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

export interface TelegramSettings {
  enabled: boolean;
  botToken: string;
  chatId: string;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

export interface NotificationSettings {
  slack: SlackSettings;
  telegram: TelegramSettings;
}

export interface AllSettings {
  profile: ProfileData;
  notifications: NotificationSettings;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  databases: Database[];
  storageTargets: StorageTarget[];
  schedules: Schedule[];
  settings: {
    profile: ProfileData | null;
    notifications: {
      slack: SlackSettings | null;
      telegram: TelegramSettings | null;
    };
  };
}

export const getSettings = () => api.get<AllSettings>('/settings').then(res => res.data);
export const updateProfile = (data: ProfileData) => api.put<ProfileData>('/settings/profile', data).then(res => res.data);
export const updatePassword = (data: PasswordData) => api.put<{ message: string }>('/settings/password', data).then(res => res.data);
export const getNotificationSettings = () => api.get<NotificationSettings>('/settings/notifications').then(res => res.data);
export const updateSlackSettings = (data: SlackSettings) => api.put<SlackSettings>('/settings/notifications/slack', data).then(res => res.data);
export const updateTelegramSettings = (data: TelegramSettings) => api.put<TelegramSettings>('/settings/notifications/telegram', data).then(res => res.data);
export const testSlackNotification = () => api.post<{ message: string }>('/settings/notifications/slack/test').then(res => res.data);
export const testTelegramNotification = () => api.post<{ message: string }>('/settings/notifications/telegram/test').then(res => res.data);
export const exportSettings = () => api.get<ExportData>('/settings/export').then(res => res.data);
export const importSettings = (data: ExportData) => api.post<{ message: string; results: any }>('/settings/import', data).then(res => res.data);

export default api;
