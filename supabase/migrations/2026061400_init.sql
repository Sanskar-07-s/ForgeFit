-- ForgeFit AI Database Migration Schema (v4.3)
-- Initial Setup for Supabase PostgreSQL with RLS and Audit Logs

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
    tier text not null check (tier in ('free', 'pro', 'coach')),
    unique(user_id, log_date)
);

---------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES Setup
---------------------------------------------------------

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

-- SUBSCRIPTIONS: Read for all users. Write for Admins.
create policy "Allow read access to subscriptions for all profiles" on public.subscriptions for select using (true);
create policy "Allow admin full access to subscriptions" on public.subscriptions for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- PROFILES: Users read/write their own profiles. Coaches and Admins can view.
create policy "Allow user access to own profile" on public.profiles for all using (auth.uid() = id);
create policy "Allow coach read access to profiles" on public.profiles for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('coach', 'admin'))
);

-- USER PLANS & PAYMENTS: Restrict to owner.
create policy "Allow user access to own plan" on public.user_plans for all using (auth.uid() = user_id);
create policy "Allow user access to own payments" on public.payments for all using (auth.uid() = user_id);

-- EXERCISES & CATEGORIES: Read for all. Write for Admins.
create policy "Allow read access to exercises" on public.exercises for select using (true);
create policy "Allow admin write to exercises" on public.exercises for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Allow read access to exercise categories" on public.exercise_categories for select using (true);
create policy "Allow admin write to categories" on public.exercise_categories for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
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
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Allow user access to own unlocked achievements" on public.user_achievements for all using (auth.uid() = user_id);

create policy "Allow read access to challenges" on public.challenges for select using (true);
create policy "Allow admin write to challenges" on public.challenges for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
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
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Allow user to write error logs" on public.error_logs for insert with check (auth.uid() = user_id);
create policy "Allow admin select access to error logs" on public.error_logs for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Allow user access to own ai usage logs" on public.ai_usage_logs for all using (auth.uid() = user_id);
