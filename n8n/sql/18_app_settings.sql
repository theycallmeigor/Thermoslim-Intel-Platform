-- Lightweight key-value config store, used to keep secrets (like Discord webhook URLs)
-- out of the workflow JSON. n8n Cloud Standard plan does not allow env Variables,
-- so we route config through Supabase instead.
--
-- RLS is on with no policies → only the service role (used by n8n's supabaseApi cred)
-- can read or write. Anon clients see nothing.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  notes      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_settings (key, value, notes)
VALUES (
  'winning_alerts_webhook',
  'PASTE_WEBHOOK_URL_HERE',
  'Discord webhook URL for #ad-intel channel — fired by Competitor Winner Alerts workflow when an ad crosses the days_active/score threshold. Update via UPDATE statement. Never log this value.'
)
ON CONFLICT (key) DO NOTHING;
