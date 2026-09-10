-- Languages enabled in the menu (cards with on/off toggles in cafe settings).
-- Subset of {uk,hu,en}; the default language must be one of them.
alter table public.cafe_info
  add column if not exists enabled_langs text[] not null default '{uk,hu,en}';
