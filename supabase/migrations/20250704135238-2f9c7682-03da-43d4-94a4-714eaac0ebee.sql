
-- Create a table to store health alerts
CREATE TABLE public.health_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('sleep_deficiency', 'high_stress')),
  alert_message TEXT NOT NULL,
  triggered_date DATE NOT NULL DEFAULT CURRENT_DATE,
  dismissed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own alerts
ALTER TABLE public.health_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for health_alerts table
CREATE POLICY "Users can view their own alerts" 
  ON public.health_alerts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" 
  ON public.health_alerts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- System can insert alerts (for edge function)
CREATE POLICY "System can insert alerts" 
  ON public.health_alerts 
  FOR INSERT 
  WITH CHECK (true);

-- Add unique constraint to prevent duplicate alerts of same type on same date
CREATE UNIQUE INDEX health_alerts_user_type_date_idx 
  ON public.health_alerts (user_id, alert_type, triggered_date);

-- Create trigger to update updated_at column
CREATE TRIGGER update_health_alerts_updated_at
  BEFORE UPDATE ON public.health_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;
