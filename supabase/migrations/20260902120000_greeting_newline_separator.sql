-- Greetings are now separated by a newline ("\n") instead of ";".
-- Convert previously seeded admin greetings (separated by "; ") to newlines.

update public.cafe_info
set
  greeting_admin_uk = replace(greeting_admin_uk, '; ', E'\n'),
  greeting_admin_hu = replace(greeting_admin_hu, '; ', E'\n'),
  greeting_admin_en = replace(greeting_admin_en, '; ', E'\n')
where id = 1;
