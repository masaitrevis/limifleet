import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { Truck, Plus, Search, Filter, ChevronLeft, ChevronRight, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const vehicleStatusColors: any = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  RETIRED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

export default function VehiclesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery(
    ['vehicles', page, search, statusFilter],
    () => api.get(`/vehicles?page=${page}&limit=20&search=${search}&status=${statusFilter}`).then((res) => res.data),
    { keepPreviousData: true }
  );

  const vehicles = data?.vehicles || [];
  const pagination = data?.pagination;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vehicles</h1>
              <p className="text-slate-500 dark:text-slate-400">Manage your fleet</p>
            </div>
            <Link
              href="/vehicles/new"
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Link>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
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
              <option value="INACTIVE">Inactive</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Vehicle ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Registration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Model</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {isLoading ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : vehicles.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No vehicles found</td></tr>
                  ) : (
                    vehicles.map((vehicle: any) => (
                      <tr key={vehicle.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3">
                          <Link href={`/vehicles/${vehicle.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                            {vehicle.vehicleId}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{vehicle.registrationNumber}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{vehicle.type}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{vehicle.manufacturer} {vehicle.model}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicleStatusColors[vehicle.status] || ''}`}>
                            {vehicle.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {vehicle.assignedDriver ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-400" />
                              <span className="text-sm text-slate-600 dark:text-slate-300">{vehicle.assignedDriver.firstName} {vehicle.assignedDriver.lastName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {vehicle.lastLocation ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-green-500" />
                              <span className="text-xs text-slate-500">{vehicle.lastLocation.ignition ? 'Running' : 'Stopped'}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No data</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/vehicles/${vehicle.id}`} className="text-sm text-brand-600 hover:text-brand-700">
                            View
                          </Link>
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
                <span className="text-sm text-slate-500">
                  Page {page} of {pagination.pages}
                </span>
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
