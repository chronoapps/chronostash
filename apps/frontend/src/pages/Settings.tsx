import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Download } from 'lucide-react';
import AccountSettings from '@/components/settings/AccountSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import ImportExportSettings from '@/components/settings/ImportExportSettings';

type Tab = 'account' | 'notifications' | 'import-export';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('account');

  const tabs = [
    { id: 'account' as Tab, label: 'Account', icon: User },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
    { id: 'import-export' as Tab, label: 'Import/Export', icon: Download },
  ];

  return (
    <div>
      <div className="flex items-center mb-6">
        <SettingsIcon className="h-8 w-8 text-gray-700 dark:text-slate-300 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-slate-600'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="glass-light dark:glass rounded-xl border border-gray-200 dark:border-slate-700/50 p-6">
        {activeTab === 'account' && <AccountSettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'import-export' && <ImportExportSettings />}
      </div>
    </div>
  );
}
