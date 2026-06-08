import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface RecentAlertsProps {
  alerts: any[];
}

const severityIcons = {
  LOW: Info,
  MEDIUM: AlertTriangle,
  HIGH: AlertTriangle,
  CRITICAL: XCircle,
};

const severityColors = {
  LOW: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  MEDIUM: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  HIGH: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  CRITICAL: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

export default function RecentAlerts({ alerts }: RecentAlertsProps) {
  if (!alerts?.length) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Alerts</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">No alerts</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = severityIcons[alert.severity as keyof typeof severityIcons] || Info;
          const colorClass = severityColors[alert.severity as keyof typeof severityColors] || severityColors.LOW;
          
          return (
            <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{alert.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {alert.vehicle?.vehicleId} • {alert.type}
                </p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                {formatDistanceToNow(new Date(alert.occurredAt), { addSuffix: true })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
