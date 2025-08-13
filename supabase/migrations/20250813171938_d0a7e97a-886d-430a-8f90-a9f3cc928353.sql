-- Create profiles table for user health data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  height_cm INTEGER,
  weight_kg NUMERIC,
  gender TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create health metrics table
CREATE TABLE public.health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- 'rhr', 'hrv', 'sleep_deep', 'sleep_rem', 'sleep_light', 'sleep_total'
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'manual', -- 'manual', 'healthkit', 'health_connect'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own health metrics" 
ON public.health_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics" 
ON public.health_metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics" 
ON public.health_metrics 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create quick actions log table for context tags
CREATE TABLE public.quick_actions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'nutrition', 'activity', 'mood', 'sleep_context'
  data JSONB, -- flexible storage for tags and additional data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_actions_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own quick actions" 
ON public.quick_actions_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quick actions" 
ON public.quick_actions_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create AI conversations table
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat', -- 'chat', 'insight', 'recommendation'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own conversations" 
ON public.ai_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" 
ON public.ai_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create health events table for insights and anomalies
CREATE TABLE public.health_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'insight', 'anomaly', 'pattern', 'recommendation'
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT, -- 'info', 'warning', 'attention'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own health events" 
ON public.health_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health events" 
ON public.health_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health events" 
ON public.health_events 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create device connections table
CREATE TABLE public.device_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_type TEXT NOT NULL, -- 'apple_watch', 'fitbit', 'garmin', etc.
  device_name TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own devices" 
ON public.device_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices" 
ON public.device_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices" 
ON public.device_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();