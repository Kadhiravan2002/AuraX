
-- Create subscriptions table to track user plans
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('free', 'quarterly', 'halfyearly', 'annual')) NOT NULL DEFAULT 'free',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  payment_status TEXT CHECK (payment_status IN ('pending', 'active', 'cancelled', 'expired')) NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions table
CREATE POLICY "Users can view their own subscription" 
  ON public.subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
  ON public.subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
  ON public.subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user subscription (default to free)
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, payment_status, start_date)
  VALUES (
    NEW.id,
    'free',
    'active',
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create free subscription when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Create trigger to update updated_at on subscription changes
CREATE TRIGGER handle_subscription_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = user_uuid 
    AND payment_status = 'active' 
    AND (end_date IS NULL OR end_date > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's current plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  current_plan TEXT;
BEGIN
  SELECT plan INTO current_plan 
  FROM public.subscriptions 
  WHERE user_id = user_uuid 
  AND payment_status = 'active' 
  AND (end_date IS NULL OR end_date > now())
  ORDER BY created_at DESC 
  LIMIT 1;
  
  RETURN COALESCE(current_plan, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
