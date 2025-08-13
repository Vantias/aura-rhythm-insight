import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface HealthEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  severity: string;
  created_at: string;
}

interface InsightData {
  insights: HealthEvent[];
  isLoading: boolean;
  error: string | null;
}

export function useInsights(user: User | null): InsightData {
  const [insights, setInsights] = useState<HealthEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    fetchInsights();

    // Set up real-time subscription for new insights
    const channel = supabase
      .channel('health-events-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'health_events',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchInsights();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchInsights = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("health_events")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_type", "insight")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setInsights(data || []);
    } catch (err) {
      console.error("Error fetching insights:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch insights");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    insights,
    isLoading,
    error
  };
}