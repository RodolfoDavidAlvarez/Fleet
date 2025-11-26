"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";

export default function AdminDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-50/60 via-white to-white">
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-gray-700">Redirecting...</p>
      </div>
    </div>
  );
}
