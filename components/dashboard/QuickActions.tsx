"use client";

import Link from "next/link";
import { Plus, Car, Calendar, FileText, Wrench } from "lucide-react";

const actions = [
  {
    label: "New Booking",
    href: "/admin/bookings",
    icon: Calendar,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-500/10",
    hover: "hover:bg-purple-50 dark:hover:bg-purple-500/20",
    border: "border-purple-200 dark:border-purple-500/20",
  },
  {
    label: "Add Vehicle",
    href: "/admin/vehicles",
    icon: Car,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-500/10",
    hover: "hover:bg-blue-50 dark:hover:bg-blue-500/20",
    border: "border-blue-200 dark:border-blue-500/20",
  },
  {
    label: "Log Repair",
    href: "/repair",
    icon: Wrench,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-500/10",
    hover: "hover:bg-orange-50 dark:hover:bg-orange-500/20",
    border: "border-orange-200 dark:border-orange-500/20",
  },
  {
    label: "Service Records",
    href: "/service-records",
    icon: FileText,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-500/10",
    hover: "hover:bg-emerald-50 dark:hover:bg-emerald-500/20",
    border: "border-emerald-200 dark:border-emerald-500/20",
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={action.href}
            className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-[var(--surface)] ${action.border}`}
          >
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${action.bg.replace("bg-", "from-").split(" ")[0]} to-transparent`}
            />

            <div className="relative z-10 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.bg} ${action.color} transition-transform group-hover:scale-110`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm text-[var(--text-primary)]">{action.label}</span>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <Plus className={`h-4 w-4 ${action.color}`} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
