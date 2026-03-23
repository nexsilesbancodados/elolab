-- Welcome email cron: every 5 minutes
SELECT cron.schedule(
  'welcome-emails',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://gebygucrpipaufrlyqqj.supabase.co/functions/v1/welcome-email',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYnlndWNycGlwYXVmcmx5cXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ2ODAsImV4cCI6MjA4NTM5MDY4MH0.WURCBXjBiAZpk-Qyb3SMu3XQGVvRG07BuCJSURbmouI"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Auto backup cron: every Sunday at 3am
SELECT cron.schedule(
  'auto-backup-weekly',
  '0 3 * * 0',
  $$
  SELECT net.http_post(
    url:='https://gebygucrpipaufrlyqqj.supabase.co/functions/v1/auto-backup',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYnlndWNycGlwYXVmcmx5cXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTQ2ODAsImV4cCI6MjA4NTM5MDY4MH0.WURCBXjBiAZpk-Qyb3SMu3XQGVvRG07BuCJSURbmouI"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);