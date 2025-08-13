import { useState, useEffect } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { DashboardHeader } from "@/components/dashboard/header";
import { MetricCard } from "@/components/ui/metric-card";
import { InsightCard } from "@/components/dashboard/insight-card";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ContextLogger } from "@/components/context/context-logger";
import { DeviceConnectionCard } from "@/components/ui/device-connection-card";
import { InsightsGenerator } from "@/components/ui/insights-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useHealthData } from "@/hooks/useHealthData";
import { useDeviceConnection } from "@/hooks/useDeviceConnection";
import { useInsights } from "@/hooks/useInsights";
import { Heart, Brain, Moon, Activity, Plus, TrendingUp } from "lucide-react";
import heroImage from "@/assets/aura-hero.jpg";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isContextLoggerOpen, setIsContextLoggerOpen] = useState(false);
  
  // Use custom hooks for real data
  const healthData = useHealthData(user);
  const deviceConnection = useDeviceConnection(user);
  const insights = useInsights(user);
  
  const handleInsightsGenerated = () => {
    // Trigger a refresh of insights data
    window.location.reload();
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-full mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading Aura...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userStatus="normal"
        statusMessage="You're in your typical rhythm"
        onOpenChat={() => setIsChatOpen(true)}
        onOpenContextLog={() => setIsContextLoggerOpen(true)}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        <div
          className="h-64 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-background/60" />
          <div className="container mx-auto px-4 h-full flex items-center justify-center relative z-10">
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Welcome to Your Wellness Journey
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Discover your body's unique rhythms and understand how your daily choices impact your well-being.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Today's Metrics */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Today's Snapshot</h2>
            <Button
              onClick={() => setIsContextLoggerOpen(true)}
              size="sm"
              className="bg-gradient-primary hover:opacity-90 transition-opacity sm:hidden"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Context
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              title="Resting Heart Rate"
              value={healthData.isLoading ? "..." : healthData.heartRate || "No data"}
              unit="bpm"
              status={healthData.heartRate > 0 ? "good" : "normal"}
              subtitle={healthData.heartRate > 70 ? "Above average" : "Within range"}
              trend={healthData.heartRate > 70 ? "up" : "down"}
              icon={<Heart className="h-4 w-4" />}
            />
            <MetricCard
              title="HRV Score"
              value={healthData.isLoading ? "..." : healthData.hrv || "No data"}
              unit="ms"
              status={healthData.hrv > 40 ? "excellent" : healthData.hrv > 30 ? "good" : "normal"}
              subtitle={healthData.hrv > 40 ? "Peak recovery zone" : "Building resilience"}
              trend={healthData.hrv > 40 ? "up" : "stable"}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              title="Sleep Quality"
              value={healthData.isLoading ? "..." : healthData.sleepHours || "No data"}
              unit="hrs"
              status={healthData.sleepHours >= 7 ? "good" : healthData.sleepHours >= 6 ? "attention" : "concern"}
              subtitle={healthData.sleepHours >= 7 ? "Optimal rest" : "Could improve"}
              trend={healthData.sleepHours >= 7 ? "up" : "down"}
              icon={<Moon className="h-4 w-4" />}
            />
            <MetricCard
              title="Stress Level"
              value={healthData.isLoading ? "..." : healthData.stressLevel}
              status={healthData.stressLevel === "Low" ? "excellent" : healthData.stressLevel === "Medium" ? "good" : "attention"}
              subtitle="Based on HRV analysis"
              trend={healthData.stressLevel === "Low" ? "down" : "up"}
              icon={<Brain className="h-4 w-4" />}
            />
          </div>
        </section>

        {/* Active Insights */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Active Insights</h2>
            <Button variant="outline" size="sm" className="border-border/50">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Trends
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.insights.length > 0 ? (
              insights.insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  title={insight.title}
                  description={insight.description}
                  severity={insight.severity as "info" | "warning" | "attention"}
                  timestamp={new Date(insight.created_at).toLocaleString()}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">
                  {insights.isLoading ? "Loading insights..." : "No insights available yet. Connect your device to start generating personalized insights."}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* AI Insights Generator */}
        <section>
          <InsightsGenerator onInsightsGenerated={handleInsightsGenerated} />
        </section>

        {/* Device Connection */}
        <section>
          <DeviceConnectionCard
            devices={deviceConnection.devices}
            onConnect={deviceConnection.connectDevice}
            onSync={deviceConnection.syncHealthData}
            isLoading={deviceConnection.isLoading}
          />
        </section>

        {/* Quick Actions */}
        <section>
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  onClick={() => setIsChatOpen(true)}
                  variant="outline"
                  className="justify-start border-border/50 bg-background/50 hover:bg-muted/50"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Ask Aura Assistant
                </Button>
                <Button
                  onClick={() => setIsContextLoggerOpen(true)}
                  variant="outline"
                  className="justify-start border-border/50 bg-background/50 hover:bg-muted/50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Log Today's Context
                </Button>
                <Button
                  onClick={deviceConnection.syncHealthData}
                  variant="outline"
                  className="justify-start border-border/50 bg-background/50 hover:bg-muted/50"
                  disabled={deviceConnection.devices.length === 0}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Sync Health Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Floating Components */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
      <ContextLogger
        isOpen={isContextLoggerOpen}
        onClose={() => setIsContextLoggerOpen(false)}
      />
    </div>
  );
};

export default Index;
