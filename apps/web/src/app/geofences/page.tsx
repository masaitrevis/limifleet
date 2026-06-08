import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { MapPin, Plus, Search, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const geofenceTypeColors: any = {
  INCLUSION: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  EXCLUSION: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  SPEED_LIMIT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  IDLE_ZONE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
};

export default function GeofencesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery(
    ['geofences', page],
    () => api.get(`/geofences?page=${page}&limit=20`).then((res) => res.data),
    { keepPreviousData: true }
  );

  const geofences = data?.geofences || [];
  const pagination = data?.pagination;

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this geofence?')) return;
    try {
      await api.delete(`/geofences/${id}`);
      toast.success('Geofence deactivated');
      refetch();
    } catch (error) {
      toast.error('Failed to deactivate geofence');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Geofences</h1>
              <p className="text-slate-500 dark:text-slate-400">Manage location-based zones and rules</p>
            </div>
            <Link
              href="/geofences/new"
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Geofence
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Radius</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Vehicles</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : geofences.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No geofences found</td></tr>
                  ) : (
                    geofences.map((geo: any) => (
                      <tr key={geo.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3">
                          <Link href={`/geofences/${geo.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                            {geo.name}
                          </Link>
                          <p className="text-xs text-slate-400">{geo.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${geofenceTypeColors[geo.type] || ''}`}>
                            {geo.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                          {geo.radius ? `${geo.radius} m` : 'Custom polygon'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                          {geo.vehicles?.length || 0} assigned
                        </td>
                        <td className="px-4 py-3">
                          {geo.isActive ? (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-600">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {new Date(geo.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link href={`/geofences/${geo.id}`} className="text-sm text-brand-600 hover:text-brand-700">Edit</Link>
                            <button onClick={() => handleDelete(geo.id)} className="text-sm text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
