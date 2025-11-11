import { useQuery } from '@tanstack/react-query';
import { getBackups, getDatabases, getSchedules, getRestores, getStorageTargets } from '@/lib/api';
import {
  Archive,
  Database,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  TrendingUp,
  Activity,
  PlayCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { BackupStatus } from '@chronostash/shared';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: databases } = useQuery({ queryKey: ['databases'], queryFn: getDatabases });
  const { data: backupsData } = useQuery({ queryKey: ['backups'], queryFn: () => getBackups() });
  const { data: schedules } = useQuery({ queryKey: ['schedules'], queryFn: () => getSchedules() });
  const { data: restoresData } = useQuery({ queryKey: ['restores'], queryFn: () => getRestores() });
  const { data: storageTargets } = useQuery({ queryKey: ['storage-targets'], queryFn: getStorageTargets });

  const backups = backupsData?.backups || [];
  const restores = restoresData?.restores || [];

  // Calculate statistics
  const stats = calculateStats(backups, restores, databases, schedules);
  const recentActivity = getRecentActivity(backups, restores);
  const upcomingSchedules = getUpcomingSchedules(schedules);
  const backupTrend = getBackupTrend(backups);
  const alerts = getAlerts(backups, schedules);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Overview of your backup infrastructure</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Attention Required</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200 space-y-1">
                {alerts.map((alert, idx) => (
                  <div key={idx}>{alert}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <HeroStatCard
          title="Total Backups"
          value={stats.totalBackups}
          change={stats.backupsChange}
          icon={Archive}
          color="blue"
          subtitle="All time"
        />
        <HeroStatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          change={stats.successRateChange}
          icon={TrendingUp}
          color="green"
          subtitle="Last 30 days"
        />
        <HeroStatCard
          title="Storage Used"
          value={stats.storageUsed}
          change={stats.storageChange}
          icon={HardDrive}
          color="purple"
          subtitle={`${stats.totalBackups} backups`}
        />
        <HeroStatCard
          title="Active Schedules"
          value={stats.activeSchedules}
          change={stats.schedulesChange}
          icon={Calendar}
          color="indigo"
          subtitle={`${schedules?.length || 0} total`}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <QuickStatCard
          label="Databases"
          value={databases?.length || 0}
          icon={Database}
          color="blue"
        />
        <QuickStatCard
          label="Completed Today"
          value={stats.completedToday}
          icon={CheckCircle}
          color="green"
        />
        <QuickStatCard
          label="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="blue"
        />
        <QuickStatCard
          label="Failed (24h)"
          value={stats.failed24h}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Backup Activity Trend */}
          <div className="glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Backup Activity</h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Last 7 days</p>
                </div>
                <Activity className="h-5 w-5 text-gray-500 dark:text-slate-400 dark:text-slate-500" />
              </div>
            </div>
            <div className="p-6">
              <BackupTrendChart data={backupTrend} />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Latest backups and restores</p>
              </div>
              <Link
                to="/backups"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center"
              >
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-700/50">
              {recentActivity.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                  <Activity className="h-12 w-12 mx-auto text-gray-500 dark:text-slate-400 mb-3" />
                  <p>No activity yet</p>
                  <p className="text-sm mt-1">Create your first backup to get started</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} databases={databases} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              <Link
                to="/backups"
                className="flex items-center px-4 py-3 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors border border-blue-100 dark:border-blue-800/50"
              >
                <PlayCircle className="h-5 w-5 mr-3" />
                <span className="font-medium">Create Backup</span>
              </Link>
              <Link
                to="/schedules"
                className="flex items-center px-4 py-3 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors border border-purple-100 dark:border-purple-800/50"
              >
                <Calendar className="h-5 w-5 mr-3" />
                <span className="font-medium">New Schedule</span>
              </Link>
              <Link
                to="/restores"
                className="flex items-center px-4 py-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors border border-green-100 dark:border-green-800/50"
              >
                <RotateCcw className="h-5 w-5 mr-3" />
                <span className="font-medium">Restore Backup</span>
              </Link>
            </div>
          </div>

          {/* Upcoming Scheduled Backups */}
          <div className="glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Backups</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-700/50">
              {upcomingSchedules.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">
                  <Calendar className="h-10 w-10 mx-auto text-gray-500 dark:text-slate-400 mb-2" />
                  <p className="text-sm">No scheduled backups</p>
                </div>
              ) : (
                upcomingSchedules.map((schedule: any) => (
                  <div key={schedule.id} className="px-6 py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{schedule.name}</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                          {schedule.nextRunAt
                            ? new Date(schedule.nextRunAt).toLocaleString()
                            : 'Not scheduled'}
                        </p>
                      </div>
                      {schedule.enabled && (
                        <Zap className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Storage Breakdown */}
          <div className="glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Storage Targets</h2>
            </div>
            <div className="p-4 space-y-3">
              {storageTargets?.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-slate-400">
                  <HardDrive className="h-10 w-10 mx-auto text-gray-500 dark:text-slate-400 mb-2" />
                  <p className="text-sm">No storage configured</p>
                </div>
              ) : (
                storageTargets?.map((storage: any) => (
                  <div key={storage.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600">
                        <HardDrive className="h-4 w-4 text-gray-600 dark:text-slate-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{storage.name}</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{storage.type}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Functions

function calculateStats(backups: any[], _restores: any[], _databases: any, schedules: any) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Total backups
  const totalBackups = backups.length;
  const backupsYesterday = backups.filter(b => new Date(b.createdAt) < today).length;
  const backupsChange = totalBackups - backupsYesterday;

  // Success rate (last 30 days)
  const recentBackups = backups.filter(b => new Date(b.createdAt) >= thirtyDaysAgo);
  const completedRecent = recentBackups.filter(b => b.status === BackupStatus.COMPLETED).length;
  const successRate = recentBackups.length > 0
    ? Math.round((completedRecent / recentBackups.length) * 100)
    : 100;

  // Storage used
  const totalSize = backups
    .filter(b => b.size)
    .reduce((sum, b) => sum + Number(b.size), 0);
  const storageUsed = formatBytes(totalSize);

  // Active schedules
  const activeSchedules = schedules?.filter((s: any) => s.enabled).length || 0;

  // Quick stats
  const completedToday = backups.filter(
    b => b.status === BackupStatus.COMPLETED && new Date(b.createdAt) >= today
  ).length;
  const inProgress = backups.filter(b => b.status === BackupStatus.IN_PROGRESS).length;
  const failed24h = backups.filter(
    b => b.status === BackupStatus.FAILED && new Date(b.createdAt) >= twentyFourHoursAgo
  ).length;

  return {
    totalBackups,
    backupsChange,
    successRate,
    successRateChange: 0, // Would need historical data
    storageUsed,
    storageChange: '+12%', // Would need historical data
    activeSchedules,
    schedulesChange: 0,
    completedToday,
    inProgress,
    failed24h,
  };
}

function getRecentActivity(backups: any[], restores: any[]) {
  const activities = [
    ...backups.map(b => ({ ...b, type: 'backup' as const })),
    ...restores.map(r => ({ ...r, type: 'restore' as const })),
  ];

  return activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
}

function getUpcomingSchedules(schedules: any) {
  if (!schedules) return [];

  return schedules
    .filter((s: any) => s.enabled && s.nextRunAt)
    .sort((a: any, b: any) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime())
    .slice(0, 5);
}

function getBackupTrend(backups: any[]) {
  const days = 7;
  const trend = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayBackups = backups.filter(b => {
      const createdAt = new Date(b.createdAt);
      return createdAt >= date && createdAt < nextDate;
    });

    trend.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed: dayBackups.filter(b => b.status === BackupStatus.COMPLETED).length,
      failed: dayBackups.filter(b => b.status === BackupStatus.FAILED).length,
      total: dayBackups.length,
    });
  }

  return trend;
}

function getAlerts(backups: any[], schedules: any) {
  const alerts = [];
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Failed backups in last 24h
  const recentFailures = backups.filter(
    b => b.status === BackupStatus.FAILED && new Date(b.createdAt) >= twentyFourHoursAgo
  ).length;
  if (recentFailures > 0) {
    alerts.push(`${recentFailures} backup${recentFailures > 1 ? 's' : ''} failed in the last 24 hours`);
  }

  // Disabled schedules
  const disabledSchedules = schedules?.filter((s: any) => !s.enabled).length || 0;
  if (disabledSchedules > 2) {
    alerts.push(`${disabledSchedules} schedules are currently disabled`);
  }

  // In progress for too long (>1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const stuckBackups = backups.filter(
    b => b.status === BackupStatus.IN_PROGRESS && new Date(b.createdAt) < oneHourAgo
  ).length;
  if (stuckBackups > 0) {
    alerts.push(`${stuckBackups} backup${stuckBackups > 1 ? 's' : ''} may be stuck (running >1 hour)`);
  }

  return alerts;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Components

interface HeroStatCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'indigo';
  subtitle: string;
}

function HeroStatCard({ title, value, change, icon: Icon, color, subtitle }: HeroStatCardProps) {
  const colors = {
    blue: 'from-blue-500 to-blue-600 dark:from-blue-500 dark:to-purple-600 dark:shadow-blue-500/20',
    green: 'from-green-500 to-green-600 dark:from-green-500 dark:to-emerald-600 dark:shadow-green-500/20',
    purple: 'from-purple-500 to-purple-600 dark:from-purple-500 dark:to-pink-600 dark:shadow-purple-500/20',
    indigo: 'from-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-blue-600 dark:shadow-indigo-500/20',
  };

  const changeColor = typeof change === 'number' && change >= 0 ? 'text-green-600 dark:text-green-400 dark:text-green-400' : 'text-red-600 dark:text-red-400 dark:text-red-400';

  return (
    <div className="group glass-light dark:glass rounded-xl p-6
                    hover:glass-hover dark:hover:glow
                    transition-all duration-300 hover:scale-[1.02]
                    border border-gray-200 dark:border-slate-700/50
                    cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {change !== undefined && change !== 0 && (
          <span className={`text-sm font-medium ${changeColor}`}>
            {typeof change === 'number' && change > 0 && '+'}
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{title}</p>
        <p className="text-3xl font-bold mt-1
                      bg-gradient-to-br from-gray-900 to-gray-700
                      dark:from-white dark:to-slate-200
                      bg-clip-text text-transparent">
          {value}
        </p>
        <p className="text-xs text-gray-600 dark:text-slate-400 dark:text-slate-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

interface QuickStatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red';
}

function QuickStatCard({ label, value, icon: Icon, color }: QuickStatCardProps) {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20',
    green: 'text-green-600 dark:text-green-400 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20',
    red: 'text-red-600 dark:text-red-400 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20',
  };

  return (
    <div className="glass-light dark:glass rounded-lg p-4
                    border border-gray-200 dark:border-slate-700/50
                    hover:scale-105 transition-transform duration-300">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg border ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-slate-400">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function BackupTrendChart({ data }: { data: any[] }) {
  const maxValue = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded mr-2" />
          <span className="text-gray-600 dark:text-slate-400">Completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-rose-500 rounded mr-2" />
          <span className="text-gray-600 dark:text-slate-400">Failed</span>
        </div>
      </div>
      <div className="flex items-end justify-between h-48 space-x-2">
        {data.map((day, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col justify-end h-40 space-y-1">
              {day.completed > 0 && (
                <div
                  className="w-full rounded-t overflow-hidden
                             bg-gradient-to-t from-green-600 to-green-400
                             dark:from-green-500 dark:to-emerald-400
                             shadow-sm dark:shadow-green-500/30
                             hover:scale-105 hover:shadow-md dark:hover:shadow-green-500/40
                             transition-all duration-300 cursor-pointer"
                  style={{ height: `${(day.completed / maxValue) * 100}%` }}
                  title={`${day.completed} completed`}
                />
              )}
              {day.failed > 0 && (
                <div
                  className="w-full rounded-t overflow-hidden
                             bg-gradient-to-t from-red-600 to-red-400
                             dark:from-red-500 dark:to-rose-400
                             shadow-sm dark:shadow-red-500/20
                             hover:scale-105 hover:shadow-md dark:hover:shadow-red-500/30
                             transition-all duration-300 cursor-pointer"
                  style={{ height: `${(day.failed / maxValue) * 100}%` }}
                  title={`${day.failed} failed`}
                />
              )}
              {day.total === 0 && <div className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded" />}
            </div>
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-2">{day.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ActivityItemProps {
  activity: any;
  databases: any;
}

function ActivityItem({ activity, databases }: ActivityItemProps) {
  const isBackup = activity.type === 'backup';
  const database = databases?.find((d: any) => d.id === activity.databaseId || d.id === activity.backup?.databaseId);

  const statusBadges = {
    COMPLETED: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm dark:shadow-green-500/20',
    FAILED: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm dark:shadow-red-500/20',
    IN_PROGRESS: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm dark:shadow-blue-500/20 animate-glow-pulse',
    PENDING: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600',
  };

  return (
    <div className="px-6 py-4
                    hover:bg-gray-50/50 dark:hover:bg-slate-800/30
                    border-b border-gray-200 dark:border-slate-700/50
                    transition-all duration-300 cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-lg border group-hover:scale-110 transition-transform ${
            isBackup
              ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20'
              : 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20'
          }`}>
            {isBackup ? (
              <Archive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <RotateCcw className="h-4 w-4 text-green-600 dark:text-green-400 dark:text-green-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isBackup ? 'Backup' : 'Restore'}
              </p>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadges[activity.status as keyof typeof statusBadges]}`}>
                {activity.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
              {database ? `${database.name} (${database.engine})` : activity.id.slice(0, 8)}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600 dark:text-slate-400 dark:text-slate-400">
              <span>{getRelativeTime(activity.createdAt)}</span>
              {activity.duration && (
                <span>{activity.duration}s</span>
              )}
              {activity.size && (
                <span>{formatBytes(Number(activity.size))}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
