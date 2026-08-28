# PLAN.md — QR Меню (Світ Кави) — Supabase + Vercel

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
- [x] RLS-політики оновлено через profiles (застосовано до live-БД міграцією).
- [x] Realtime publication для postgres_changes (WebSocket) — застосовано.

### 6.3 Vercel (зроблено)
- [x] Репо `svitkavyvisk-lgtm/svit-kavu-qr-menu-supabase` підключено до Vercel.
- [x] env-змінні: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (тип Config, Production+Preview).
- [x] `main` → Preview, `production` → Production (як на Vercel).
- [x] Прод: `https://svitkavyqrmenu-five.vercel.app`

### 6.4 Перевірено (зроблено)
- [x] Меню: назва, опис, Instagram, категорії, товари — всі дані з Supabase (перевірено в чистому браузері).
- [x] Google OAuth-потік: кнопка → сторінка Google (0 errors).
- [x] Персистентний кошик, sound, Escape-закриття, focus-trap.

### 6.5 Фінал (виконано)

- [x] SQL для RLS + Realtime застосовано до live-БД через Supabase CLI (`supabase db push`, міграції в `supabase/migrations/`).
- [x] Виправлено recursive RLS (помилка `54001 stack depth limit exceeded`): `is_admin_true()` зроблено `SECURITY DEFINER`.
- [x] Оновлено `supabase-schema.sql` (RLS через profiles + Realtime, ідемпотентно).
- [x] Фото/лого через адмінку — завантажується (банер присутній у прод-даних).
- [ ] Ручна перевірка користувачем: повний вхід через Google в адмінку та збереження даних.

---

## Міграції (застосовано)

SQL застосовано до live-БД через Supabase CLI. Міграції зберігаються у `supabase/migrations/`:

- `20260827140000_phase_6_5_rls_realtime.sql` — RLS через profiles + Realtime publication.
- `20260827150000_fix_is_admin_true_security_definer.sql` — фікс recursive RLS (`is_admin_true` → SECURITY DEFINER).

Повторне застосування: `supabase db push` (після `supabase login` + `supabase link --project-ref lwzmfrbgoivbhicwzepn`).

---

## Журнал змін плану

| Дата | Що змінено | Ким |
|---|---|---|
| 2026-08-25 | Створено копію `SVITKAVY-SUPABASE` (міграція Firebase → Supabase + Vercel). Firebase видалено, Supabase SDK встановлено, `lib/supabase.ts` створено, імпорти оновлено, `app/api/menu` переписано. 95 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-25 | Supabase: SQL-схема + seed-дані, Google OAuth налаштовано. Vercel: репо підключено, env додано, прод `svitkavyqrmenu-five.vercel.app` деплоїться | Kilo |
| 2026-08-25 | Виправлено: початковий fetch у subscribe* (Supabase Realtime не надсилає початковий стан — додано явний запит). Перевірено в чистому браузері: назва, опис, Instagram, категорії, товари — з Supabase | Kilo |
| 2026-08-25 | Виявлено: RLS-політики перевіряють JWT role (немає в токені) → 403 при записі. Потрібен SQL-фікс (через profiles) + Realtime publication. Очікує користувача | Kilo |
| 2026-08-27 | Фаза 6.5: RLS через profiles + Realtime застосовано до live-БД через Supabase CLI (`supabase db push`). Виявлено й виправлено recursive RLS (`54001`) — `is_admin_true()` → SECURITY DEFINER. Перевірено: публічне читання 200, анонімний запис заблоковано RLS. Оновлено `supabase-schema.sql` та код (errors, loginWithGoogle, видалено AuthModal). Очікує ручної перевірки входу через Google | Kilo |
| 2026-08-28 | UX-полірування адмінки: прибрано позначки «основна мова» з лейблів текстових полів (категорія/товар: назва, опис, інгредієнти). Бейджі над полями вводу тепер показують поточну мову кабінету (`UA`/`HU`/`EN`) через `LANG_CODE` за `lang`; невикористовувані ключі `*MainShort` видалено. 95 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-28 | Секція фото категорії в адмінці стала як у фото закладу: кроп-модалка (репозиціонування + зум, пропорція 4:3), видалення через ConfirmModal, збереження `photo_x`/`photo_y`/`photo_scale` (таблиця `categories` + міграція `20260828070000_category_photo_crop.sql`), позиція фото поважається у меню (`CategoryCard`). 95 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-28 | Виправлено кадрування фото (банер/лого/категорія): після «Кадрувати» зображення зміщувалось вліво та не збігалось із попапом. Замінено CSS-імітацію (`object-position` + `scale`) на реальне вирізання кадрованої області через `canvas` (`cropImageToWebP`) — прев'ю й меню тепер точно збігаються з кроп-попапом у всіх полях. CSS-позиціонування прибрано з `HeroBanner`/`Header`/`CategoryCard`. 95 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-28 | Виправлено hydration mismatch на `/admin`: `isAuthenticated` ініціалізувався синхронно з `sessionStorage`/`localStorage` (сервер рендерив логін, клієнт — кабінет). Прапор тепер відновлюється у `useEffect` після mount. 95 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-28 | Додано редагування вже обраного фото (банер/лого/категорія): кнопка з іконкою `Edit2` у правому нижньому куті картки відкриває кроп-модалку з поточним зображенням. Переклад `editPhoto` (uk/hu/en). 95 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-28 | Виправлено однакове відображення кропнутого фото на всіх екранах: `cropImageToWebP` форсує точну пропорцію (4:3 категорія, 16:9 банер/лого), контейнери превʼю продубльовано inline `aspectRatio` + `object-cover`. 95 тестів, typecheck, lint — чисто | Kilo |
