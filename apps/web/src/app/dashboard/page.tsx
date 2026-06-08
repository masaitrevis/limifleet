'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Sidebar from '@/components/sidebar';
import DashboardStats from '@/components/dashboard/stats';
import DashboardCharts from '@/components/dashboard/charts';
import RecentTrips from '@/components/dashboard/recent-trips';
import RecentAlerts from '@/components/dashboard/recent-alerts';
import { useQuery } from 'react-query';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery(
    'dashboard',
    () => api.get('/dashboard').then((res) => res.data),
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">Overview of your fleet</p>
          </div>

          <DashboardStats data={data?.summary} />
          <DashboardCharts data={data} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentTrips trips={data?.recentTrips} />
            <RecentAlerts alerts={data?.recentAlerts} />
          </div>
        </div>
      </main>
    </div>
  );
}
