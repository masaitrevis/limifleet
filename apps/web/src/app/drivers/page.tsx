import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { Users, Plus, Search, ChevronLeft, ChevronRight, Star, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const driverStatusColors: any = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  OFF_DUTY: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  ON_LEAVE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
};

export default function DriversPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery(
    ['drivers', page, search, statusFilter],
    () => api.get(`/drivers?page=${page}&limit=20&search=${search}&status=${statusFilter}`).then((res) => res.data),
    { keepPreviousData: true }
  );

  const drivers = data?.drivers || [];
  const pagination = data?.pagination;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Drivers</h1>
              <p className="text-slate-500 dark:text-slate-400">Manage your drivers</p>
            </div>
            <Link
              href="/drivers/new"
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Driver
            </Link>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search drivers..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="OFF_DUTY">Off Duty</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Driver ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">License</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Safety Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {isLoading ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : drivers.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No drivers found</td></tr>
                  ) : (
                    drivers.map((driver: any) => (
                      <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3">
                          <Link href={`/drivers/${driver.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                            {driver.driverId}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{driver.firstName} {driver.lastName}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{driver.phone}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{driver.licenseNumber}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${driverStatusColors[driver.status] || ''}`}>
                            {driver.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Star className={`h-4 w-4 ${driver.safetyScore >= 80 ? 'text-yellow-500' : 'text-slate-300'}`} />
                            <span className={`text-sm font-medium ${driver.safetyScore < 60 ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`}>
                              {driver.safetyScore}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                          {driver.assignedVehicle?.vehicleId || 'Unassigned'}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/drivers/${driver.id}`} className="text-sm text-brand-600 hover:text-brand-700">View</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-sm text-slate-500">Page {page} of {pagination.pages}</span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50"
                >
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
