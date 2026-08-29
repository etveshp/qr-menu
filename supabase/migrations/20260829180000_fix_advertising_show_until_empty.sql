-- Fix advertising.show_until: an empty string ('') can't be cast to a date and
-- was previously written when no "show until" date was selected. Normalise such
-- rows back to NULL (no limit).

update public.advertising
set show_until = null
where show_until is not null and show_until::text = '';
