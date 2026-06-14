-- ForgeFit AI Database Migration (v4.4)
-- Create and secure public.analytics_events table

create table if not exists public.analytics_events (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade, -- matches user id
    event_name text not null,
    metadata jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.analytics_events enable row level security;

-- Users can insert only their own analytics events (prevents spoofing other user events)
create policy "Allow users to insert their own analytics events" 
on public.analytics_events 
for insert 
with check (
    auth.uid() = user_id
);

-- Users can view only their own analytics events
create policy "Allow users to view their own analytics events" 
on public.analytics_events 
for select 
using (
    auth.uid() = user_id
);

-- Admins can view all analytics events
create policy "Allow admins to view all analytics events" 
on public.analytics_events 
for select 
using (
    exists (
        select 1 from public.profiles 
        where id = auth.uid() and role = 'admin'
    )
);
