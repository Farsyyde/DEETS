-- Create projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text,
  chain text not null default 'ethereum' check (chain in ('ethereum', 'solana', 'bitcoin', 'polygon', 'base', 'other')),
  logo_url text,
  banner_url text,
  twitter_url text,
  discord_url text,
  website_url text,
  marketplace_url text,
  mint_date date,
  supply integer,
  mint_price text,
  wl_spots_total integer default 0 not null,
  wl_spots_filled integer default 0 not null,
  gtd_spots_total integer default 0 not null,
  gtd_spots_filled integer default 0 not null,
  is_applications_open boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.projects enable row level security;

-- Owner can do everything with their projects
create policy "Owners can manage their projects"
  on public.projects for all
  using (auth.uid() = owner_id);

-- Anyone can view projects (for collab browsing and public pages)
create policy "Anyone can view projects"
  on public.projects for select
  using (true);

-- Auto-update updated_at
create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.update_updated_at();

-- Index for slug lookups
create index idx_projects_slug on public.projects(slug);
create index idx_projects_owner on public.projects(owner_id);
