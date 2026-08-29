-- Cafe info: localized owner name, cafe name and description (uk/hu/en)
-- Old single-language columns are migrated and then dropped.

alter table public.cafe_info
  add column if not exists owner_name_uk text not null default '',
  add column if not exists owner_name_hu text not null default '',
  add column if not exists owner_name_en text not null default '',
  add column if not exists name_uk text not null default '',
  add column if not exists name_hu text not null default '',
  add column if not exists name_en text not null default '',
  add column if not exists description_uk text not null default '',
  add column if not exists description_hu text not null default '',
  add column if not exists description_en text not null default '';

-- Copy existing values into all three languages
update public.cafe_info set
  owner_name_uk = owner_name, owner_name_hu = owner_name, owner_name_en = owner_name,
  name_uk = name, name_hu = name, name_en = name,
  description_uk = description, description_hu = description, description_en = description
where id = 1;

-- Remove legacy single-language columns
alter table public.cafe_info
  drop column if exists owner_name,
  drop column if exists name,
  drop column if exists description;
