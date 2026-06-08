import { useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { FileText, Download, BarChart3, Fuel, Truck, Wrench, Route } from 'lucide-react';
import toast from 'react-hot-toast';

const reportTypes = [
  { id: 'vehicles', name: 'Vehicle Report', icon: Truck, description: 'Complete vehicle inventory and status' },
  { id: 'trips', name: 'Trip Report', icon: Route, description: 'Trip history and analytics' },
  { id: 'fuel', name: 'Fuel Report', icon: Fuel, description: 'Fuel consumption and costs' },
  { id: 'maintenance', name: 'Maintenance Report', icon: Wrench, description: 'Maintenance history and costs' },
];

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [format, setFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  const generateReport = async (type: string) => {
    setLoading(type);
    try {
      const response = await api.get(`/reports/${type}?days=${days}&format=${format}`, {
        responseType: format === 'pdf' ? 'blob' : 'json',
      });

      if (format === 'csv' || format === 'pdf') {
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`${type} report downloaded`);
      } else {
        toast.success(`${type} report generated`);
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
            <p className="text-slate-500 dark:text-slate-400">Generate and export fleet reports</p>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Period</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <div key={report.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                        <Icon className="h-6 w-6 text-brand-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{report.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{report.description}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => generateReport(report.id)}
                    disabled={loading === report.id}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {loading === report.id ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
