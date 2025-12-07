import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Vehicle statuses
    operational: "bg-green-100 text-green-800",
    active: "bg-blue-100 text-blue-800",
    in_service: "bg-yellow-100 text-yellow-800",
    broken_down: "bg-red-100 text-red-800",
    for_sale: "bg-purple-100 text-purple-800",
    idle: "bg-orange-100 text-orange-800",
    upcoming: "bg-indigo-100 text-indigo-800",
    retired: "bg-gray-100 text-gray-800",
    maintenance: "bg-amber-100 text-amber-800",
    reserved: "bg-cyan-100 text-cyan-800",
    out_of_service: "bg-slate-100 text-slate-800",
    // Booking/Job statuses
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    // Mechanic availability
    available: "bg-green-100 text-green-800",
    busy: "bg-yellow-100 text-yellow-800",
    unavailable: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
