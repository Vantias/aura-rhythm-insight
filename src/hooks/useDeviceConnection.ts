import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface DeviceConnection {
  id: string;
  device_type: string;
  device_name: string;
  is_connected: boolean;
  last_sync: string | null;
}

interface DeviceConnectionState {
  devices: DeviceConnection[];
  isLoading: boolean;
  error: string | null;
  syncHealthData: () => Promise<void>;
  connectDevice: (deviceType: string, deviceName: string) => Promise<void>;
}

export function useDeviceConnection(user: User | null): DeviceConnectionState {
  const [devices, setDevices] = useState<DeviceConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    fetchDevices();
  }, [user]);

  const fetchDevices = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("device_connections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDevices(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching devices:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch devices");
    } finally {
      setIsLoading(false);
    }
  };

  const connectDevice = async (deviceType: string, deviceName: string) => {
    if (!user) return;

    try {
      setError(null);
      
      // Check if device already exists
      const existingDevice = devices.find(d => d.device_type === deviceType);
      
      if (existingDevice) {
        // Update existing device
        const { error } = await supabase
          .from("device_connections")
          .update({ 
            is_connected: true, 
            device_name: deviceName,
            last_sync: new Date().toISOString()
          })
          .eq("id", existingDevice.id);

        if (error) throw error;
      } else {
        // Create new device connection
        const { error } = await supabase
          .from("device_connections")
          .insert({
            user_id: user.id,
            device_type: deviceType,
            device_name: deviceName,
            is_connected: true,
            last_sync: new Date().toISOString()
          });

        if (error) throw error;
      }

      await fetchDevices();
      
      // Trigger initial data sync
      await syncHealthData();
    } catch (err) {
      console.error("Error connecting device:", err);
      setError(err instanceof Error ? err.message : "Failed to connect device");
    }
  };

  const syncHealthData = async () => {
    if (!user) return;

    try {
      setError(null);
      
      // Check for HealthKit/Health Connect availability
      if ('HealthKit' in window || 'navigator' in window && 'health' in navigator) {
        // Enhanced device simulation with more realistic health data generation
        const now = new Date();
        const timeOfDay = now.getHours();
        
        // Generate more realistic values based on time of day and individual variation
        const mockHealthData = [
          {
            user_id: user.id,
            metric_type: 'heart_rate',
            value: Math.floor(Math.random() * 15) + (timeOfDay < 6 || timeOfDay > 22 ? 55 : 65), // Lower at night
            unit: 'bpm',
            source: 'wearable_device',
            recorded_at: now.toISOString()
          },
          {
            user_id: user.id,
            metric_type: 'hrv',
            value: Math.floor(Math.random() * 25) + (timeOfDay < 8 ? 45 : 35), // Higher in morning
            unit: 'ms',
            source: 'wearable_device',
            recorded_at: now.toISOString()
          },
          {
            user_id: user.id,
            metric_type: 'sleep_duration',
            value: Number((Math.random() * 2.5 + 6.5).toFixed(1)), // 6.5-9 hours
            unit: 'hours',
            source: 'wearable_device',
            recorded_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
          },
          {
            user_id: user.id,
            metric_type: 'stress_level',
            value: Math.floor(Math.random() * 40) + (timeOfDay >= 9 && timeOfDay <= 17 ? 30 : 20), // Higher during work hours
            unit: 'score',
            source: 'wearable_device',
            recorded_at: now.toISOString()
          },
          {
            user_id: user.id,
            metric_type: 'steps',
            value: Math.floor(Math.random() * 5000) + 3000, // 3000-8000 steps
            unit: 'count',
            source: 'wearable_device',
            recorded_at: now.toISOString()
          }
        ];

        const { error } = await supabase
          .from("health_metrics")
          .insert(mockHealthData);

        if (error) throw error;

        // Update last sync time
        const { error: updateError } = await supabase
          .from("device_connections")
          .update({ last_sync: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("is_connected", true);

        if (updateError) throw updateError;

        await fetchDevices();
      } else {
        throw new Error("Health data API not available on this device");
      }
    } catch (err) {
      console.error("Error syncing health data:", err);
      setError(err instanceof Error ? err.message : "Failed to sync health data");
    }
  };

  return {
    devices,
    isLoading,
    error,
    syncHealthData,
    connectDevice
  };
}