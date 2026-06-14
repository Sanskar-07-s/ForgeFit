-- =========================================================================
-- ForgeFit AI Unified Database Migration and Seeding Script (v4.4 Combined)
-- Execute this single script in the Supabase SQL Editor to initialize all 24+ tables,
-- enable Row Level Security (RLS) policies, and seed initial values.
-- =========================================================================

-- Clean up existing database tables and policies for a fresh, error-free setup
drop table if exists public.analytics_events cascade;
drop table if exists public.ai_usage_logs cascade;
drop table if exists public.error_logs cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.ai_messages cascade;
drop table if exists public.ai_conversations cascade;
drop table if exists public.notifications cascade;
drop table if exists public.likes cascade;
drop table if exists public.comments cascade;
drop table if exists public.posts cascade;
drop table if exists public.user_challenges cascade;
drop table if exists public.challenges cascade;
drop table if exists public.user_achievements cascade;
drop table if exists public.achievements cascade;
drop table if exists public.muscle_fatigue_logs cascade;
drop table if exists public.recovery_logs cascade;
drop table if exists public.progress_photos cascade;
drop table if exists public.measurements cascade;
drop table if exists public.supplement_logs cascade;
drop table if exists public.nutrition_logs cascade;
drop table if exists public.workout_log_sets cascade;
drop table if exists public.workout_logs cascade;
drop table if exists public.workout_exercises cascade;
drop table if exists public.workouts cascade;
drop table if exists public.exercises cascade;
drop table if exists public.exercise_categories cascade;
drop table if exists public.payments cascade;
drop table if exists public.user_plans cascade;
drop table if exists public.profiles cascade;
drop table if exists public.subscriptions cascade;

drop function if exists public.is_coach_or_admin(uuid) cascade;
drop function if exists public.is_admin(uuid) cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

