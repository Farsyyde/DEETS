-- Create activity log table
create table public.activity_log (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  actor_id uuid references public.profiles(id),
  action text not null,
  details jsonb,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.activity_log enable row level security;

-- Project owners can view activity
create policy "Owners can view activity"
  on public.activity_log for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = activity_log.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- Allow inserts from authenticated users
create policy "Authenticated users can log activity"
  on public.activity_log for insert
  with check (auth.uid() is not null);

-- Index
create index idx_activity_project on public.activity_log(project_id, created_at desc);
