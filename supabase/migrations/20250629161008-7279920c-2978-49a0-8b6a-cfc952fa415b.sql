
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own health data" ON public.health_data;
DROP POLICY IF EXISTS "Users can insert their own health data" ON public.health_data;
DROP POLICY IF EXISTS "Users can update their own health data" ON public.health_data;
DROP POLICY IF EXISTS "Users can delete their own health data" ON public.health_data;

-- Create RLS policies so users can only access their own data
CREATE POLICY "Users can view their own health data" 
  ON public.health_data 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health data" 
  ON public.health_data 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health data" 
  ON public.health_data 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health data" 
  ON public.health_data 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_health_data_updated_at ON public.health_data;
CREATE TRIGGER update_health_data_updated_at 
  BEFORE UPDATE ON public.health_data 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
