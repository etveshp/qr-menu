-- Allow showing the QR table number in the menu header and the customer greeting toast.
alter table public.cafe_info
  add column if not exists show_table_number boolean not null default false;
