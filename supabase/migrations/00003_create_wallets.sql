-- Create wallets table
create table public.wallets (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  address text not null,
  chain text not null default 'ethereum' check (chain in ('ethereum', 'solana', 'bitcoin', 'polygon', 'base', 'other')),
  category text not null default 'wl' check (category in ('wl', 'gtd', 'og', 'team', 'fcfs')),
  label text,
  source text not null default 'manual' check (source in ('manual', 'csv_upload', 'collab', 'application')),
  status text not null default 'active' check (status in ('active', 'removed')),
  added_by uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

-- Prevent duplicate wallets per project+chain
create unique index idx_wallets_unique on public.wallets(project_id, lower(address), chain) where status = 'active';

-- Enable RLS
alter table public.wallets enable row level security;

-- Project owners can manage wallets
create policy "Project owners can manage wallets"
  on public.wallets for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = wallets.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- Anyone can check if a wallet exists (for WL checker)
create policy "Anyone can check wallet existence"
  on public.wallets for select
  using (true);

-- Indexes
create index idx_wallets_project on public.wallets(project_id);
create index idx_wallets_address on public.wallets(lower(address));

-- Trigger to auto-update spot counts on projects
create or replace function public.update_spot_counts()
returns trigger as $$
begin
  -- Update WL spots filled
  update public.projects set
    wl_spots_filled = (
      select count(*) from public.wallets
      where project_id = coalesce(new.project_id, old.project_id)
      and category = 'wl' and status = 'active'
    ),
    gtd_spots_filled = (
      select count(*) from public.wallets
      where project_id = coalesce(new.project_id, old.project_id)
      and category = 'gtd' and status = 'active'
    )
  where id = coalesce(new.project_id, old.project_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger wallets_spot_count
  after insert or update or delete on public.wallets
  for each row execute procedure public.update_spot_counts();
