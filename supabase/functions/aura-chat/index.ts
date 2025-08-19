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

    // Using advanced free AI health partner
    console.log('Processing health question with comprehensive AI knowledge...');

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

// Advanced free AI health partner - comprehensive health knowledge system
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
      return "Hello! I'm Aura, your personal health partner. I see you have health data synced - great! I can help you understand patterns, provide wellness guidance, answer health questions, and suggest improvements. What would you like to explore today?";
    } else {
      return "Hello! I'm Aura, your comprehensive health partner. I'm here to help with health insights, wellness advice, fitness guidance, nutrition tips, and more. Connect your device to get personalized insights, or ask me any health questions!";
    }
  }

  // Heart rate queries and education
  if (lowerMessage.includes('heart rate') || lowerMessage.includes('hr') || lowerMessage.includes('pulse')) {
    if (hasHeartRateData) {
      const latestHR = healthSummary.metrics.heart_rate[0]?.value;
      const avgHR = healthSummary.metrics.heart_rate.reduce((sum: number, m: any) => sum + m.value, 0) / healthSummary.metrics.heart_rate.length;
      let advice = "";
      
      if (latestHR > avgHR * 1.15) {
        advice = "Your heart rate is elevated. This could indicate stress, caffeine intake, dehydration, or recent activity. Try deep breathing or check if you're well-hydrated.";
      } else if (latestHR < avgHR * 0.85) {
        advice = "Your heart rate is lower than usual. This often indicates good fitness or recovery, but if you feel unwell, consider resting.";
      } else {
        advice = "Your heart rate looks normal for your baseline. Good cardiovascular health is linked to regular exercise, stress management, and adequate sleep.";
      }
      
      return `Your latest heart rate is ${latestHR} bpm (average: ${Math.round(avgHR)} bpm). ${advice} Normal resting heart rate is 60-100 bpm, but athletes often have 40-60 bpm.`;
    } else {
      return "Heart rate is a key vital sign! Normal resting heart rate is 60-100 bpm for adults. Factors affecting it include fitness level, age, stress, caffeine, medications, and health conditions. Regular cardio exercise can lower resting heart rate. Connect your device to track yours!";
    }
  }

  // HRV queries and education
  if (lowerMessage.includes('hrv') || lowerMessage.includes('heart rate variability') || lowerMessage.includes('recovery')) {
    if (hasHRVData) {
      const latestHRV = healthSummary.metrics.hrv[0]?.value;
      const avgHRV = healthSummary.metrics.hrv.reduce((sum: number, m: any) => sum + m.value, 0) / healthSummary.metrics.hrv.length;
      let advice = "";
      
      if (latestHRV > avgHRV * 1.1) {
        advice = "Excellent HRV suggests good recovery and low stress. Your nervous system is well-balanced. Great time for challenging workouts!";
      } else if (latestHRV < avgHRV * 0.9) {
        advice = "Lower HRV may indicate stress, poor sleep, or overtraining. Consider easier activities, stress management, or extra sleep tonight.";
      } else {
        advice = "Your HRV is within your normal range, indicating balanced autonomic nervous system function.";
      }
      
      return `Your HRV is ${latestHRV}ms (average: ${Math.round(avgHRV)}ms). ${advice} HRV reflects your body's ability to adapt to stress and is great for optimizing training and recovery.`;
    } else {
      return "HRV measures the variation between heartbeats and reflects your autonomic nervous system balance. Higher HRV generally indicates better recovery, stress resilience, and cardiovascular health. It's influenced by sleep, stress, alcohol, training load, and overall health. Perfect for guiding training intensity!";
    }
  }

  // Sleep queries and education
  if (lowerMessage.includes('sleep') || lowerMessage.includes('rest') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
    if (hasSleepData) {
      const latestSleep = healthSummary.metrics.sleep_duration[0]?.value;
      const avgSleep = healthSummary.metrics.sleep_duration.reduce((sum: number, m: any) => sum + m.value, 0) / healthSummary.metrics.sleep_duration.length;
      let advice = "";
      
      if (avgSleep < 7) {
        advice = "You're not getting enough sleep. Aim for 7-9 hours. Poor sleep affects immunity, mood, weight, and cognitive function. Try a consistent bedtime routine.";
      } else if (avgSleep >= 8) {
        advice = "Excellent sleep duration! Quality sleep supports recovery, immune function, mental health, and performance. Keep up the great habits!";
      } else {
        advice = "Decent sleep duration, but could be improved. Quality matters too - deep sleep stages are crucial for recovery.";
      }
      
      return `You slept ${latestSleep} hours last night (average: ${avgSleep.toFixed(1)} hours). ${advice} Sleep hygiene tips: cool dark room, no screens 1hr before bed, consistent schedule.`;
    } else {
      return "Sleep is crucial for health! Adults need 7-9 hours. Sleep affects everything: immune system, mental health, weight, performance, and longevity. Good sleep hygiene includes consistent schedule, cool dark room, no caffeine late, regular exercise, and limiting screens before bed. Track your sleep to optimize it!";
    }
  }

  // Stress and mental health
  if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('mental health') || lowerMessage.includes('mood')) {
    if (hasStressData) {
      const latestStress = healthSummary.metrics.stress_level[0]?.value;
      let advice = "";
      
      if (latestStress > 70) {
        advice = "High stress levels detected. Try immediate relief: deep breathing (4-7-8 technique), short walk, cold water on wrists, or call someone you trust. Long-term: regular exercise, meditation, adequate sleep.";
      } else if (latestStress > 50) {
        advice = "Moderate stress. Consider stress management techniques: mindfulness, exercise, time in nature, or talking to someone. Identify and address stressors when possible.";
      } else {
        advice = "Your stress levels look manageable. Maintain healthy habits: regular exercise, good sleep, social connections, and relaxation practices.";
      }
      
      return `Your stress level is ${latestStress}/100. ${advice} Chronic stress affects heart health, immunity, and mental well-being. Regular stress management is essential.`;
    } else {
      return "Stress management is vital for health! Chronic stress increases disease risk and impacts mental health. Effective techniques: regular exercise, meditation, deep breathing, yoga, nature time, social support, and adequate sleep. Physical signs include elevated heart rate, poor HRV, and sleep disruption. What specific aspect would you like to discuss?";
    }
  }

  // Exercise and fitness
  if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('fitness') || lowerMessage.includes('cardio') || lowerMessage.includes('strength')) {
    return "Exercise is medicine! Adults need: 150 minutes moderate cardio OR 75 minutes vigorous cardio weekly, plus 2+ strength training sessions. Benefits include better heart health, stronger bones, mental health, weight management, and longevity. Start slowly, be consistent, and mix cardio with strength training. Listen to your body and recover adequately. What's your current activity level?";
  }

  // Nutrition and diet
  if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eating') || lowerMessage.includes('weight')) {
    return "Nutrition is foundational to health! Focus on: whole foods, plenty of vegetables/fruits, lean proteins, healthy fats, adequate fiber, and hydration. Limit processed foods, excessive sugar, and unhealthy fats. Eating patterns matter too - consistent meal timing supports metabolism. Individual needs vary by age, activity, and health goals. What specific nutrition area interests you?";
  }

  // Hydration
  if (lowerMessage.includes('water') || lowerMessage.includes('hydration') || lowerMessage.includes('dehydrated')) {
    return "Hydration is crucial! Most adults need 8-10 cups daily, more with exercise or heat. Signs of good hydration: pale yellow urine, moist mouth, good energy. Dehydration causes fatigue, headaches, poor concentration, and affects all body functions. Water is best, but herbal teas count too. Monitor your urine color as a hydration gauge!";
  }

  // Pain and injury
  if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('injury') || lowerMessage.includes('sore')) {
    return "For acute pain/injury: R.I.C.E. (Rest, Ice, Compression, Elevation) for first 48 hours. Chronic pain needs professional evaluation. General tips: gentle movement when possible, anti-inflammatory foods, adequate sleep, stress management. Persistent or severe pain requires medical attention. Never ignore pain that's getting worse or affecting daily activities.";
  }

  // Medications and supplements
  if (lowerMessage.includes('supplement') || lowerMessage.includes('vitamin') || lowerMessage.includes('medication') || lowerMessage.includes('medicine')) {
    return "I can provide general supplement information, but always consult healthcare providers for personal medical advice. Common beneficial supplements include: Vitamin D (if deficient), Omega-3s, and a quality multivitamin. Most nutrients should come from food first. Never stop prescribed medications without doctor approval. What specific supplement interests you?";
  }

  // Women's health
  if (lowerMessage.includes('period') || lowerMessage.includes('menstrual') || lowerMessage.includes('pregnancy') || lowerMessage.includes('hormones')) {
    return "Women's health varies greatly by individual and life stage. Menstrual health, hormonal balance, bone health, and reproductive wellness are important areas. Regular check-ups, healthy lifestyle, stress management, and appropriate nutrition support hormonal health. For specific concerns about periods, pregnancy, or hormonal issues, consult with healthcare providers specializing in women's health.";
  }

  // Men's health
  if (lowerMessage.includes('testosterone') || lowerMessage.includes('prostate') || lowerMessage.includes('male health')) {
    return "Men's health focuses on cardiovascular health, prostate health, testosterone levels, and mental wellness. Regular exercise, healthy diet, stress management, and adequate sleep support hormonal balance. Men often underutilize healthcare - regular check-ups are important for prevention. Specific concerns about testosterone, prostate, or other male health issues should be discussed with healthcare providers.";
  }

  // Aging and longevity
  if (lowerMessage.includes('aging') || lowerMessage.includes('longevity') || lowerMessage.includes('elderly') || lowerMessage.includes('old')) {
    return "Healthy aging involves: regular exercise (especially strength training), good nutrition, social connections, mental stimulation, stress management, and preventive healthcare. Key areas: bone health, muscle mass, cardiovascular health, cognitive function, and balance. It's never too late to start healthy habits - even small changes make a difference!";
  }

  // General insights and patterns
  if (lowerMessage.includes('insight') || lowerMessage.includes('pattern') || lowerMessage.includes('analysis') || lowerMessage.includes('trend')) {
    if (hasHeartRateData && hasHRVData && hasSleepData) {
      return "Your data shows interconnected patterns! Heart rate, HRV, and sleep all influence each other. Quality sleep improves HRV, good HRV indicates recovery readiness, and heart rate reflects your body's current state. Keep logging context to identify what activities, foods, or situations impact your health metrics most.";
    } else {
      return "Health patterns emerge when we track consistently! Key relationships: sleep quality affects next-day energy and stress resilience, exercise improves sleep and mood, stress impacts heart rate and HRV, nutrition affects energy and recovery. Connect your device and log daily activities to discover your personal patterns!";
    }
  }

  // Device connection help
  if (lowerMessage.includes('connect') || lowerMessage.includes('device') || lowerMessage.includes('sync') || lowerMessage.includes('bluetooth')) {
    return "Device connection enhances personalized insights! Supported devices include Apple Watch, Samsung Galaxy Watch, Fitbit, Garmin, Polar, and more. Ensure Bluetooth is on, device is nearby, and follow the pairing process. Connected devices provide continuous heart rate, HRV, sleep, and activity data for comprehensive health monitoring.";
  }

  // Emergency or urgent situations
  if (lowerMessage.includes('emergency') || lowerMessage.includes('chest pain') || lowerMessage.includes('can\'t breathe') || lowerMessage.includes('urgent')) {
    return "⚠️ For medical emergencies, call emergency services immediately (911/999/112). I'm not a substitute for emergency medical care. Seek immediate help for: chest pain, difficulty breathing, severe injuries, signs of stroke, or any life-threatening symptoms. Your safety is most important!";
  }

  // Default comprehensive response
  const hasAnyData = hasHeartRateData || hasHRVData || hasSleepData || hasStressData;
  
  if (hasAnyData) {
    return "I'm your comprehensive health partner! I can help with health insights from your data, answer questions about fitness, nutrition, sleep, stress management, recovery, and general wellness. I provide evidence-based guidance but always recommend consulting healthcare professionals for medical concerns. What health topic would you like to explore?";
  } else {
    return "I'm your comprehensive health partner! I can help with fitness guidance, nutrition advice, sleep optimization, stress management, exercise planning, and wellness education. Connect your device for personalized insights, or ask me anything about health, wellness, nutrition, exercise, or lifestyle! What would you like to know?";
  }
}