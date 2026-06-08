import { Truck, Activity, Users, Route, Fuel, AlertTriangle } from 'lucide-react';

interface StatsProps {
  data: {
    totalVehicles: number;
    activeVehicles: number;
    offlineVehicles: number;
    driversOnline: number;
    todayTrips: number;
    totalDistanceToday: number;
    totalFuelToday: number;
    maintenanceDue: number;
    maintenanceOverdue: number;
    fuelAnomalies: number;
    unreadAlerts: number;
  };
}

const stats = [
  { name: 'Total Vehicles', key: 'totalVehicles', icon: Truck, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  { name: 'Active Now', key: 'activeVehicles', icon: Activity, color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  { name: 'Drivers Online', key: 'driversOnline', icon: Users, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
  { name: 'Today\'s Trips', key: 'todayTrips', icon: Route, color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
  { name: 'Distance (km)', key: 'totalDistanceToday', icon: Route, color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400' },
  { name: 'Fuel Used (L)', key: 'totalFuelToday', icon: Fuel, color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
  { name: 'Maintenance Due', key: 'maintenanceDue', icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  { name: 'Alerts', key: 'unreadAlerts', icon: AlertTriangle, color: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
];

export default function DashboardStats({ data }: StatsProps) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const value = data[stat.key as keyof typeof data] || 0;
        return (
          <div key={stat.name} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
