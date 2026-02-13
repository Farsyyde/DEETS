-- Create whitelist applications table
create table public.whitelist_applications (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  wallet_address text not null,
  wallet_chain text not null default 'ethereum' check (wallet_chain in ('ethereum', 'solana', 'bitcoin', 'polygon', 'base', 'other')),
  twitter_handle text,
  discord_handle text,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz default now() not null,
  reviewed_at timestamptz
);

-- Enable RLS
alter table public.whitelist_applications enable row level security;

-- Anyone can submit applications (public form)
create policy "Anyone can submit applications"
  on public.whitelist_applications for insert
  with check (true);

-- Project owners can view/update applications
create policy "Owners can view applications"
  on public.whitelist_applications for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = whitelist_applications.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Owners can update applications"
  on public.whitelist_applications for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = whitelist_applications.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- Indexes
create index idx_applications_project on public.whitelist_applications(project_id);
create index idx_applications_status on public.whitelist_applications(project_id, status);
