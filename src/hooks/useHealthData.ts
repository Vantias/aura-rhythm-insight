import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface HealthMetric {
  id: string;
  metric_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  source: string;
}

interface HealthData {
  heartRate: number;
  hrv: number;
  sleepHours: number;
  stressLevel: string;
  isLoading: boolean;
  error: string | null;
}

export function useHealthData(user: User | null): HealthData {
  const [healthData, setHealthData] = useState<HealthData>({
    heartRate: 0,
    hrv: 0,
    sleepHours: 0,
    stressLevel: "Unknown",
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setHealthData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchLatestHealthData = async () => {
      try {
        setHealthData(prev => ({ ...prev, isLoading: true, error: null }));

        // Fetch latest metrics for each type
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        const { data: metrics, error } = await supabase
          .from("health_metrics")
          .select("*")
          .eq("user_id", user.id)
          .gte("recorded_at", yesterday.toISOString())
          .order("recorded_at", { ascending: false });

        if (error) throw error;

        // Process metrics by type
        const latestMetrics = metrics?.reduce((acc, metric) => {
          if (!acc[metric.metric_type] || 
              new Date(metric.recorded_at) > new Date(acc[metric.metric_type].recorded_at)) {
            acc[metric.metric_type] = metric;
          }
          return acc;
        }, {} as Record<string, HealthMetric>) || {};

        setHealthData({
          heartRate: latestMetrics.heart_rate?.value || 0,
          hrv: latestMetrics.hrv?.value || 0,
          sleepHours: latestMetrics.sleep_duration?.value || 0,
          stressLevel: latestMetrics.stress_level?.value ? 
            (latestMetrics.stress_level.value < 30 ? "Low" : 
             latestMetrics.stress_level.value < 70 ? "Medium" : "High") : "Unknown",
          isLoading: false,
          error: null,
        });

      } catch (error) {
        console.error("Error fetching health data:", error);
        setHealthData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to fetch health data"
        }));
      }
    };

    fetchLatestHealthData();

    // Set up real-time subscription for health metrics
    const channel = supabase
      .channel('health-metrics-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'health_metrics',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchLatestHealthData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return healthData;
}