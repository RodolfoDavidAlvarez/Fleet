"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Car, Calendar, Users, TrendingUp, AlertCircle, CheckCircle, ShieldCheck, MessageSquare } from "lucide-react";
import { DashboardStats } from "@/types";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      router.push("/login");
      return;
    }
    setUser(parsedUser);

    const loadStats = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard stats");
        const data = await res.json();
        setStats(data.stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [router]);

  if (!user || loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!stats) {
    return <div className="flex items-center justify-center h-screen">Error loading dashboard</div>;
  }

  const statCards = [
    {
      title: "Total Vehicles",
      value: stats.totalVehicles,
      icon: Car,
      color: "bg-blue-50 text-blue-700",
      change: "+2 this month",
    },
    {
      title: "Active Vehicles",
      value: stats.activeVehicles,
      icon: CheckCircle,
      color: "bg-green-50 text-green-700",
      change: `${stats.vehiclesInService} in service`,
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: Calendar,
      color: "bg-purple-50 text-purple-700",
      change: `${stats.pendingBookings} pending`,
    },
    {
      title: "Drivers",
      value: stats.totalDrivers || 0,
      icon: Users,
      color: "bg-orange-50 text-orange-700",
      change: `${stats.activeDrivers || 0} active`,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Admin Overview</p>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Fleet health, bookings, and driver management at a glance.</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-primary-700">
                <ShieldCheck className="h-4 w-4" />
                SMS compliant
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className="card-surface rounded-2xl p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${stat.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card-surface rounded-2xl p-6 lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent bookings</h2>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Service Request #{i}</p>
                        <p className="text-sm text-gray-500">2 hours ago</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Pending</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-surface rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary-700" />
                  <h2 className="text-xl font-semibold text-gray-900">SMS health</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Opt-in rate</span>
                    <span className="font-semibold text-gray-900">93%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Delivery</span>
                    <span className="font-semibold text-gray-900">99.4%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Opt-outs honored</span>
                    <span className="font-semibold text-gray-900">100%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-surface rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicles needing service</h2>
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Ford F-150 - ABC-1234</p>
                        <p className="text-sm text-gray-500">Service due in 5 days</p>
                      </div>
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-surface rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Driver status</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Active drivers</span>
                    <span className="font-semibold text-gray-900">{stats.activeDrivers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Total drivers</span>
                    <span className="font-semibold text-gray-900">{stats.totalDrivers || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">Manage driver assignments and vehicle assignments.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
