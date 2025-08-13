import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing health data for insights generation...');

    // Fetch user's health data from the last 14 days
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: healthMetrics } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', fourteenDaysAgo)
      .order('recorded_at', { ascending: true });

    const { data: contextLogs } = await supabase
      .from('quick_actions_log')
      .select('*')
      .eq('user_id', userId)
      .eq('action_type', 'context_log')
      .gte('created_at', fourteenDaysAgo)
      .order('created_at', { ascending: true });

    if (!healthMetrics || healthMetrics.length < 5) {
      console.log('Insufficient health data for insights');
      return new Response(JSON.stringify({ 
        message: 'Insufficient data for insights generation. Need at least 5 days of health data.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Analyze patterns and generate insights
    const insights = await analyzeHealthPatterns(healthMetrics, contextLogs);
    
    // Store insights in database
    const insightEvents = insights.map(insight => ({
      user_id: userId,
      event_type: 'insight',
      title: insight.title,
      description: insight.description,
      severity: insight.severity
    }));

    if (insightEvents.length > 0) {
      const { error: insertError } = await supabase
        .from('health_events')
        .insert(insightEvents);

      if (insertError) {
        console.error('Error storing insights:', insertError);
      } else {
        console.log(`Successfully generated and stored ${insightEvents.length} insights`);
      }
    }

    return new Response(JSON.stringify({ 
      insights: insights,
      message: `Generated ${insights.length} new insights based on your recent health data`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeHealthPatterns(healthMetrics: any[], contextLogs: any[]) {
  const insights = [];

  // Group metrics by type
  const metricsByType = healthMetrics.reduce((acc, metric) => {
    if (!acc[metric.metric_type]) acc[metric.metric_type] = [];
    acc[metric.metric_type].push(metric);
    return acc;
  }, {} as Record<string, any[]>);

  // Analyze heart rate patterns
  if (metricsByType.heart_rate && metricsByType.heart_rate.length > 3) {
    const hrData = metricsByType.heart_rate;
    const avgHR = hrData.reduce((sum, m) => sum + m.value, 0) / hrData.length;
    const recentHR = hrData.slice(-3).reduce((sum, m) => sum + m.value, 0) / 3;
    
    if (recentHR > avgHR * 1.1) {
      insights.push({
        title: "Elevated Heart Rate Pattern",
        description: `Your resting heart rate has been ${Math.round(((recentHR - avgHR) / avgHR) * 100)}% higher than your recent average. This could indicate increased stress, poor recovery, or recent physical activity.`,
        severity: "warning"
      });
    } else if (recentHR < avgHR * 0.9) {
      insights.push({
        title: "Improved Heart Rate Recovery",
        description: `Your resting heart rate has improved by ${Math.round(((avgHR - recentHR) / avgHR) * 100)}% below your recent average, suggesting better cardiovascular fitness and recovery.`,
        severity: "info"
      });
    }
  }

  // Analyze HRV patterns
  if (metricsByType.hrv && metricsByType.hrv.length > 3) {
    const hrvData = metricsByType.hrv;
    const avgHRV = hrvData.reduce((sum, m) => sum + m.value, 0) / hrvData.length;
    const recentHRV = hrvData.slice(-3).reduce((sum, m) => sum + m.value, 0) / 3;
    
    if (recentHRV < avgHRV * 0.85) {
      insights.push({
        title: "HRV Indicates Increased Stress",
        description: `Your heart rate variability has decreased by ${Math.round(((avgHRV - recentHRV) / avgHRV) * 100)}%, which may indicate increased stress or reduced recovery. Consider prioritizing rest and stress management.`,
        severity: "attention"
      });
    } else if (recentHRV > avgHRV * 1.15) {
      insights.push({
        title: "Excellent HRV Recovery",
        description: `Your HRV has improved by ${Math.round(((recentHRV - avgHRV) / avgHRV) * 100)}%, indicating excellent recovery and stress management. Great job maintaining your wellness routine!`,
        severity: "info"
      });
    }
  }

  // Analyze sleep patterns
  if (metricsByType.sleep_duration && metricsByType.sleep_duration.length > 3) {
    const sleepData = metricsByType.sleep_duration;
    const avgSleep = sleepData.reduce((sum, m) => sum + m.value, 0) / sleepData.length;
    const shortSleepDays = sleepData.filter(m => m.value < 7).length;
    
    if (shortSleepDays > sleepData.length * 0.5) {
      insights.push({
        title: "Consistent Sleep Deficit",
        description: `You've had insufficient sleep (< 7 hours) on ${shortSleepDays} out of ${sleepData.length} recent days. Poor sleep can impact recovery, stress levels, and overall health.`,
        severity: "attention"
      });
    } else if (avgSleep >= 7.5) {
      insights.push({
        title: "Optimal Sleep Pattern",
        description: `You're maintaining excellent sleep habits with an average of ${avgSleep.toFixed(1)} hours per night. This supports optimal recovery and wellness.`,
        severity: "info"
      });
    }
  }

  // Correlate context with health metrics
  if (contextLogs && contextLogs.length > 0) {
    const stressedDays = contextLogs.filter(log => 
      log.data?.tags?.includes('stressed')
    ).map(log => log.created_at.split('T')[0]);

    const workoutDays = contextLogs.filter(log => 
      log.data?.tags?.includes('workout') || log.data?.tags?.includes('cardio')
    ).map(log => log.created_at.split('T')[0]);

    if (stressedDays.length > 0 && metricsByType.hrv) {
      // Find HRV data for stressed days
      const stressedDayHRV = metricsByType.hrv.filter(metric => 
        stressedDays.some(day => metric.recorded_at.startsWith(day))
      );
      
      if (stressedDayHRV.length > 0) {
        const avgStressedHRV = stressedDayHRV.reduce((sum, m) => sum + m.value, 0) / stressedDayHRV.length;
        const allHRVAvg = metricsByType.hrv.reduce((sum, m) => sum + m.value, 0) / metricsByType.hrv.length;
        
        if (avgStressedHRV < allHRVAvg * 0.9) {
          insights.push({
            title: "Stress Impact on Recovery",
            description: `Your HRV tends to be ${Math.round(((allHRVAvg - avgStressedHRV) / allHRVAvg) * 100)}% lower on days when you log feeling stressed. Consider stress management techniques like meditation or deep breathing.`,
            severity: "warning"
          });
        }
      }
    }

    if (workoutDays.length > 0 && metricsByType.sleep_duration) {
      // Find sleep data after workout days
      const postWorkoutSleep = metricsByType.sleep_duration.filter(metric => {
        const sleepDate = new Date(metric.recorded_at);
        const dayBefore = new Date(sleepDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return workoutDays.includes(dayBefore);
      });
      
      if (postWorkoutSleep.length > 0) {
        const avgPostWorkoutSleep = postWorkoutSleep.reduce((sum, m) => sum + m.value, 0) / postWorkoutSleep.length;
        const allSleepAvg = metricsByType.sleep_duration.reduce((sum, m) => sum + m.value, 0) / metricsByType.sleep_duration.length;
        
        if (avgPostWorkoutSleep > allSleepAvg) {
          insights.push({
            title: "Exercise Improves Sleep Quality",
            description: `You sleep ${Math.round(((avgPostWorkoutSleep - allSleepAvg) * 60))} minutes longer on average after workout days. Keep up the great exercise routine for better recovery!`,
            severity: "info"
          });
        }
      }
    }
  }

  return insights;
}