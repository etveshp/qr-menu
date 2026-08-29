-- Optional "show until" date for the advertising popup. When set, the popup
-- is no longer shown to clients after this date (inclusive). Null = no limit.

alter table public.advertising
  add column if not exists show_until date;
