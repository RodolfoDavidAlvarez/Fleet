"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MechanicDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return <div className="flex items-center justify-center h-screen">Redirecting...</div>;
}
