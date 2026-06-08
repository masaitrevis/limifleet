import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const severityConfig: any = {
  LOW: { icon: Info, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  MEDIUM: { icon: AlertTriangle, color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
  HIGH: { icon: AlertTriangle, color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
  CRITICAL: { icon: XCircle, color: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
};

export default function AlertsPage() {
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const { data, isLoading, refetch } = useQuery(
    ['alerts', page, severityFilter, typeFilter, showResolved],
    () => api.get(`/alerts?page=${page}&limit=20&severity=${severityFilter}&type=${typeFilter}&isResolved=${showResolved}`).then((res) => res.data),
    { keepPreviousData: true }
  );

  const { data: summary } = useQuery('alerts-summary', () => api.get('/alerts/summary').then((res) => res.data));

  const handleResolve = async (id: string) => {
    try {
      await api.patch(`/alerts/${id}/resolve`);
      toast.success('Alert resolved');
      refetch();
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const handleRead = async (id: string) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      refetch();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const alerts = data?.alerts || [];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Alerts</h1>
              <p className="text-slate-500 dark:text-slate-400">Monitor and manage fleet alerts</p>
            </div>
            {summary && (
              <div className="flex items-center gap-4">
                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-500">Unread: </span>
                  <span className="text-sm font-bold text-red-600">{summary.unreadCount}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-500">Today: </span>
                  <span className="text-sm font-bold text-orange-600">{summary.todayCount}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
            >
              <option value="">All Severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
            >
              <option value="">All Types</option>
              <option value="OVER_SPEEDING">Over Speeding</option>
              <option value="GEO_FENCE_VIOLATION">Geofence Violation</option>
              <option value="MAINTENANCE_DUE">Maintenance Due</option>
              <option value="FUEL_ANOMALY">Fuel Anomaly</option>
              <option value="VEHICLE_OFFLINE">Vehicle Offline</option>
              <option value="DRIVER_BEHAVIOR">Driver Behavior</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => { setShowResolved(e.target.checked); setPage(1); }}
                className="rounded border-slate-300"
              />
              Show Resolved
            </label>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : alerts.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No alerts</td></tr>
                  ) : (
                    alerts.map((alert: any) => {
                      const config = severityConfig[alert.severity] || severityConfig.LOW;
                      const Icon = config.icon;
                      return (
                        <tr key={alert.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${!alert.isRead ? 'bg-blue-50/50 dark:bg-blue-900/5' : ''}`}>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{alert.type}</td>
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              <Icon className="h-3 w-3" />
                              {alert.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{alert.title}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{alert.vehicle?.vehicleId || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{new Date(alert.occurredAt).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {alert.isResolved ? (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="h-3 w-3" /> Resolved
                              </span>
                            ) : (
                              <span className="text-xs text-orange-600">Open</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {!alert.isRead && (
                                <button
                                  onClick={() => handleRead(alert.id)}
                                  className="text-xs text-brand-600 hover:text-brand-700"
                                >
                                  Mark Read
                                </button>
                              )}
                              {!alert.isResolved && (
                                <button
                                  onClick={() => handleResolve(alert.id)}
                                  className="text-xs text-green-600 hover:text-green-700"
                                >
                                  Resolve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
