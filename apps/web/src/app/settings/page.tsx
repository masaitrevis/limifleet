import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { api } from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { Settings, Save, Building2, Bell, Shield, Gauge, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { data: company, isLoading } = useQuery('company-settings', () =>
    api.get('/settings').then((res) => res.data)
  );

  const [settings, setSettings] = useState({
    timezone: 'UTC',
    distanceUnit: 'km',
    fuelUnit: 'L',
    temperatureUnit: 'celsius',
    speedLimit: 80,
    maxIdleTime: 30,
    maintenanceAlertDays: 7,
    overSpeedThreshold: 10,
    geofenceCheckInterval: 60,
    enableFuelAnomalyDetection: true,
    enableMaintenancePrediction: true,
    enableDriverBehaviorAnalysis: true,
    enableRealTimeAlerts: true,
    enableEmailNotifications: false,
    enablePushNotifications: false,
    enableSmsNotifications: false,
  });

  const updateMutation = useMutation(
    (data: any) => api.patch('/settings', data),
    {
      onSuccess: () => toast.success('Settings updated successfully'),
      onError: () => toast.error('Failed to update settings'),
    }
  );

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
              <p className="text-slate-500 dark:text-slate-400">Configure your fleet management preferences</p>
            </div>
            <button
              onClick={handleSave}
              disabled={updateMutation.isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <Building2 className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Company Settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Distance Unit</label>
                <select
                  value={settings.distanceUnit}
                  onChange={(e) => setSettings({ ...settings, distanceUnit: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="km">Kilometers (km)</option>
                  <option value="mi">Miles (mi)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fuel Unit</label>
                <select
                  value={settings.fuelUnit}
                  onChange={(e) => setSettings({ ...settings, fuelUnit: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="L">Liters (L)</option>
                  <option value="gal">Gallons (gal)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Temperature Unit</label>
                <select
                  value={settings.temperatureUnit}
                  onChange={(e) => setSettings({ ...settings, temperatureUnit: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <Gauge className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Fleet Rules</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Speed Limit (km/h)</label>
                <input
                  type="number"
                  value={settings.speedLimit}
                  onChange={(e) => setSettings({ ...settings, speedLimit: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Idle Time (min)</label>
                <input
                  type="number"
                  value={settings.maxIdleTime}
                  onChange={(e) => setSettings({ ...settings, maxIdleTime: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Maintenance Alert Days</label>
                <input
                  type="number"
                  value={settings.maintenanceAlertDays}
                  onChange={(e) => setSettings({ ...settings, maintenanceAlertDays: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Over-Speed Threshold (%)</label>
                <input
                  type="number"
                  value={settings.overSpeedThreshold}
                  onChange={(e) => setSettings({ ...settings, overSpeedThreshold: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <Truck className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Features</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'enableFuelAnomalyDetection', label: 'Fuel Anomaly Detection', desc: 'Automatically flag unusual fuel consumption patterns' },
                { key: 'enableMaintenancePrediction', label: 'Maintenance Prediction', desc: 'AI-powered maintenance scheduling recommendations' },
                { key: 'enableDriverBehaviorAnalysis', label: 'Driver Behavior Analysis', desc: 'Monitor and score driver safety patterns' },
                { key: 'enableRealTimeAlerts', label: 'Real-time Alerts', desc: 'Push instant notifications for critical events' },
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{feature.label}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(settings as any)[feature.key]}
                      onChange={(e) => setSettings({ ...settings, [feature.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <Bell className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'enableEmailNotifications', label: 'Email Notifications', desc: 'Send alerts via email' },
                { key: 'enablePushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                { key: 'enableSmsNotifications', label: 'SMS Notifications', desc: 'Send critical alerts via SMS' },
              ].map((notification) => (
                <div key={notification.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{notification.label}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{notification.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(settings as any)[notification.key]}
                      onChange={(e) => setSettings({ ...settings, [notification.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
