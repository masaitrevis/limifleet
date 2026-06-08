import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { Wrench, Plus, Search, ChevronLeft, ChevronRight, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const priorityColors: any = {
  LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

const statusColors: any = {
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

export default function MaintenancePage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data, isLoading } = useQuery(
    ['maintenance', page, statusFilter, priorityFilter],
    () => api.get(`/maintenance?page=${page}&limit=20&status=${statusFilter}&priority=${priorityFilter}`).then((res) => res.data),
    { keepPreviousData: true }
  );

  const { data: upcoming } = useQuery('maintenance-upcoming', () =>
    api.get('/maintenance/upcoming').then((res) => res.data)
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Maintenance</h1>
              <p className="text-slate-500 dark:text-slate-400">Schedule and track vehicle maintenance</p>
            </div>
            <Link href="/maintenance/new" className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors">
              <Plus className="h-4 w-4" /> Schedule Service
            </Link>
          </div>

          {upcoming && upcoming.count > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-800 dark:text-amber-400">{upcoming.count} maintenance tasks due in the next 7 days</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500">
              <option value="">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500">
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Scheduled</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {isLoading ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No maintenance records</td></tr>
                  ) : (
                    records.map((record: any) => (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{record.vehicle?.vehicleId}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{record.type}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{record.title}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{format(new Date(record.scheduledAt), 'MMM d, yyyy')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[record.priority] || ''}`}>{record.priority}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[record.status] || ''}`}>{record.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{record.cost ? `$${record.cost.toFixed(2)}` : '-'}</td>
                        <td className="px-4 py-3">
                          <Link href={`/maintenance/${record.id}`} className="text-sm text-brand-600 hover:text-brand-700">View</Link>
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
