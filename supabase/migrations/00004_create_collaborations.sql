-- Create collaborations table
create table public.collaborations (
  id uuid default gen_random_uuid() primary key,
  requester_project_id uuid references public.projects(id) on delete cascade not null,
  target_project_id uuid references public.projects(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed')),
  spots_offered integer default 0 not null,
  spots_requested integer default 0 not null,
  message text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.collaborations enable row level security;

-- Project owners can view collabs for their projects
create policy "Owners can view their collabs"
  on public.collaborations for select
  using (
    exists (
      select 1 from public.projects
      where projects.owner_id = auth.uid()
      and (projects.id = collaborations.requester_project_id or projects.id = collaborations.target_project_id)
    )
  );

-- Project owners can create collab requests
create policy "Owners can create collab requests"
  on public.collaborations for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.owner_id = auth.uid()
      and projects.id = collaborations.requester_project_id
    )
  );

-- Project owners can update collabs they're involved in
create policy "Owners can update their collabs"
  on public.collaborations for update
  using (
    exists (
      select 1 from public.projects
      where projects.owner_id = auth.uid()
      and (projects.id = collaborations.requester_project_id or projects.id = collaborations.target_project_id)
    )
  );

-- Auto-update updated_at
create trigger collaborations_updated_at
  before update on public.collaborations
  for each row execute procedure public.update_updated_at();

-- Indexes
create index idx_collabs_requester on public.collaborations(requester_project_id);
create index idx_collabs_target on public.collaborations(target_project_id);
