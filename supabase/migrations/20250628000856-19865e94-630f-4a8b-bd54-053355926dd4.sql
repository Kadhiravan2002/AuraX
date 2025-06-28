
-- Create a table to store health data entries
CREATE TABLE public.health_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  energy INTEGER CHECK (energy >= 1 AND energy <= 10),
  sleep_hours DECIMAL(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  exercise_minutes INTEGER CHECK (exercise_minutes >= 0),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  water_intake INTEGER CHECK (water_intake >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own data
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own health data
CREATE POLICY "Users can view their own health data" 
  ON public.health_data 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own health data
CREATE POLICY "Users can create their own health data" 
  ON public.health_data 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own health data
CREATE POLICY "Users can update their own health data" 
  ON public.health_data 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own health data
CREATE POLICY "Users can delete their own health data" 
  ON public.health_data 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a unique constraint to prevent duplicate entries for the same user and date
ALTER TABLE public.health_data ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);

-- Create an index for better query performance
CREATE INDEX idx_health_data_user_date ON public.health_data(user_id, date);
