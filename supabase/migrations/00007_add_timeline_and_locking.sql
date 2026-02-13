-- Add timeline and locking fields to projects
ALTER TABLE public.projects ADD COLUMN is_locked boolean default false not null;
ALTER TABLE public.projects ADD COLUMN locked_at timestamptz;
ALTER TABLE public.projects ADD COLUMN locked_by uuid references public.profiles(id);
ALTER TABLE public.projects ADD COLUMN wl_open_date timestamptz;
ALTER TABLE public.projects ADD COLUMN wl_close_date timestamptz;
ALTER TABLE public.projects ADD COLUMN snapshot_date timestamptz;

-- Add removal tracking to wallets
ALTER TABLE public.wallets ADD COLUMN removed_at timestamptz;
ALTER TABLE public.wallets ADD COLUMN removed_by uuid references public.profiles(id);

-- Add deduplication index to whitelist_applications
-- Prevents the same wallet from having multiple pending applications per project
CREATE UNIQUE INDEX idx_applications_unique
  ON public.whitelist_applications(project_id, lower(wallet_address))
  WHERE status = 'pending';
