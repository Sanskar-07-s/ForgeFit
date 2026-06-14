-- ForgeFit AI Database Migration (v4.4)
-- Enhance public.ai_usage_logs table to support granular tracking and rate limits

-- Remove daily unique constraint to allow multiple log entries per day for rate-limiting calculations
alter table public.ai_usage_logs drop constraint if exists ai_usage_logs_user_id_log_date_key;

-- Add tracking columns
alter table public.ai_usage_logs add column if not exists tokens_estimated integer default 0;
alter table public.ai_usage_logs add column if not exists feature_used text;
alter table public.ai_usage_logs add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;
