import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { Fuel, Plus, Search, ChevronLeft, ChevronRight, AlertTriangle, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function FuelPage() {
  const [page, setPage] = useState(1);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, refetch } = useQuery(
    ['fuel', page, vehicleFilter, fromDate, toDate],
    () => api.get(`/fuel?page=${page}&limit=20&vehicleId=${vehicleFilter}&from=${fromDate}&to=${toDate}`).then((res) => res.data),
    { keepPreviousData: true }
  );

  const { data: analytics } = useQuery('fuel-analytics', () =>
    api.get('/fuel/analytics/efficiency').then((res) => res.data)
  );

  const records = data?.records || [];
  const pagination = data?.pagination;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fuel Management</h1>
              <p className="text-slate-500 dark:text-slate-400">Track fuel consumption and detect anomalies</p>
            </div>
            <Link
              href="/fuel/new"
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Record
            </Link>
          </div>

          {analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500">Total Fuel (30d)</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.totalFuel?.toFixed(1)} L</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500">Total Cost</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">${analytics.totalCost?.toFixed(2)}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500">Records</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.recordCount}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500">Anomalies</p>
                <p className="text-2xl font-bold text-red-600">{analytics.anomalies}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <input
              type="text"
              placeholder="Vehicle ID..."
              value={vehicleFilter}
              onChange={(e) => { setVehicleFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Odometer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Station</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No records found</td></tr>
                  ) : (
                    records.map((record: any) => (
                      <tr key={record.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${record.isAnomaly ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{record.vehicle?.vehicleId}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{record.amountL.toFixed(1)} L</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">${record.cost?.toFixed(2) || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{record.odometerKm.toFixed(1)} km</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{record.station || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{format(new Date(record.recordedAt), 'MMM d, yyyy')}</td>
                        <td className="px-4 py-3">
                          {record.isAnomaly ? (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3" />
                              {record.anomalyReason}
                            </span>
                          ) : (
                            <span className="text-xs text-green-600">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-sm text-slate-500">Page {page} of {pagination.pages}</span>
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
