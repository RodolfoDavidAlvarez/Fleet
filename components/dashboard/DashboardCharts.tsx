'use client'

import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { DashboardStats } from '@/types'

interface DashboardChartsProps {
  stats: DashboardStats
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label, prefix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg text-sm">
        <p className="font-semibold">{label}</p>
        <p className="text-[var(--text-secondary)]">
          {payload[0].name}: {prefix}{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  const vehicleStatusData = Object.entries(stats.vehiclesByStatus || {}).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  })).filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
      {/* Maintenance Cost Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Maintenance Costs</h3>
          <span className="text-xs text-muted bg-[var(--bg-tertiary)] px-2 py-1 rounded">Last 6 Months</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.maintenanceCostTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return date.toLocaleDateString('en-US', { month: 'short' });
                }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickFormatter={(value) => `$${value/1000}k`}
              />
              <Tooltip content={<CustomTooltip prefix="$" />} />
              <Bar 
                dataKey="cost" 
                name="Total Cost" 
                fill="var(--primary-500)" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Booking Trends Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Booking Volume</h3>
          <span className="text-xs text-muted bg-[var(--bg-tertiary)] px-2 py-1 rounded">Last 6 Months</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChartComponent data={stats.bookingTrend} />
          </ResponsiveContainer>
        </div>
      </div>

       {/* Fleet Status Distribution */}
       {vehicleStatusData.length > 0 && (
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Fleet Composition</h3>
            <span className="text-xs text-muted bg-[var(--bg-tertiary)] px-2 py-1 rounded">Current Status</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
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
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {vehicleStatusData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{entry.value}</span>
                    <span className="text-xs text-muted">vehicles</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Separate component for AreaChart to avoid import issues with Recharts in the same file sometimes
// actually standard LineChart is fine, but Area looks nicer for trends
import { AreaChart, Area } from 'recharts'

function AreaChartComponent({ data }: { data: any[] }) {
  return (
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.1}/>
          <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
      <XAxis 
        dataKey="date" 
        axisLine={false}
        tickLine={false}
        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
        tickFormatter={(value) => {
          const [year, month] = value.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleDateString('en-US', { month: 'short' });
        }}
      />
      <YAxis 
        axisLine={false}
        tickLine={false}
        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
      />
      <Tooltip content={<CustomTooltip />} />
      <Area 
        type="monotone" 
        dataKey="count" 
        name="Bookings"
        stroke="var(--primary-500)" 
        strokeWidth={2}
        fillOpacity={1} 
        fill="url(#colorCount)" 
      />
    </AreaChart>
  )
}
