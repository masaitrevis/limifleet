import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface RecentTripsProps {
  trips: any[];
}

export default function RecentTrips({ trips }: RecentTripsProps) {
  if (!trips?.length) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Trips</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">No trips yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Trips</h3>
      <div className="space-y-3">
        {trips.map((trip) => (
          <div key={trip.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${trip.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {trip.status === 'COMPLETED' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{trip.vehicle?.vehicleId}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {trip.driver?.firstName} {trip.driver?.lastName} • {trip.distanceKm?.toFixed(1)} km
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(trip.startTime), { addSuffix: true })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
