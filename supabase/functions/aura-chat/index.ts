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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

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

    console.log('Sending request to OpenAI with health context...');

    // Create personalized system prompt based on health data
    const systemPrompt = `You are Aura, a personal wellness AI assistant. You help users understand their health patterns and make informed wellness decisions.

Current user's health context:
- Recent heart rate data: ${JSON.stringify(healthSummary.metrics.heart_rate?.slice(0, 3) || [])}
- Recent HRV data: ${JSON.stringify(healthSummary.metrics.hrv?.slice(0, 3) || [])}
- Recent sleep data: ${JSON.stringify(healthSummary.metrics.sleep_duration?.slice(0, 3) || [])}
- Recent stress levels: ${JSON.stringify(healthSummary.metrics.stress_level?.slice(0, 3) || [])}
- Recent context tags: ${JSON.stringify(healthSummary.recentContext?.slice(0, 5) || [])}
- Recent insights: ${JSON.stringify(healthSummary.recentInsights || [])}

Guidelines:
1. Be conversational, supportive, and personalized
2. Reference their actual health data when relevant
3. Provide actionable insights and suggestions
4. Never provide medical advice - you're an informational tool
5. Focus on patterns, trends, and lifestyle correlations
6. Encourage healthy habits and self-awareness
7. Keep responses concise but helpful (2-3 sentences max)
8. If no data is available, encourage them to connect their device and log context

Remember: You are NOT a medical device and should not diagnose or treat any conditions.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

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