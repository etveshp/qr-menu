-- Default app language (uk/hu/en) chosen by the owner in "Налаштування закладу".
alter table public.cafe_info
  add column if not exists default_lang text not null default 'uk';
