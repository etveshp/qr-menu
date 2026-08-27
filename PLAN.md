# PLAN.md — QR-Menu (Aura Cafe) — Supabase + Vercel

**Це окрема копія Firebase-версії.** Мігрувала з Firebase (Auth + Firestore + Cloud Run) на Supabase (Auth + Postgres) + Vercel.
Оригінал (Firebase) залишається в папці `SVITKAVY` (проект `etveshp/svit-kavu-qr-menu`).

Акаунти (GitHub, Google, Supabase, Vercel) — окремі від особистих.

## Як працює цей план

- Етапи виконуються **строго по порядку** (Фаза 0 → 1 → 2 → …).
- Після завершення **кожного етапу** обов'язково:
  1. Запуск тестів: `npm test`
  2. Перевірка типів: `npx tsc --noEmit`
  3. Lint: `npm run lint`
  4. Позначення етапу `[x]` у цьому файлі + коротка нотатка «Що зроблено / як підтверджено».
- Якщо етап не можна завершити — позначити `[blocked]` і пояснити причину.
- AGENTS.md зобов'язує дотримуватись цього процесу.

---

## Фази 0–5 (перенесені з Firebase-версії)

Фази 0 (безпека), 1 (архітектура), 2 (функціонал), 3 (тести), 4 (полірування), 5 (деплой) — повністю виконані в оригінальному Firebase-проєкті та перенесені в цю копію.
Змінено лише: Firebase → Supabase, Cloud Run → Vercel, `firestore.rules` → Supabase RLS, `lib/firebase.ts` → `lib/supabase.ts`.

- [x] Всі пункти Фаз 0–5 (деталі в оригінальному PLAN.md Firebase-версії).

---

## Фаза 6 — МІГРАЦІЯ НА SUPABASE + VERCEL

### 6.1 Підготовка (зроблено)
- [x] Клон коду в окрему папку, видалення Firebase, встановлення Supabase SDK.
- [x] `lib/supabase.ts` — той самий інтерфейс, що й `lib/firebase.ts` (get/subscribe/save/delete/auth).
- [x] Оновлено імпорти у 13 файлах, видалено Firebase-конфіги, cloudbuild, Dockerfile, тригери.
- [x] `app/api/menu` переписано під Supabase.
- [x] `lib/errors.ts`, тести auth — під Supabase User.
- [x] 95 тестів, typecheck, lint — все чисто.

### 6.2 Supabase (зроблено)
- [x] SQL-схема (`supabase-schema.sql`): таблиці cafe_info, categories, products, profiles + RLS.
- [x] Seed-дані (`supabase-seed.sql`): cafeInfo, 4 категорії, 6 товарів.
- [x] Google OAuth налаштовано (Client ID/Secret, redirect URI).
- [ ] **Open**: RLS-політики оновити (див. SQL нижче) — поточна версія перевіряє JWT role, потрібна перевірка через profiles.
- [ ] **Open**: Realtime publication для postgres_changes (WebSocket).

### 6.3 Vercel (зроблено)
- [x] Репо `svitkavyvisk-lgtm/svit-kavu-qr-menu-supabase` підключено до Vercel.
- [x] env-змінні: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (тип Config, Production+Preview).
- [x] `main` → Preview, `production` → Production (як на Vercel).
- [x] Прод: `https://svitkavyqrmenu-five.vercel.app`

### 6.4 Перевірено (зроблено)
- [x] Меню: назва, опис, Instagram, категорії, товари — всі дані з Supabase (перевірено в чистому браузері).
- [x] Google OAuth-потік: кнопка → сторінка Google (0 errors).
- [x] Персистентний кошик, sound, Escape-закриття, focus-trap.

### 6.5 Залишилось (open)
- [ ] Виконати SQL для RLS + Realtime (див. низ).
- [ ] Перевірити повний вхід через Google (адмінка) після SQL-фіксу.
- [ ] Завантажити фото/лого через адмінку (після RLS).
- [ ] Оновити `supabase-schema.sql` у репо (додати Realtime publication + profiles RLS).

---

## SQL для завершення Фази 6

Виконати в Supabase SQL Editor:

```sql
-- 1. Додати профіль адміна
insert into public.profiles (id, email, is_admin)
select id, email, true from auth.users where email = 'svitkavyvisk@gmail.com'
on conflict (id) do update set is_admin = true;

-- 2. Оновити RLS-політики (через profiles, не JWT role)
drop policy if exists "cafe_info write: admin" on public.cafe_info;
drop policy if exists "categories write: admin" on public.categories;
drop policy if exists "products write: admin" on public.products;

create policy "cafe_info write: admin" on public.cafe_info for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

create policy "categories write: admin" on public.categories for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

create policy "products write: admin" on public.products for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

-- 3. Увімкнути Realtime для таблиць
alter publication supabase_realtime add table public.cafe_info;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.products;
```

---

## Журнал змін плану

| Дата | Що змінено | Ким |
|---|---|---|
| 2026-08-25 | Створено копію `SVITKAVY-SUPABASE` (міграція Firebase → Supabase + Vercel). Firebase видалено, Supabase SDK встановлено, `lib/supabase.ts` створено, імпорти оновлено, `app/api/menu` переписано. 95 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-25 | Supabase: SQL-схема + seed-дані, Google OAuth налаштовано. Vercel: репо підключено, env додано, прод `svitkavyqrmenu-five.vercel.app` деплоїться | Kilo |
| 2026-08-25 | Виправлено: початковий fetch у subscribe* (Supabase Realtime не надсилає початковий стан — додано явний запит). Перевірено в чистому браузері: назва, опис, Instagram, категорії, товари — з Supabase | Kilo |
| 2026-08-25 | Виявлено: RLS-політики перевіряють JWT role (немає в токені) → 403 при записі. Потрібен SQL-фікс (через profiles) + Realtime publication. Очікує користувача | Kilo |
