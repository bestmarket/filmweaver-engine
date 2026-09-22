
-- =========================================================
-- AI Movie Studio — Phase 1 foundation schema
-- Custom (non-Supabase) authentication: all access goes
-- through server-side code using the service role. Every
-- table has RLS enabled with NO public policies, so anon and
-- authenticated roles can never read or write directly.
-- =========================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TYPE public.app_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE public.user_status AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE public.job_status AS ENUM ('QUEUED','PROCESSING','COMPLETED','FAILED','CANCELLED','RETRYING');
CREATE TYPE public.provider_kind AS ENUM ('LLM','IMAGE','VIDEO','VOICE','MUSIC','STORAGE');
CREATE TYPE public.credit_entry_kind AS ENUM ('GRANT','RESERVE','RELEASE','CONSUME','ADJUST');

-- ---------- identity ----------
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  status public.user_status NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user ON public.sessions(user_id);
CREATE INDEX idx_sessions_expires ON public.sessions(expires_at);

-- ---------- studio ----------
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  logline TEXT,
  genre TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_user ON public.projects(user_id);

CREATE TABLE public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  synopsis TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  target_duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_movies_project ON public.movies(project_id);
CREATE INDEX idx_movies_user ON public.movies(user_id);

CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  appearance JSONB NOT NULL DEFAULT '{}'::jsonb,
  voice_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_characters_project ON public.characters(project_id);
CREATE INDEX idx_characters_user ON public.characters(user_id);

CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_locations_project ON public.locations(project_id);
CREATE INDEX idx_locations_user ON public.locations(user_id);

CREATE TABLE public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  sequence_index INTEGER NOT NULL DEFAULT 0,
  heading TEXT NOT NULL,
  summary TEXT,
  script TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scenes_movie ON public.scenes(movie_id, sequence_index);
CREATE INDEX idx_scenes_user ON public.scenes(user_id);

CREATE TABLE public.shots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  sequence_index INTEGER NOT NULL DEFAULT 0,
  shot_type TEXT,
  camera_movement TEXT,
  prompt TEXT,
  duration_seconds NUMERIC(6,2),
  dialogue TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_shots_scene ON public.shots(scene_id, sequence_index);
CREATE INDEX idx_shots_user ON public.shots(user_id);

CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  shot_id UUID REFERENCES public.shots(id) ON DELETE SET NULL,
  kind public.provider_kind NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'supabase',
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assets_user ON public.assets(user_id);
CREATE INDEX idx_assets_project ON public.assets(project_id);

-- ---------- billing ----------
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'FREE',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  current_period_end TIMESTAMPTZ,
  external_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE public.credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  lifetime_granted INTEGER NOT NULL DEFAULT 0,
  lifetime_consumed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT credit_balance_non_negative CHECK (balance >= 0),
  CONSTRAINT credit_reserved_non_negative CHECK (reserved >= 0)
);

CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  job_id UUID,
  kind public.credit_entry_kind NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  idempotency_key TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX idx_credit_tx_user ON public.credit_transactions(user_id, created_at DESC);

-- ---------- operations ----------
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status public.job_status NOT NULL DEFAULT 'QUEUED',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  priority INTEGER NOT NULL DEFAULT 0,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  error_code TEXT,
  error_message TEXT,
  provider_kind public.provider_kind,
  provider_name TEXT,
  provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  reserved_credits INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX idx_jobs_user ON public.jobs(user_id, created_at DESC);
CREATE INDEX idx_jobs_project ON public.jobs(project_id);
CREATE INDEX idx_jobs_status ON public.jobs(status, priority DESC, created_at);

ALTER TABLE public.credit_transactions
  ADD CONSTRAINT credit_tx_job_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;

CREATE TABLE public.provider_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.provider_kind NOT NULL,
  provider_name TEXT NOT NULL,
  model TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  credential_env_var TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, provider_name, model)
);
CREATE INDEX idx_provider_config_kind ON public.provider_configurations(kind, enabled);

CREATE TABLE public.provider_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  provider_configuration_id UUID REFERENCES public.provider_configurations(id) ON DELETE SET NULL,
  kind public.provider_kind NOT NULL,
  provider_name TEXT NOT NULL,
  model TEXT,
  units NUMERIC(14,4) NOT NULL DEFAULT 0,
  unit_type TEXT NOT NULL DEFAULT 'tokens',
  credits_charged INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  succeeded BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_provider_usage_user ON public.provider_usage(user_id, created_at DESC);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  outcome TEXT NOT NULL DEFAULT 'SUCCESS',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor ON public.audit_logs(actor_user_id, created_at DESC);

-- ---------- updated_at triggers ----------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['app_users','projects','movies','characters','locations','scenes','shots','assets','subscriptions','credit_accounts','jobs','provider_configurations']
  LOOP
    EXECUTE format('CREATE TRIGGER set_%1$s_updated_at BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- ---------- lockdown: server-side access only ----------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['app_users','user_roles','sessions','projects','movies','characters','locations','scenes','shots','assets','subscriptions','credit_accounts','credit_transactions','jobs','provider_configurations','provider_usage','audit_logs']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- ---------- default provider configurations ----------
INSERT INTO public.provider_configurations (kind, provider_name, model, is_default, enabled, credential_env_var, settings) VALUES
  ('LLM','gemini','google/gemini-3.8-flash',true,true,'LOVABLE_API_KEY','{"temperature":0.8}'),
  ('IMAGE','gemini','google/gemini-3.1-flash-image',true,true,'LOVABLE_API_KEY','{}'),
  ('VIDEO','gemini','google/gemini-omni-1.1-flash',true,true,'LOVABLE_API_KEY','{}'),
  ('VOICE','elevenlabs',NULL,true,false,'ELEVENLABS_API_KEY','{}'),
  ('MUSIC','stability',NULL,true,false,'STABILITY_API_KEY','{}'),
  ('STORAGE','supabase','studio-assets',true,true,NULL,'{"bucket":"studio-assets"}');
