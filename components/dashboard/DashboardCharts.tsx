"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardStats } from "@/types";

interface DashboardChartsProps {
  stats: DashboardStats;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];
const URGENCY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#10b981",
};

const formatMonthLabel = (value: string) => {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return value;
  const [year, month] = value.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const formatLabel = (value?: string | null, fallback = "Unknown") =>
  value ? value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : fallback;

const CustomTooltip = ({ active, payload, label, prefix = "" }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded shadow-lg text-sm">
      <p className="font-semibold mb-1">{formatMonthLabel(label) || label}</p>
      {payload.map((item: any) => (
        <p key={item.name} className="flex items-center gap-2 text-[var(--text-secondary)]">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: item.color || "var(--primary-500)" }} />
          <span>{item.name}:</span>
          <span className="font-semibold text-[var(--text-primary)]">
            {prefix}
            {item.value?.toLocaleString?.() ?? item.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  const vehicleStatusData = Object.entries(stats.vehiclesByStatus || {})
    .map(([name, value]) => ({
      name: formatLabel(name),
      value,
    }))
    .filter((item) => item.value > 0);

  const jobPipelineData = (stats.jobStatusBreakdown || []).map((entry) => ({
    name: formatLabel(entry.status),
    count: entry.count,
  }));

  const jobPriorityData = (stats.jobPriorityBreakdown || []).map((entry) => ({
    name: formatLabel(entry.priority),
    count: entry.count,
  }));

  const repairUrgencyData = (stats.repairUrgencyBreakdown || []).map((entry) => ({
    raw: entry.urgency,
    name: formatLabel(entry.urgency),
    count: entry.count,
  }));

  const departmentData = (stats.departmentVehicleBreakdown || []).map((entry) => ({
    name: formatLabel(entry.department, "No Department"),
    count: entry.count,
  }));

  const costDrivers = stats.topVehiclesByMaintenanceCost || [];
  const bookingTotals = stats.bookingTrend?.reduce(
    (acc, item) => {
      acc.total += item.count || 0;
      acc.completed += item.completed || 0;
      return acc;
    },
    { total: 0, completed: 0 }
  ) || { total: 0, completed: 0 };

  const bookingCompletionRate = bookingTotals.total > 0 ? Math.round((bookingTotals.completed / bookingTotals.total) * 100) : 0;
  const avgLeadTime = Math.round((stats.avgBookingLeadTimeDays || 0) * 10) / 10;
  const avgMaintenancePerJob = stats.completedJobs > 0 ? Math.round((stats.totalMaintenanceCost / stats.completedJobs) * 10) / 10 : 0;
  const activeJobTotal = jobPipelineData.reduce((sum, job) => sum + job.count, 0);
  const outstandingRepairs = repairUrgencyData.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
      <div className="xl:col-span-2 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Maintenance Cost */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Maintenance Costs</h3>
                <p className="text-xs text-muted">Last 6 months of completed jobs</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                  Avg / job <span className="font-semibold text-[var(--text-primary)]">${avgMaintenancePerJob.toLocaleString()}</span>
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[var(--primary-50)] text-[var(--primary-700)]">
                  {stats.completedJobs} completed
                </span>
              </div>
            </div>
            {stats.maintenanceCostTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted text-sm">No maintenance data yet</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.maintenanceCostTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                      tickFormatter={formatMonthLabel}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip prefix="$" />} />
                    <Bar dataKey="cost" name="Total Cost" fill="var(--primary-500)" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Booking Throughput */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Booking Throughput</h3>
                <p className="text-xs text-muted">Created vs completed (last 6 months)</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                  Lead time <span className="font-semibold text-[var(--text-primary)]">{avgLeadTime}d</span>
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[var(--success-50)] text-[var(--success-700)]">
                  {bookingCompletionRate}% completion
                </span>
              </div>
            </div>
            {stats.bookingTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted text-sm">No bookings yet</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.bookingTrend}>
                    <defs>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                      tickFormatter={formatMonthLabel}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Bookings"
                      stroke="var(--primary-500)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorBookings)"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Operational drill-downs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job pipeline */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Job Pipeline</h3>
                <p className="text-xs text-muted">Active jobs by status</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                {activeJobTotal} active
              </span>
            </div>
            {jobPipelineData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted text-sm">No active jobs</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobPipelineData} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={14} fill="var(--primary-500)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {jobPriorityData.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {jobPriorityData.map((priority) => (
                  <span
                    key={priority.name}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[var(--primary-50)] text-[var(--primary-700)]"
                  >
                    {priority.name}
                    <span className="font-semibold text-[var(--text-primary)]">{priority.count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Repair urgency */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Repair Urgency</h3>
                <p className="text-xs text-muted">Open requests by priority</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-[var(--warning-50)] text-[var(--warning-700)]">
                Avg wait {stats.openRepairAgingDays || 0}d
              </span>
            </div>
            {repairUrgencyData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted text-sm">No open repair requests</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repairUrgencyData} margin={{ bottom: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={22}>
                      {repairUrgencyData.map((entry, idx) => (
                        <Cell key={entry.raw} fill={URGENCY_COLOR[entry.raw] || COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-xs text-muted mt-3">{outstandingRepairs} requests awaiting scheduling/assignment</p>
          </div>

          {/* Department distribution */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Department Coverage</h3>
                <p className="text-xs text-muted">Vehicles by department</p>
              </div>
            </div>
            {departmentData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted text-sm">No department data yet</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={14} fill="var(--primary-400)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar insights */}
      <div className="space-y-6">
        {/* Fleet composition pie */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Fleet Composition</h3>
            <span className="text-xs text-muted bg-[var(--bg-tertiary)] px-2 py-1 rounded">By status</span>
          </div>
          {vehicleStatusData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted text-sm">No fleet data yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={vehicleStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={6} dataKey="value">
                      {vehicleStatusData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {vehicleStatusData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-medium">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{entry.value}</span>
                      <span className="text-xs text-muted">vehicles</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top cost drivers */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Top Cost Drivers</h3>
            <span className="text-xs text-muted bg-[var(--bg-tertiary)] px-2 py-1 rounded">Completed jobs</span>
          </div>
          {costDrivers.length === 0 ? (
            <div className="text-muted text-sm text-center py-10">No maintenance spend recorded yet</div>
          ) : (
            <div className="space-y-4">
              {costDrivers.map((driver, idx) => {
                const maxCost = costDrivers[0].cost || 1;
                const percent = Math.round((driver.cost / maxCost) * 100);
                return (
                  <div key={driver.vehicleId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-medium">{driver.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">${driver.cost.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--primary-500)] transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
