"use client";

import Link from "next/link";
import { Plus, Car, Calendar, FileText, Wrench } from "lucide-react";

const actions = [
  {
    label: "New Booking",
    href: "/admin/bookings",
    icon: Calendar,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    label: "Add Vehicle",
    href: "/admin/vehicles",
    icon: Car,
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
  {
    label: "Log Repair",
    href: "/repair",
    icon: Wrench,
    color: "text-orange-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    label: "Service Records",
    href: "/service-records",
    icon: FileText,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
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
            className={`group relative overflow-hidden border-l-[3px] ${action.border} rounded-lg border border-[var(--border)] p-4 transition-all duration-200 hover:shadow-md bg-[var(--surface)]`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.bg} ${action.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm text-[var(--text-primary)]">{action.label}</span>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Plus className={`h-4 w-4 ${action.color}`} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
