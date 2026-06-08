import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ChartsProps {
  data: any;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DashboardCharts({ data }: ChartsProps) {
  if (!data) return null;

  const vehicleStatusData = Object.entries(data.vehicleStatusBreakdown || {}).map(([name, value]) => ({
    name,
    value: Number(value)
  }));

  const driverStatusData = Object.entries(data.driverStatusBreakdown || {}).map(([name, value]) => ({
    name,
    value: Number(value)
  }));

  const fleetScore = data.fleetHealthScore || 100;
  const scoreColor = fleetScore >= 80 ? '#10b981' : fleetScore >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Vehicle Status</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={vehicleStatusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {vehicleStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Driver Status</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={driverStatusData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Fleet Health Score</h3>
        <div className="flex items-center justify-center h-[200px]">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="#e2e8f0" strokeWidth="12" fill="none" />
              <circle
                cx="80" cy="80" r="70"
                stroke={scoreColor}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${fleetScore * 4.4} 440`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: scoreColor }}>{fleetScore}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
