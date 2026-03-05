"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-client";

/**
 * Subscribes to Supabase Realtime for live updates.
 * When the DB changes, it invalidates the relevant React Query cache
 * so the UI refreshes automatically — no manual page refresh needed.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("agavefleet-live")
      // New or updated repair requests
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "repair_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["repair-requests"] });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
        }
      )
      // Bookings changes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
        }
      )
      // Vehicle changes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
