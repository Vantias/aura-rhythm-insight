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
    const { message, userId } = await req.json();

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    // Using free local AI simulation instead of paid OpenAI
    console.log('Using free local AI simulation for chat responses...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching user health data for personalized response...');

    // Fetch user's recent health data for context
    const { data: healthMetrics } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false })
      .limit(20);

    // Fetch user's recent context logs
    const { data: contextLogs } = await supabase
      .from('quick_actions_log')
      .select('*')
      .eq('user_id', userId)
      .eq('action_type', 'context_log')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent health events/insights
    const { data: healthEvents } = await supabase
      .from('health_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    // Prepare health data summary for AI context
    const healthSummary = {
      metrics: healthMetrics?.reduce((acc, metric) => {
        if (!acc[metric.metric_type]) acc[metric.metric_type] = [];
        acc[metric.metric_type].push({ value: metric.value, date: metric.recorded_at });
        return acc;
      }, {} as Record<string, any[]>) || {},
      recentContext: contextLogs?.map(log => log.data) || [],
      recentInsights: healthEvents?.map(event => ({ 
        title: event.title, 
        description: event.description,
        severity: event.severity 
      })) || []
    };

    console.log('Generating free AI response based on health context...');

    // Generate contextual AI response using free local logic
    const aiResponse = generateFreeAIResponse(message, healthSummary);

    console.log('Storing conversation in database...');

    // Store both user message and AI response in database
    const conversationData = [
      {
        user_id: userId,
        message: message,
        response: '', // User message doesn't have a response
        message_type: 'user'
      },
      {
        user_id: userId,
        message: aiResponse,
        response: message, // AI response is in response to user message
        message_type: 'assistant'
      }
    ];

    const { error: dbError } = await supabase
      .from('ai_conversations')
      .insert(conversationData);

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't throw here - still return the AI response even if storage fails
    }

    console.log('AI chat response completed successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      healthDataIncluded: healthMetrics && healthMetrics.length > 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in aura-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallbackResponse: "I'm having trouble accessing your health data right now. Please try connecting your device and syncing your health data. How can I help you with your wellness journey today?"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Free AI response generator using local logic
function generateFreeAIResponse(message: string, healthSummary: any): string {
  const lowerMessage = message.toLowerCase();
  const hasHeartRateData = healthSummary.metrics.heart_rate?.length > 0;
  const hasHRVData = healthSummary.metrics.hrv?.length > 0;
  const hasSleepData = healthSummary.metrics.sleep_duration?.length > 0;
  const hasStressData = healthSummary.metrics.stress_level?.length > 0;
  const hasContextData = healthSummary.recentContext?.length > 0;

  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    if (hasHeartRateData || hasHRVData || hasSleepData) {
      return "Hello! I see you have some health data synced. I'm here to help you understand your wellness patterns. What would you like to know about your health today?";
    } else {
      return "Hello! I'm Aura, your wellness assistant. To give you personalized insights, please connect your fitness device and start logging your health data. How can I help you get started?";
    }
  }

  // Heart rate queries
  if (lowerMessage.includes('heart rate') || lowerMessage.includes('hr')) {
    if (hasHeartRateData) {
      const latestHR = healthSummary.metrics.heart_rate[0]?.value;
      const avgHR = healthSummary.metrics.heart_rate.reduce((sum: number, m: any) => sum + m.value, 0) / healthSummary.metrics.heart_rate.length;
      return `Your latest heart rate reading is ${latestHR} bpm, with a recent average of ${Math.round(avgHR)} bpm. ${latestHR > avgHR * 1.1 ? 'This is elevated compared to your average - consider checking if you\'ve been stressed or active recently.' : 'This looks normal for your baseline.'}`;
    } else {
      return "I don't see any heart rate data yet. Connect your fitness tracker or smartwatch to start monitoring your heart rate patterns for better insights!";
    }
  }

  // HRV queries
  if (lowerMessage.includes('hrv') || lowerMessage.includes('heart rate variability') || lowerMessage.includes('recovery')) {
    if (hasHRVData) {
      const latestHRV = healthSummary.metrics.hrv[0]?.value;
      const avgHRV = healthSummary.metrics.hrv.reduce((sum: number, m: any) => sum + m.value, 0) / healthSummary.metrics.hrv.length;
      return `Your HRV is currently ${latestHRV}ms, compared to your average of ${Math.round(avgHRV)}ms. ${latestHRV > avgHRV ? 'This suggests good recovery and low stress levels.' : 'This might indicate you need more rest or stress management.'}`;
    } else {
      return "HRV data isn't available yet. This metric is great for tracking recovery and stress - make sure your device supports HRV monitoring!";
    }
  }

  // Sleep queries
  if (lowerMessage.includes('sleep') || lowerMessage.includes('rest')) {
    if (hasSleepData) {
      const latestSleep = healthSummary.metrics.sleep_duration[0]?.value;
      const avgSleep = healthSummary.metrics.sleep_duration.reduce((sum: number, m: any) => sum + m.value, 0) / healthSummary.metrics.sleep_duration.length;
      return `You slept ${latestSleep} hours last night, with a recent average of ${avgSleep.toFixed(1)} hours. ${avgSleep >= 7 ? 'Great sleep consistency!' : 'Try to aim for 7-9 hours for optimal recovery.'} ${hasContextData ? 'I can also correlate this with your daily activities if you keep logging context.' : ''}`;
    } else {
      return "No sleep data available yet. Sleep tracking is crucial for understanding your recovery patterns. Enable sleep tracking on your device for better insights!";
    }
  }

  // Stress queries
  if (lowerMessage.includes('stress') || lowerMessage.includes('stressed')) {
    if (hasStressData) {
      const latestStress = healthSummary.metrics.stress_level[0]?.value;
      return `Your recent stress level reading is ${latestStress}/10. ${latestStress > 6 ? 'Consider some relaxation techniques like deep breathing or meditation.' : 'Your stress levels look manageable.'} ${hasContextData ? 'Your context logs show helpful patterns about what affects your stress.' : ''}`;
    } else {
      return "I don't have stress level data yet. Try logging your stress levels manually or using a device that tracks stress. Also, use the context logger to note stressful situations!";
    }
  }

  // General insights
  if (lowerMessage.includes('insight') || lowerMessage.includes('pattern') || lowerMessage.includes('analysis')) {
    if (hasHeartRateData && hasHRVData && hasSleepData) {
      return "Based on your data, I can see patterns forming! Your heart rate, HRV, and sleep metrics are all connected. Keep logging context tags to help me identify what activities and situations impact your health the most.";
    } else {
      return "To provide meaningful insights, I need more comprehensive health data. Connect your fitness device and ensure it's tracking heart rate, HRV, sleep, and stress levels. The more data points, the better insights I can provide!";
    }
  }

  // Data connection help
  if (lowerMessage.includes('connect') || lowerMessage.includes('device') || lowerMessage.includes('sync')) {
    return "To connect your device, look for the device connection card on your dashboard. I support Apple HealthKit, Google Health Connect, and most major fitness trackers. Once connected, your health data will sync automatically!";
  }

  // General wellness
  if (lowerMessage.includes('health') || lowerMessage.includes('wellness') || lowerMessage.includes('improve')) {
    const dataTypes = [];
    if (hasHeartRateData) dataTypes.push('heart rate');
    if (hasHRVData) dataTypes.push('HRV');
    if (hasSleepData) dataTypes.push('sleep');
    if (hasStressData) dataTypes.push('stress');

    if (dataTypes.length > 0) {
      return `Great question! I can see you're tracking ${dataTypes.join(', ')}. The key to wellness is consistent monitoring and finding patterns. Keep logging daily context to help correlate your activities with health metrics!`;
    } else {
      return "Wellness starts with awareness! Connect your fitness device to start tracking key metrics like heart rate, sleep, and stress. Then use the context logger to note daily activities and see how they impact your health.";
    }
  }

  // Default response
  if (hasHeartRateData || hasHRVData || hasSleepData || hasStressData) {
    return "I can help you understand your health patterns! Ask me about your heart rate, HRV, sleep, stress levels, or any wellness insights. You can also ask for tips on improving specific metrics.";
  } else {
    return "I'm here to help with your wellness journey! Connect your fitness device first, then I can provide personalized insights about your health patterns. You can ask me about heart rate, sleep, stress, or general wellness tips.";
  }
}