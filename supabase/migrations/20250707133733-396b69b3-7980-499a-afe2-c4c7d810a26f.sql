
-- Remove any existing cron jobs for health alerts to avoid duplicates
SELECT cron.unschedule('daily-health-alerts-analysis');

-- Create a cron job that runs daily at 8:00 AM UTC
SELECT cron.schedule(
  'daily-health-alerts-analysis',
  '0 8 * * *', -- Every day at 8:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://yhgjdhzrmkmgvneuayji.supabase.co/functions/v1/health-alerts-analyzer',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZ2pkaHpybWttZ3ZuZXVheWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzYwOTUsImV4cCI6MjA2NjQ1MjA5NX0.CtqSXVQDZ-vwN83XyjHgAdWvctiX7S_JP8z9Capujk4"}'::jsonb,
        body:='{"automated_run": true}'::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created successfully
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'daily-health-alerts-analysis';