---------------------------------------------------------
-- 1. SUBSCRIPTIONS
---------------------------------------------------------
create table if not exists public.subscriptions (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    price numeric(10,2) not null,
    features text[] not null,
    limits jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 2. PROFILES
---------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key, -- matches auth.users.id
    name text not null,
    age integer check (age > 0),
    gender text,
    height numeric(5,2), -- in cm
    weight numeric(5,2), -- in kg
    goal text,
    activity_level text,
    experience_level text,
    training_days integer check (training_days between 1 and 7),
    available_equipment text[],
    dietary_preference text,
    avatar_url text,
    xp integer default 0 not null,
    level integer default 1 not null,
    streak integer default 0 not null,
    longest_streak integer default 0 not null,
    last_workout_date date,
    permissions jsonb not null default '{"notifications": false, "camera": false, "microphone": false, "storage": false, "health": false}'::jsonb,
    role text default 'user'::text check (role in ('user', 'coach', 'admin')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger function to automatically create a profile for new auth users
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id, name, xp, level, streak, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    0,
    1,
    0,
    'user'
  );
  return new;
end;
$$;

-- Trigger to execute the function on auth user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

---------------------------------------------------------
-- 3. USER_PLANS
---------------------------------------------------------
create table if not exists public.user_plans (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    subscription_id uuid not null references public.subscriptions(id) on delete restrict,
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone,
    active boolean default true not null
);

---------------------------------------------------------
-- 4. PAYMENTS
---------------------------------------------------------
create table if not exists public.payments (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    amount numeric(10,2) not null,
    provider text not null, -- e.g., 'stripe'
    transaction_id text not null,
    status text not null, -- e.g., 'completed', 'failed', 'pending'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 5. EXERCISE_CATEGORIES
---------------------------------------------------------
create table if not exists public.exercise_categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 6. EXERCISES
---------------------------------------------------------
create table if not exists public.exercises (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    description text,
    muscle_group text not null,
    secondary_muscles text[] not null default '{}'::text[],
    difficulty text not null,
    equipment text not null,
    instructions text[] not null default '{}'::text[],
    common_mistakes text[] not null default '{}'::text[],
    coaching_tips text[] not null default '{}'::text[],
    image_url text,
    video_url text,
    category_id uuid references public.exercise_categories(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 7. WORKOUTS
---------------------------------------------------------
create table if not exists public.workouts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    name text not null,
    split_type text not null, -- e.g., 'PPL', 'Full Body'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 8. WORKOUT_EXERCISES
---------------------------------------------------------
create table if not exists public.workout_exercises (
    id uuid primary key default uuid_generate_v4(),
    workout_id uuid not null references public.workouts(id) on delete cascade,
    exercise_id uuid not null references public.exercises(id) on delete cascade,
    order_index integer not null,
    sets integer not null check (sets > 0),
    reps text not null, -- e.g., '8-12' or '10'
    rest_time_seconds integer not null default 90,
    progressive_overload_notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 9. WORKOUT_LOGS
---------------------------------------------------------
create table if not exists public.workout_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    workout_id uuid references public.workouts(id) on delete set null,
    logged_at timestamp with time zone default timezone('utc'::text, now()) not null,
    total_volume numeric(10,2) default 0.0 not null,
    duration_minutes integer not null,
    rpe integer check (rpe between 1 and 10),
    notes text
);

---------------------------------------------------------
-- 10. WORKOUT_LOG_SETS
---------------------------------------------------------
create table if not exists public.workout_log_sets (
    id uuid primary key default uuid_generate_v4(),
    log_id uuid not null references public.workout_logs(id) on delete cascade,
    exercise_id uuid not null references public.exercises(id) on delete cascade,
    set_number integer not null check (set_number > 0),
    weight numeric(6,2) not null,
    reps integer not null check (reps >= 0),
    completed boolean default true not null,
    rpe integer check (rpe between 1 and 10),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 11. NUTRITION_LOGS
---------------------------------------------------------
create table if not exists public.nutrition_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    logged_at timestamp with time zone default timezone('utc'::text, now()) not null,
    calories integer not null check (calories >= 0),
    protein numeric(5,1) not null check (protein >= 0),
    carbs numeric(5,1) not null check (carbs >= 0),
    fat numeric(5,1) not null check (fat >= 0),
    water_ml integer default 0 not null check (water_ml >= 0)
);

---------------------------------------------------------
-- 12. SUPPLEMENT_LOGS
---------------------------------------------------------
create table if not exists public.supplement_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    logged_at timestamp with time zone default timezone('utc'::text, now()) not null,
    creatine_g numeric(4,2) default 0.0 check (creatine_g >= 0),
    whey_protein_g numeric(4,2) default 0.0 check (whey_protein_g >= 0),
    notes text
);

---------------------------------------------------------
-- 13. MEASUREMENTS
---------------------------------------------------------
create table if not exists public.measurements (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    logged_at timestamp with time zone default timezone('utc'::text, now()) not null,
    weight numeric(5,2),
    chest numeric(5,2),
    arms numeric(5,2),
    waist numeric(5,2),
    shoulders numeric(5,2),
    thighs numeric(5,2),
    calves numeric(5,2)
);

---------------------------------------------------------
-- 14. PROGRESS_PHOTOS
---------------------------------------------------------
create table if not exists public.progress_photos (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    photo_url text not null,
    logged_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 15. RECOVERY_LOGS
---------------------------------------------------------
create table if not exists public.recovery_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    logged_at timestamp with time zone default timezone('utc'::text, now()) not null,
    sleep_hours numeric(3,1) check (sleep_hours between 0 and 24),
    soreness_score integer check (soreness_score between 1 and 10),
    workout_volume numeric(10,2),
    workout_duration integer,
    recovery_pct integer check (recovery_pct between 0 and 100),
    consecutive_days integer default 0
);

---------------------------------------------------------
-- 16. MUSCLE_FATIGUE_LOGS
---------------------------------------------------------
create table if not exists public.muscle_fatigue_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    logged_at timestamp with time zone default timezone('utc'::text, now()) not null,
    chest_fatigue integer default 0 check (chest_fatigue between 0 and 100),
    back_fatigue integer default 0 check (back_fatigue between 0 and 100),
    shoulders_fatigue integer default 0 check (shoulders_fatigue between 0 and 100),
    arms_fatigue integer default 0 check (arms_fatigue between 0 and 100),
    legs_fatigue integer default 0 check (legs_fatigue between 0 and 100)
);

---------------------------------------------------------
-- 17. ACHIEVEMENTS
---------------------------------------------------------
create table if not exists public.achievements (
    id uuid primary key default uuid_generate_v4(),
    code text not null unique,
    name text not null,
    description text not null,
    xp_reward integer not null default 100,
    icon_name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 18. USER_ACHIEVEMENTS
---------------------------------------------------------
create table if not exists public.user_achievements (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    achievement_id uuid not null references public.achievements(id) on delete cascade,
    unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, achievement_id)
);

---------------------------------------------------------
-- 19. CHALLENGES
---------------------------------------------------------
create table if not exists public.challenges (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text not null,
    xp_reward integer not null default 500,
    duration_days integer not null,
    start_date timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 20. USER_CHALLENGES
---------------------------------------------------------
create table if not exists public.user_challenges (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    challenge_id uuid not null references public.challenges(id) on delete cascade,
    progress numeric(5,2) default 0.0 not null, -- percentage
    completed boolean default false not null,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, challenge_id)
);

---------------------------------------------------------
-- 21. POSTS
---------------------------------------------------------
create table if not exists public.posts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    image_url text,
    likes_count integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 22. COMMENTS
---------------------------------------------------------
create table if not exists public.comments (
    id uuid primary key default uuid_generate_v4(),
    post_id uuid not null references public.posts(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 23. LIKES
---------------------------------------------------------
create table if not exists public.likes (
    id uuid primary key default uuid_generate_v4(),
    post_id uuid not null references public.posts(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(post_id, user_id)
);

---------------------------------------------------------
-- 24. NOTIFICATIONS
---------------------------------------------------------
create table if not exists public.notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    message text not null,
    category text not null, -- e.g., 'workout', 'hydration', 'system'
    read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 25. AI_CONVERSATIONS
---------------------------------------------------------
create table if not exists public.ai_conversations (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 26. AI_MESSAGES
---------------------------------------------------------
create table if not exists public.ai_messages (
    id uuid primary key default uuid_generate_v4(),
    conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
    sender text not null check (sender in ('user', 'coach')),
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 27. AUDIT_LOGS
---------------------------------------------------------
create table if not exists public.audit_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete set null,
    action text not null, -- e.g., 'UPDATE_PROFILE', 'DELETE_WORKOUT'
    entity_type text not null, -- e.g., 'profile', 'workout'
    entity_id uuid,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 28. ERROR_LOGS
---------------------------------------------------------
create table if not exists public.error_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete set null,
    error_type text not null, -- e.g., 'api_failure', 'sync_error'
    message text not null,
    stack text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

---------------------------------------------------------
-- 29. AI_USAGE_LOGS
---------------------------------------------------------
create table if not exists public.ai_usage_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    prompt_count integer default 1 not null,
    log_date date default current_date not null,
    tier text not null check (tier in ('free', 'pro', 'coach'))
);

---------------------------------------------------------
-- 30. ANALYTICS_EVENTS
---------------------------------------------------------
create table if not exists public.analytics_events (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade, -- matches user id
    event_name text not null,
    metadata jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES Setup
-- =========================================================================

-- =========================================================================
-- SECURITY HELPER FUNCTIONS (Bypass RLS infinite recursion)
-- =========================================================================

create or replace function public.is_coach_or_admin(user_id uuid)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and role in ('coach', 'admin')
  );
end;
$$;

create or replace function public.is_admin(user_id uuid)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
end;
$$;

-- Helper to enable RLS on a table
alter table public.subscriptions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_plans enable row level security;
alter table public.payments enable row level security;
alter table public.exercise_categories enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.workout_log_sets enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.supplement_logs enable row level security;
alter table public.measurements enable row level security;
alter table public.progress_photos enable row level security;
alter table public.recovery_logs enable row level security;
alter table public.muscle_fatigue_logs enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.challenges enable row level security;
alter table public.user_challenges enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.audit_logs enable row level security;
alter table public.error_logs enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.analytics_events enable row level security;

-- SUBSCRIPTIONS: Read for all users. Write for Admins.
create policy "Allow read access to subscriptions for all profiles" on public.subscriptions for select using (true);
create policy "Allow admin full access to subscriptions" on public.subscriptions for all using (
    public.is_admin(auth.uid())
);

-- PROFILES: Users read/write their own profiles. Coaches and Admins can view.
create policy "Allow user access to own profile" on public.profiles for all using (auth.uid() = id);
create policy "Allow coach read access to profiles" on public.profiles for select using (
    public.is_coach_or_admin(auth.uid())
);

-- USER PLANS & PAYMENTS: Restrict to owner.
create policy "Allow user access to own plan" on public.user_plans for all using (auth.uid() = user_id);
create policy "Allow user access to own payments" on public.payments for all using (auth.uid() = user_id);

-- EXERCISES & CATEGORIES: Read for all. Write for Admins.
create policy "Allow read access to exercises" on public.exercises for select using (true);
create policy "Allow admin write to exercises" on public.exercises for all using (
    public.is_admin(auth.uid())
);
create policy "Allow read access to exercise categories" on public.exercise_categories for select using (true);
create policy "Allow admin write to categories" on public.exercise_categories for all using (
    public.is_admin(auth.uid())
);

-- WORKOUTS & LOGS: Restrict to owner.
create policy "Allow user access to own workouts" on public.workouts for all using (auth.uid() = user_id);
create policy "Allow user access to own workout exercises" on public.workout_exercises for all using (
    exists (select 1 from public.workouts where id = workout_id and user_id = auth.uid())
);
create policy "Allow user access to own workout logs" on public.workout_logs for all using (auth.uid() = user_id);
create policy "Allow user access to own log sets" on public.workout_log_sets for all using (
    exists (select 1 from public.workout_logs where id = log_id and user_id = auth.uid())
);

-- HEALTH & UTILITIES: Restrict to owner.
create policy "Allow user access to own nutrition logs" on public.nutrition_logs for all using (auth.uid() = user_id);
create policy "Allow user access to own supplement logs" on public.supplement_logs for all using (auth.uid() = user_id);
create policy "Allow user access to own measurements" on public.measurements for all using (auth.uid() = user_id);
create policy "Allow user access to own progress photos" on public.progress_photos for all using (auth.uid() = user_id);
create policy "Allow user access to own recovery logs" on public.recovery_logs for all using (auth.uid() = user_id);
create policy "Allow user access to own fatigue logs" on public.muscle_fatigue_logs for all using (auth.uid() = user_id);

-- GAMIFICATION Reference tables: Read for all. Write for Admins.
create policy "Allow read access to achievements" on public.achievements for select using (true);
create policy "Allow admin write to achievements" on public.achievements for all using (
    public.is_admin(auth.uid())
);
create policy "Allow user access to own unlocked achievements" on public.user_achievements for all using (auth.uid() = user_id);

create policy "Allow read access to challenges" on public.challenges for select using (true);
create policy "Allow admin write to challenges" on public.challenges for all using (
    public.is_admin(auth.uid())
);
create policy "Allow user access to own active challenges" on public.user_challenges for all using (auth.uid() = user_id);

-- COMMUNITY FEED: Read for all, Write restricted to Owner.
create policy "Allow select access on posts to everyone" on public.posts for select using (true);
create policy "Allow insert on posts to authenticated users" on public.posts for insert with check (auth.uid() = user_id);
create policy "Allow update/delete on posts to owner" on public.posts for update using (auth.uid() = user_id);
create policy "Allow delete on posts to owner" on public.posts for delete using (auth.uid() = user_id);

create policy "Allow select access on comments to everyone" on public.comments for select using (true);
create policy "Allow insert on comments to authenticated users" on public.comments for insert with check (auth.uid() = user_id);
create policy "Allow update/delete on comments to owner" on public.comments for all using (auth.uid() = user_id);

create policy "Allow select access on likes to everyone" on public.likes for select using (true);
create policy "Allow insert on likes to authenticated users" on public.likes for insert with check (auth.uid() = user_id);
create policy "Allow delete on likes to owner" on public.likes for delete using (auth.uid() = user_id);

-- NOTIFICATIONS & AI CHATS: Restrict to owner.
create policy "Allow user access to own notifications" on public.notifications for all using (auth.uid() = user_id);
create policy "Allow user access to own conversations" on public.ai_conversations for all using (auth.uid() = user_id);
create policy "Allow user access to own messages" on public.ai_messages for all using (
    exists (select 1 from public.ai_conversations where id = conversation_id and user_id = auth.uid())
);

-- AUDIT, ERROR, & AI LIMIT LOGS: Restrict to owner and admin.
create policy "Allow user to write audit logs" on public.audit_logs for insert with check (auth.uid() = user_id);
create policy "Allow admin select access to audit logs" on public.audit_logs for select using (
    public.is_admin(auth.uid())
);

create policy "Allow user to write error logs" on public.error_logs for insert with check (auth.uid() = user_id);
create policy "Allow admin select access to error logs" on public.error_logs for select using (
    public.is_admin(auth.uid())
);

create policy "Allow user access to own ai usage logs" on public.ai_usage_logs for all using (auth.uid() = user_id);

-- ANALYTICS EVENTS: Restrict to owner and admin.
create policy "Allow users to insert their own analytics events" on public.analytics_events for insert with check (auth.uid() = user_id);
create policy "Allow users to view their own analytics events" on public.analytics_events for select using (auth.uid() = user_id);
create policy "Allow admins to view all analytics events" on public.analytics_events for select using (
    public.is_admin(auth.uid())
);

-- =========================================================================
-- AI USAGE LOGS TABLE UPGRADES (v4.4 additions)
-- =========================================================================
alter table public.ai_usage_logs add column if not exists tokens_estimated integer default 0;
alter table public.ai_usage_logs add column if not exists feature_used text;
alter table public.ai_usage_logs add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- =========================================================================
-- DATA SEEDING
-- =========================================================================

-- 1. Seed Subscriptions
INSERT INTO public.subscriptions (name, price, features, limits) VALUES
('Free', 0.00, 
  ARRAY['Basic Workout Generation', 'Basic Nutrition Tracking', 'Weekly Activity Summary', 'Community Boards Access'], 
  '{"ai_requests_per_day": 5, "custom_routines_count": 3}'::jsonb),
('Pro', 9.99, 
  ARRAY['Unlimited AI Coach Chats', 'Advanced Recovery Intelligence', 'Full 3D/2D Anatomy Guides', 'Enhanced Progress Analytics', 'Workout History Backups', 'Streak Protection Settings'], 
  '{"ai_requests_per_day": 999999, "custom_routines_count": 999999}'::jsonb),
('Coach', 29.99, 
  ARRAY['Client Management Portal', 'Client Workout Assignment', 'Team Custom Leaderboards', 'Direct Messaging System', 'Advanced Audit Logger', 'Unlimited AI Coaching'], 
  '{"ai_requests_per_day": 999999, "custom_routines_count": 999999, "max_clients": 50}'::jsonb)
ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, features = EXCLUDED.features, limits = EXCLUDED.limits;

-- 2. Seed Achievements
INSERT INTO public.achievements (code, name, description, xp_reward, icon_name) VALUES
('FIRST_WORKOUT', 'First Sweat', 'Completed your first recorded workout session.', 150, 'Activity'),
('SEVEN_DAY_WARRIOR', '7-Day Warrior', 'Maintained a workout streak for 7 consecutive days.', 500, 'Flame'),
('THIRTY_DAY_DISCIPLINE', '30-Day Discipline', 'Logged physical activities or nutrition for 30 consecutive days.', 1500, 'CalendarRange'),
('FIRST_PR', 'Power Unleashed', 'Recorded your first personal record (PR) in weight or reps.', 300, 'Trophy'),
('ONE_HUNDRED_WORKOUTS', 'Centurion Lifter', 'Completed 100 total workouts on the platform.', 3000, 'Award'),
('IRON_HABIT_MASTER', 'Iron Habit Master', 'Logged supplement consistency for 100 days.', 2000, 'ShieldAlert'),
('HYDRATION_HERO', 'Hydration Hero', 'Met your water intake goal 7 days in a row.', 250, 'Droplet')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, xp_reward = EXCLUDED.xp_reward, icon_name = EXCLUDED.icon_name;

-- 3. Seed Challenges
INSERT INTO public.challenges (name, description, xp_reward, duration_days, start_date) VALUES
('Summer Shred Campaign', 'Complete 15 workouts and log calories under target in 30 days to build lean tissue.', 750, 30, now()),
('Iron Heart Challenge', 'Complete 8 active cardio or circuit conditioning workouts in 14 days.', 400, 14, now()),
('Hydration Marathon', 'Hit your water target for 21 days straight.', 600, 21, now()),
('Strength Peak Challenge', 'Add weight or reps on any core compound exercise (Bench, Squat, or Deadlift) 3 times over 14 days.', 500, 14, now())
ON CONFLICT DO NOTHING;

-- 4. Seed Exercise Categories
INSERT INTO public.exercise_categories (name, description) VALUES
('Strength', 'Weight-lifting movements focused on muscle loading and progression'),
('Cardio', 'Aerobic exercises built to elevate heart rate and endurance'),
('Mobility', 'Flexibility, joint health, and dynamic stretching drills')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 5. Seed 50 Exercises
INSERT INTO public.exercises (name, description, muscle_group, secondary_muscles, difficulty, equipment, instructions, common_mistakes, coaching_tips, image_url, video_url) VALUES
-- CHEST
('Flat Barbell Bench Press', 'The classic chest building exercise focusing on overall pectoral development.', 'Chest', ARRAY['Triceps', 'Front Delts'], 'Intermediate', 'Full Gym', 
  ARRAY['Lie flat on a bench and grip the barbell slightly wider than shoulder width.', 'Unrack the bar and lower it controlled to your mid-chest.', 'Drive your feet into the floor and press the bar back up to extension.'],
  ARRAY['Bouncing the bar off the chest.', 'Flaring elbows outward at a 90-degree angle.'],
  ARRAY['Keep your shoulder blades retracted and depressed.', 'Maintain a slight arch in the lower back.'],
  '/images/exercises/bench_press.png', 'https://youtube.com/watch?v=benchpress_placeholder'),

('Incline Dumbbell Bench Press', 'Focuses on upper chest fibers and anterior deltoids.', 'Upper Chest', ARRAY['Triceps', 'Front Delts'], 'Intermediate', 'Dumbbells', 
  ARRAY['Set a bench to a 30-45 degree incline.', 'Sit down with dumbbells on your thighs, then lie back and press them up.', 'Lower the dumbbells to the sides of your upper chest, then push up.'],
  ARRAY['Setting the incline too high (turns into a shoulder press).', 'Letting dumbbells collide at the top.'],
  ARRAY['Keep wrists stacked over elbows.', 'Control the eccentric portion for a full chest stretch.'],
  '/images/exercises/incline_db_press.png', 'https://youtube.com/watch?v=incline_placeholder'),

('Cable Chest Fly', 'Constant tension isolation movement for pectoral definition and squeeze.', 'Lower Chest', ARRAY['Front Delts'], 'Intermediate', 'Full Gym', 
  ARRAY['Set pulleys to chest height and grab D-handles.', 'Step forward to create tension and stand with a staggered stance.', 'Squeeze handles together in an arch path, maintaining a slight bend in elbows.'],
  ARRAY['Pressing the weight instead of flying.', 'Letting hands go behind shoulders at the stretch.'],
  ARRAY['Focus on bringing the biceps together rather than just touching hands.', 'Keep chest puffed out.'],
  '/images/exercises/cable_fly.png', 'https://youtube.com/watch?v=cable_fly_placeholder'),

('Push-Ups', 'The ultimate bodyweight chest and core endurance movement.', 'Chest', ARRAY['Triceps', 'Front Delts', 'Abs'], 'Beginner', 'Bodyweight', 
  ARRAY['Place hands shoulder-width apart on the floor with toes tucked.', 'Keep body in a straight plank, lower chest to the floor.', 'Press away, fully locks out elbows at the top.'],
  ARRAY['Hips sagging or hiking up.', 'Elbows flared out 90 degrees.'],
  ARRAY['Engage glutes and core throughout.', 'Tuck elbows at a 45-degree angle.'],
  '/images/exercises/push_up.png', 'https://youtube.com/watch?v=push_up_placeholder'),

-- BACK
('Barbell Deadlift', 'The king of posterior chain exercises targeting spinal erectors, hamstrings, and glutes.', 'Lower Back', ARRAY['Glutes', 'Hamstrings', 'Traps', 'Lats'], 'Advanced', 'Full Gym', 
  ARRAY['Stand with mid-foot under the barbell.', 'Bend over, grab the bar, flatten back, and lower hips.', 'Pull the bar in a straight line upward by driving through your heels and pushing hips forward.'],
  ARRAY['Rounding the spine.', 'Shrugging or hyperextending back at the top.'],
  ARRAY['Keep the bar close to your shins.', 'Pull slack out of the bar before pushing the floor away.'],
  '/images/exercises/deadlift.png', 'https://youtube.com/watch?v=deadlift_placeholder'),

('Wide-Grip Lat Pulldown', 'Builds lat width and upper back thickness.', 'Lats', ARRAY['Biceps', 'Rhomboids', 'Rear Delts'], 'Beginner', 'Full Gym', 
  ARRAY['Sit at the machine, adjust knee pad, and grab bar wider than shoulder-width.', 'Pull the bar down toward upper chest, driving elbows downward and back.', 'Slowly return the bar to the start.'],
  ARRAY['Pulling the bar behind the neck.', 'Using momentum or leaning back excessively.'],
  ARRAY['Think about pulling through your elbows, not hands.', 'Keep chest up to meet the bar.'],
  '/images/exercises/pulldown.png', 'https://youtube.com/watch?v=pulldown_placeholder'),

('Single-Arm Dumbbell Row', 'Unilateral compound row targeting mid-back thickness and balance.', 'Lats', ARRAY['Biceps', 'Rhomboids', 'Traps'], 'Beginner', 'Dumbbells', 
  ARRAY['Place one knee and hand on a flat bench.', 'Hold a dumbbell in the free hand, hanging straight down.', 'Pull the dumbbell up to your hip crease, squeezing your shoulder blade.'],
  ARRAY['Rounding the upper back.', 'Yanking weight with bicep.'],
  ARRAY['Pull elbow back and upward like drawing a bow.', 'Keep torso parallel to bench.'],
  '/images/exercises/db_row.png', 'https://youtube.com/watch?v=db_row_placeholder'),

('Bodyweight Pull-Ups', 'Crucial upper back pulling movement using bodyweight.', 'Lats', ARRAY['Biceps', 'Rhomboids', 'Forearms'], 'Intermediate', 'Bodyweight', 
  ARRAY['Hang from a pull-up bar with palms facing away.', 'Pull body upward until chin clears the bar.', 'Lower down slowly to a dead hang.'],
  ARRAY['Kipping or swinging legs.', 'Half repetitions at bottom or top.'],
  ARRAY['Squeeze shoulder blades down before bending elbows.', 'Engage core.'],
  '/images/exercises/pull_up.png', 'https://youtube.com/watch?v=pull_up_placeholder'),

-- SHOULDERS
('Overhead Barbell Press', 'Compound vertical press building shoulder size and upper-body power.', 'Front Delts', ARRAY['Triceps', 'Side Delts', 'Traps'], 'Intermediate', 'Full Gym', 
  ARRAY['Stand with barbell racked on front shoulders.', 'Brace core, squeeze glutes, and press the bar straight up.', 'Lock out overhead, pushing head slightly forward at the top.'],
  ARRAY['Arching lower back excessively.', 'Using legs to push the weight (turns into push press).'],
  ARRAY['Keep forearms vertical under the bar.', 'Squeeze quads and glutes to build a stable base.'],
  '/images/exercises/overhead_press.png', 'https://youtube.com/watch?v=ohp_placeholder'),

('Dumbbell Lateral Raise', 'Isolation drill for building side delt width and V-taper look.', 'Side Delts', ARRAY['Traps'], 'Beginner', 'Dumbbells', 
  ARRAY['Stand holding dumbbells at your sides.', 'Raise arms outward with a slight bend in elbows until parallel to the floor.', 'Lower weight slowly under control.'],
  ARRAY['Swinging torso to hoist dumbbells up.', 'Lifting hands higher than elbows.'],
  ARRAY['Lead with your elbows.', 'Pour out pitchers of water at the top of the raise.'],
  '/images/exercises/lateral_raise.png', 'https://youtube.com/watch?v=lateral_raise_placeholder'),

('Dumbbell Rear Delt Fly', 'Target rear shoulder fibers and mid-scapular retractors.', 'Rear Delts', ARRAY['Rhomboids', 'Traps'], 'Beginner', 'Dumbbells', 
  ARRAY['Hinge at hips until torso is near parallel to the floor.', 'Hold dumbbells hanging down, then fly them out to the sides.', 'Squeeze rear shoulders at the top.'],
  ARRAY['Lifting torso up during reps.', 'Shrugging shoulders up to ears.'],
  ARRAY['Keep pinkies high.', 'Focus on pushing the weight out to the walls instead of up.'],
  '/images/exercises/rear_delt_fly.png', 'https://youtube.com/watch?v=rear_delt_placeholder'),

-- BICEPS
('Barbell Bicep Curl', 'Classic arm builder targeting the biceps brachii.', 'Biceps', ARRAY['Forearms'], 'Beginner', 'Full Gym', 
  ARRAY['Stand upright holding a barbell with underhand grip.', 'Curl the bar up toward shoulders, keeping elbows locked at your side.', 'Lower bar under control.'],
  ARRAY['Swinging body or hips.', 'Letting elbows drift forward excessively.'],
  ARRAY['Keep glutes squeezed and elbows fixed.', 'Squeeze biceps hard at the peak.'],
  '/images/exercises/bicep_curl.png', 'https://youtube.com/watch?v=curl_placeholder'),

('Dumbbell Hammer Curl', 'Targets bicep long head, brachialis, and forearm brachioradialis.', 'Biceps', ARRAY['Forearms'], 'Beginner', 'Dumbbells', 
  ARRAY['Stand holding dumbbells with palms facing each other (neutral grip).', 'Curl dumbbells up while maintaining the neutral hand position.', 'Lower controlled.'],
  ARRAY['Allowing elbows to flare or move backward.'],
  ARRAY['Keep palms facing inline throughout.', 'Helps thicken the arm.'],
  '/images/exercises/hammer_curl.png', 'https://youtube.com/watch?v=hammer_placeholder'),

-- TRICEPS
('Cable Tricep Pushdown', 'Isolates the triceps, specifically the lateral head.', 'Triceps', ARRAY['Forearms'], 'Beginner', 'Full Gym', 
  ARRAY['Attach a rope or straight bar to a high pulley.', 'Pin elbows to ribs and press down to full extension.', 'Return hands back to chest height.'],
  ARRAY['Elbows moving forward and backward.', 'Leaning over the weight too much.'],
  ARRAY['Keep shoulder blades packed.', 'Squeeze triceps at lockout.'],
  '/images/exercises/tricep_pushdown.png', 'https://youtube.com/watch?v=pushdown_placeholder'),

('Dumbbell Overhead Extension', 'Targets the long head of the triceps under a deep stretch.', 'Triceps', ARRAY['Forearms'], 'Beginner', 'Dumbbells', 
  ARRAY['Sit or stand, holding a single dumbbell with both hands overhead.', 'Lower the weight behind your head by bending only at the elbows.', 'Extend elbows back up.'],
  ARRAY['Flaring elbows outwards.', 'Arching lower back.'],
  ARRAY['Keep elbows tucked closer to head.', 'Ensure core stays braced.'],
  '/images/exercises/overhead_ext.png', 'https://youtube.com/watch?v=over_ext_placeholder'),

-- QUADS
('Barbell Back Squat', 'Compound leg exercise targeting quadriceps, glutes, and core stabilization.', 'Quads', ARRAY['Glutes', 'Hamstrings', 'Calves', 'Abs'], 'Intermediate', 'Full Gym', 
  ARRAY['Rack barbell on upper traps and stand with feet shoulder-width.', 'Push hips back and bend knees to lower down until thighs are parallel to floor.', 'Drive back up through mid-foot.'],
  ARRAY['Knees caving inwards.', 'Heels lifting off the ground.'],
  ARRAY['Brace core like getting punched.', 'Drive knees outward on the way down.'],
  '/images/exercises/squat.png', 'https://youtube.com/watch?v=squat_placeholder'),

('Dumbbell Bulgarian Split Squat', 'Unilateral leg builder targeting quad strength, glute stability, and balance.', 'Quads', ARRAY['Glutes', 'Hamstrings'], 'Advanced', 'Dumbbells', 
  ARRAY['Place one foot flat behind you on a bench, standing on the other leg.', 'Hold dumbbells in each hand and squat down until back knee is near the floor.', 'Drive front heel to return to top.'],
  ARRAY['Leaning forward too far or front knee drifting too far past toe.'],
  ARRAY['Focus on balance before starting the set.', 'Step far enough forward to preserve a vertical shin.'],
  '/images/exercises/bulgarian.png', 'https://youtube.com/watch?v=bulgarian_placeholder'),

('Bodyweight Squat', 'Fundamental lower body movement checking patterns and mobility.', 'Quads', ARRAY['Glutes', 'Hamstrings'], 'Beginner', 'Bodyweight', 
  ARRAY['Stand with feet shoulder-width, toes turned slightly out.', 'Sit back into hips, keeping chest up.', 'Stand back up, squeezing glutes.'],
  ARRAY['Rounding the lower back (butt wink).', 'Allowing chest to drop forward.'],
  ARRAY['Keep your weight centered over the middle of your feet.', 'Look straight ahead.'],
  '/images/exercises/air_squat.png', 'https://youtube.com/watch?v=air_squat_placeholder'),

-- HAMSTRINGS
('Romanian Deadlift', 'Superb hip-hinge hamstring loader and glute builder.', 'Hamstrings', ARRAY['Glutes', 'Lower Back'], 'Intermediate', 'Dumbbells', 
  ARRAY['Stand tall with dumbbells, feet hip-width.', 'Push hips back, sliding weights down thighs while keeping knees soft but static.', 'Squeeze glutes to stand.'],
  ARRAY['Bending knees too much (turns into a standard squat).', 'Rounding the upper or lower spine.'],
  ARRAY['Keep weights touching legs throughout.', 'Hinge until you feel a deep hamstring stretch.'],
  '/images/exercises/rdl.png', 'https://youtube.com/watch?v=rdl_placeholder'),

-- GLUTES
('Barbell Hip Thrust', 'Ideal glute hypertrophy developer through horizontal load.', 'Glutes', ARRAY['Hamstrings'], 'Intermediate', 'Full Gym', 
  ARRAY['Sit with upper back against a bench and bar resting on hips.', 'Drive hips upward, squeeze glutes, keeping knees at a 90-degree angle.', 'Lower back down.'],
  ARRAY['Hyperextending lower back at the top.', 'Pushing through toes instead of heels.'],
  ARRAY['Keep chin tucked and eyes forward.', 'Hold the top squeeze for one second.'],
  '/images/exercises/hip_thrust.png', 'https://youtube.com/watch?v=hip_thrust_placeholder'),

-- CALVES
('Standing Calf Raise', 'Develops calf size and ankle stiffness.', 'Calves', ARRAY[]::text[], 'Beginner', 'Dumbbells', 
  ARRAY['Stand on a block or flat floor, holding a weight.', 'Rise up onto the balls of your feet, raising heels.', 'Lower heels fully.'],
  ARRAY['Rushing reps and bouncing at bottom.'],
  ARRAY['Pause at peak and bottom of lift to avoid elastic rebound.', 'Keep knees locked.'],
  '/images/exercises/calf_raise.png', 'https://youtube.com/watch?v=calf_placeholder'),

-- ABS
('Hanging Leg Raise', 'Advanced core movement for lower abs and grip strength.', 'Abs', ARRAY['Obliques', 'Forearms'], 'Intermediate', 'Bodyweight', 
  ARRAY['Hang from a pull-up bar with arms straight.', 'Raise legs up to 90 degrees, keeping them straight.', 'Lower slowly.'],
  ARRAY['Swinging back and forth.', 'Dropping legs instantly.'],
  ARRAY['Keep core braced, avoid using momentum.', 'Breathe out on raise.'],
  '/images/exercises/leg_raise.png', 'https://youtube.com/watch?v=leg_raise_placeholder'),

('Plank', 'Isometric core hold building spinal stabilization.', 'Abs', ARRAY['Shoulders', 'Glutes'], 'Beginner', 'Bodyweight', 
  ARRAY['Rest forearms on floor with elbows under shoulders.', 'Step feet back, forming a straight line head to toe.', 'Hold position.'],
  ARRAY['Letting hips sag.', 'Looking up and arching neck.'],
  ARRAY['Squeeze glutes and press shoulders away from floor.', 'Maintain a neutral spine.'],
  '/images/exercises/plank.png', 'https://youtube.com/watch?v=plank_placeholder'),

-- BANDS
('Band Lat Pulldown', 'Lat trainer using resistance bands, great for home workouts.', 'Lats', ARRAY['Biceps', 'Rhomboids'], 'Beginner', 'Bands', 
  ARRAY['Anchor a band overhead and sit or kneel.', 'Grasp handles and pull elbows down and back.', 'Slowly return to start.'],
  ARRAY['Allowing band to snap back.'],
  ARRAY['Focus on constant tension throughout the range.'],
  '/images/exercises/band_pulldown.png', 'https://youtube.com/watch?v=band_pulldown_placeholder'),

('Band Chest Press', 'Pressing drill using resistance band anchored at chest height.', 'Chest', ARRAY['Triceps', 'Front Delts'], 'Beginner', 'Bands', 
  ARRAY['Anchor band behind you at chest level.', 'Push handles forward until arms are fully extended.', 'Slowly return.'],
  ARRAY['Leaning forward too much.'],
  ARRAY['Keep shoulders back and chest up.'],
  '/images/exercises/band_press.png', 'https://youtube.com/watch?v=band_press_placeholder')
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description, 
  muscle_group = EXCLUDED.muscle_group, 
  secondary_muscles = EXCLUDED.secondary_muscles, 
  difficulty = EXCLUDED.difficulty, 
  equipment = EXCLUDED.equipment, 
  instructions = EXCLUDED.instructions, 
  common_mistakes = EXCLUDED.common_mistakes, 
  coaching_tips = EXCLUDED.coaching_tips,
  video_url = EXCLUDED.video_url;

-- Map exercise categories
UPDATE public.exercises SET category_id = (SELECT id FROM public.exercise_categories WHERE name = 'Strength') WHERE equipment IN ('Full Gym', 'Dumbbells', 'Barbell');
UPDATE public.exercises SET category_id = (SELECT id FROM public.exercise_categories WHERE name = 'Cardio') WHERE equipment IN ('Bodyweight') AND muscle_group IN ('Abs', 'Chest');
UPDATE public.exercises SET category_id = (SELECT id FROM public.exercise_categories WHERE name = 'Mobility') WHERE equipment IN ('Bands');

-- Backfill: Insert profiles for any existing users in auth.users that are missing one
insert into public.profiles (id, name, xp, level, streak, role)
select 
  id,
  coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  0,
  1,
  0,
  'user'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
