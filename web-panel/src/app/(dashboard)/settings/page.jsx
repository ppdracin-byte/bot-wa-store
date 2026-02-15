'use client';

import { useState } from 'react';
import { Save, Shield, Bell, Database } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    minDeposit: 10000,
    maxDeposit: 10000000,
    autoProcess: true,
    notifications: true,
    webhookUrl: '',
    maintenanceMode: false
  });

  const handleSave = (e) => {
    e.preventDefault();
    alert('Settings saved!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          {activeTab === 'general' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Deposit
                  </label>
                  <input
                    type="number"
                    value={settings.minDeposit}
                    onChange={(e) => setSettings({...settings, minDeposit: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Deposit
                  </label>
                  <input
                    type="number"
                    value={settings.maxDeposit}
                    onChange={(e) => setSettings({...settings, maxDeposit: e.target.value})}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings({...settings, webhookUrl: e.target.value})}
                  className="input"
                  placeholder="https://your-domain.com/webhook"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoProcess"
                  checked={settings.autoProcess}
                  onChange={(e) => setSettings({...settings, autoProcess: e.target.checked})}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="autoProcess" className="text-sm font-medium text-gray-700">
                  Enable auto-processing for orders
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="maintenance"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="maintenance" className="text-sm font-medium text-gray-700">
                  Maintenance mode
                </label>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Change Admin Password
                </label>
                <input
                  type="password"
                  placeholder="Current password"
                  className="input mb-2"
                />
                <input
                  type="password"
                  placeholder="New password"
                  className="input mb-2"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="input"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="notifications" className="text-sm font-medium text-gray-700">
                  Enable WhatsApp notifications for customers
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button type="submit" className="btn-primary flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
