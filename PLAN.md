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
- [x] Ручна перевірка користувача виконана (2026-09-04): повний вхід через Google в адмінку та збереження даних.

---

## Міграції (застосовано)

SQL застосовано до live-БД через Supabase CLI. Міграції зберігаються у `supabase/migrations/`:

- `20260827140000_phase_6_5_rls_realtime.sql` — RLS через profiles + Realtime publication.
- `20260827150000_fix_is_admin_true_security_definer.sql` — фікс recursive RLS (`is_admin_true` → SECURITY DEFINER).

Повторне застосування: `supabase db push` (після `supabase login` + `supabase link --project-ref lwzmfrbgoivbhicwzepn`).

---

## Фаза 7 — ФОТОБАНЕР (branch `feature/advertising-popup`)

### 7.1 Дані (зроблено)
- [x] Таблиця `advertising` (одна строка, id=1): `photo` (9:16), `delay_seconds`, `enabled`, `updated_at`.
- [x] RLS: публічне читання, запис — лише адміністратор (через profiles). Додано в realtime publication.
- [x] Міграція `20260829150000_advertising_table.sql` + оновлено `supabase-schema.sql`.
- [x] `lib/supabase.ts`: тип `Advertising` + `getAdvertising` / `saveAdvertising` / `subscribeAdvertising` (з localStorage fallback).
- [x] `lib/validation.ts`: `validateAdvertising` + тести.

### 7.2 Адмінка (зроблено)
- [x] Вкладка «Реклама» у Кабінеті адміністратора.
- [x] Завантаження рекламного фото 9:16 через секцію фото (кроп-модалка з пропорцією 9:16, редагування/видалення).
- [x] Поле «Затримка показу (секунд)» — через скільки секунд після входу клієнта в меню показати фотобанер.
- [x] Перемикач увімкнення реклами (вимагає фото перед увімкненням).
- [x] Переклади uk/hu/en для всіх текстів секції.

### 7.3 Клієнтський фотобанер (зроблено)
- [x] `components/menu/AdPopup.tsx` — показується незалежно від екрана меню (категорії/товари/модалки/кошик), бо вбудований у `MenuContainer`.
- [x] Фотобанер 9:16 з невеликими зовнішніми відступами (не на весь екран).
- [x] Закривається тапом на хрестик у правому верхньому куті.
- [x] Показується один раз за завантаження сторінки після заданої затримки.

### 7.4 Перевірка (зроблено)
- [x] `npm test`: 108 тестів (102 + 6 нових AdPopup; у т.ч. 7 нових validateAdvertising).
- [x] `npx tsc --noEmit` — чисто.
- [x] `npm run lint` — чисто.
- [x] Міграції застосовано до live-БД: перевірено `supabase migration list --linked` — усі 16 міграцій (`advertising_table`, `photo_originals`, `advertising_show_until`, `product_photo_original`, `text_banner`, `cafe_greetings`, …) Local == Remote.
- [x] Показ фотобанера в меню підтверджено автоматично (Playwright, анонімний контекст): на десктопі 1280px і на мобільному 390px банер з'являється після затримки; після фіксу 7.29 — детерміновано, картка видима (~240px на десктопі).
- [x] Ручна перевірка користувача виконана (2026-09-04): збереження налаштувань реклами в адмінці (працює з новим Storage-фото).

### 7.5 Повторне кадрування з оригіналу (зроблено)
- [x] Для всіх секцій фото (банер/лого/категорія/реклама) зберігається повне до-кроп «оригінальне» зображення (`banner_original`, `logo_original`, `photo_original`, `photo_original`).
- [x] Повторне відкриття фото для редагування відкриває ОРИГІНАЛЬНЕ фото у масштабі 1 (`zoom = 1`), а не кропнуте.
- [x] Міграція `20260829160000_photo_originals.sql` (застосовано до live-БД) + оновлено `supabase-schema.sql`.
- [x] `lib/supabase.ts`: поля `bannerOriginal`/`logoOriginal`/`photoOriginal`/`photoOriginal` у типах + map/get/update/save.
- [x] `lib/validation.ts`: валідація оригіналів (розмір ≤1MB) + тести (25 тестів у validation.test.ts).
- [x] `npm test` (113 тестів), `npx tsc --noEmit`, `npm run lint` — чисто.
- [x] Ручна перевірка користувача виконана (2026-09-04): повторне відкриття фото для редагування показує оригінал у масштабі 1.

### 7.6 «Показувати до» (зроблено)
- [x] Поле «Показувати до:» (date) у секції фотобанера поруч із затримкою показу.
- [x] Колонка `advertising.show_until` (date, nullable) — міграція `20260829170000_advertising_show_until.sql` (застосовано) + `supabase-schema.sql`.
- [x] `lib/supabase.ts`: поле `showUntil` у типі + map/get/save/subscribe.
- [x] `AdPopup`: фотобанер не показується після дати `showUntil` (сьогодні > showUntil).
- [x] `lib/validation.ts`: перевірка формату дати «YYYY-MM-DD» + тести.
- [x] Переклади uk/hu/en (`adShowUntilLabel`/`adShowUntilHint`).
- [x] `npm test` (116 тестів), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.7 Кастомний дейтпікер (зроблено)
- [x] Новий компонент `components/admin/DatePicker.tsx` — кастомний календар у стилі проєкту (палітра #3E2F26/#C09E6D/#E6DFD5), замість нативного `<input type="date">`.
- [x] Локалізація місяців/днів тижня та кнопок («Сьогодні»/«Очистити») для uk/hu/en.
- [x] Використаний у секції фотобанера («Показувати до:»); навігація місяцями, вибір дня, очищення, закриття кліком поза/`Esc`.
- [x] `npm test` (116 тестів), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.8 Кадрування фото товару (зроблено)
- [x] Фото товару: кадрування 4:3 через кроп-модалку (як категорія) перед збереженням, повторне редагування/видалення збереженого фото.
- [x] Зберігання до-кроп оригіналу: колонка `products.photo_original` — міграція `20260829190000_product_photo_original.sql` (застосовано) + `supabase-schema.sql`.
- [x] `lib/supabase.ts`: `photoOriginal` у типі `Product` + map/save; `lib/validation.ts`: валідація + тести (30 тестів).
- [x] Прев'ю фото товару в адмінці приведено до 4:3 (відповідає відображенню в меню).
- [x] `npm test` (118 тестів), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.9 Реструктуризація секції «Фотобанер» (зроблено)
- [x] У секції залишено лише: заголовок, повний опис типу реклами та кнопку «Додати фотобанер».
- [x] Клік по кнопці відкриває сайдбар справа (`AdminDrawer`), у який перенесено весь функціонал створення фотобанера (фото 9:16 + кроп, затримка, «Показувати до», перемикач активності, збереження).
- [x] Переклади: розгорнутий `advertisingSubtitle`, `advertisingSubtitleShort`, `addAdPopup` (uk/hu/en).
- [x] `npm test` (118 тестів), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.10 Оформлення секції «Фотобанер» (зроблено)
- [x] Кнопка «Додати фотобанер» — на всю ширину, світліша (палітра #F1ECE3/#4A3B32 замість темної).
- [x] Опис перероблено з суцільного тексту на маркований список особливостей (`ADVERTISING_FEATURES` у `lib/translations.ts`, по 6 пунктів для uk/hu/en).
- [x] `npm test` (118 тестів), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.11 Текстовий банер (зроблено)
- [x] Таблиця `text_banner` (id=1: `text`, `category_id`, `product_id`, `enabled`) + RLS + realtime; міграція `20260829200000_text_banner.sql` (застосовано) + `supabase-schema.sql`.
- [x] `lib/supabase.ts`: тип `TextBanner` + `getTextBanner` / `saveTextBanner` / `subscribeTextBanner`; `lib/validation.ts`: `validateTextBanner` + тести.
- [x] Адмінка: нова секція «Текстовий банер» у розділі «Реклама» (опис-маркований список + кнопка «Додати банер»), яка відкриває сайдбар (`AdminDrawer`) з налаштуваннями: текст+емодзі, лінк «категорія → товар», перемикач активності, збереження.
- [x] Меню: компонент `TextBanner.tsx` — стікі під хедером, повна ширина, половина висоти хедера, хрестик закриття справа, перехід на акційний товар; підключено в `MenuContainer`.
- [x] Переклади uk/hu/en: секція, кнопка, поля, підказки (`textBanner*`), особливості (`TEXT_BANNER_FEATURES`).
- [x] `npm test` (128 тестів), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.12 Секція «Привітання» (зроблено)
- [x] Колонки `cafe_info`: `greeting_customer_uk/hu/en`, `greeting_customer_enabled`, `greeting_admin_uk/hu/en`, `greeting_admin_enabled` — міграція `20260902100000_cafe_greetings.sql` (застосовано) + `supabase-schema.sql`.
- [x] `lib/supabase.ts`: поля в `CafeInfo`, хелпери `getCafeCustomerGreeting`/`getCafeAdminGreeting`, `mapCafeInfo`, get/update/subscribe.
- [x] Адмінка: секція «Привітання» перед зміною пароля — поля привітання клієнтів і адміна (в поточну мову кабінету) + тумблери ввімкнення + збереження.
- [x] Клієнт: `HeroBanner` показує привітання клієнтів (якщо ввімкнено); адмін-велком попап показує привітання адміна (якщо ввімкнено).
- [x] `lib/validation.ts`: валідація greeting (≤500) + тести; переклади uk/hu/en.
- [x] `npm test` (131 тест), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.13 Багаторядкові привітання (зроблено)
- [x] Поля привітань стали багаторядковими (`textarea`), в яких зберігаються кілька привітань, розділених `;`.
- [x] `lib/supabase.ts`: хелпер `getRandomGreeting(raw)` — розбиває по `;`, обирає випадкове привітання.
- [x] Клієнт (HeroBanner) та адмін-welcome-попап показують **випадкове** привітання зі списку.
- [x] `lib/validation.ts`: ліміт привітань збільшено до 2000; тести `getRandomGreeting` (4 кейси).
- [x] `npm test` (135 тест), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.14 Перенесення hardcoded-привітань у БД (зроблено)
- [x] Хардкодові привітання з `lib/translations.ts` (клієнтське `welcome`; адмінські `welcomeMsg1..5`) перенесено в БД: `cafe_info.greeting_customer_*` та `greeting_admin_*`.
- [x] Міграція `20260902110000_seed_cafe_greetings.sql` (застосовано): заповнює поля українською/угорською/англійською та вмикає обидва тумблери.
- [x] `supabase-seed.sql`: колонки привітань додано в insert (для свіжих БД).
- [x] Тепер привітання показуються в застосунку **з БД** (HeroBanner — клієнтське; welcome-попап — адмінське).
- [x] `npm test` (135 тест), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.15 Розділення привітань переносом рядка (зроблено)
- [x] `getRandomGreeting` тепер розділяє привітання за `\n` (сумісно з `;` для старих даних).
- [x] Міграція `20260902120000_greeting_newline_separator.sql` (застосовано): конвертує `'; '` → `E'\n'` у `greeting_admin_*`.
- [x] `supabase-seed.sql` + плейсхолдери uk/hu/en — поділ привітань через `\n`.
- [x] `npm test` (136 тест), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.16 Keep-alive (щоденний «штовхання» проєкту) (зроблено)
- [x] `vercel.json`: Vercel Cron Job — щодня о 00:00 UTC викликає `/api/menu` (цей ендпоінт робить запити до Supabase: cafe_info/categories/products).
- [x] Мета: тримати Supabase-проєкт «живим» (не засинає від бездіяльності) і прогрівати serverless-деплой.
- [x] Альтернатива: зовнішній моніторинг (UptimeRobot/healthchecks.io) із щоденним пінгом `/api/menu` — без змін у коді.
- [x] Перевірка: `vercel.json` валідний, крон створюється після деплою (Settings → Cron Jobs).

### 7.17 Google-вхід: не-адмін → на головну (зроблено)
- [x] `loginWithGoogle` (lib/supabase.ts): `redirectTo` змінено з `/admin` на `/` — після OAuth Supabase повертає на корінь сайту.
- [x] `MenuContainer`: pending-прапорець очищується незалежно від ролі, а редірект у `/admin` робиться лише для адміна — не-адмін залишається в меню.
- [x] `app/admin/page.tsx`: `PENDING_ADMIN_REDIRECT_KEY` очищується у гілці «не адмін» перед `router.replace('/')`.
- [x] `npm test` (136 тест), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.18 Слоган у HeroBanner + клієнтський greet-попап (зроблено)
- [x] `HeroBanner`: під назвою закладу тепер показується **слоган** (опис закладу з БД / fallback `welcomeDesc`), а не привітання.
- [x] Клієнтське привітання показується **попапом** (як адмінський welcome): один раз за сесію, коли `greeting_customer_enabled`.
- [x] Текст у попапі — **випадкове** привітання зі списку в БД (`getRandomGreeting(getCafeCustomerGreeting(...))`); переклади `greetingPopupTitle`/`greetingPopupOk` (uk/hu/en).
- [x] `npm test` (136 тест), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.19 Виправлення футера + центрування полів у налаштуваннях (зроблено)
- [x] Гілка `fix/footer-sticky-bottom` від `main`.
- [x] Футер у меню тепер притискається до низу екрана: зовнішній контейнер `MenuContainer` став `flex flex-col` (+ `min-h-screen`), `<main>` отримав `flex-1` — футер не «пливе» вгору при короткому контенті.
- [x] Налаштування закладу (адмінка): поля «Назва закладу» та «Посилання на Instagram» на десктопі (`md:grid-cols-2`) тепер на одному рівні — у рядок заголовка Instagram-поля додано невидимий бейдж поточної мови тієї ж висоти, що й бейдж у поля назви.
- [x] `npm test` (136 тест), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.20 Google-вхід: адмін одразу в кабінеті (зроблено)
- [x] `loginWithGoogle` (lib/supabase.ts): `redirectTo` змінено з `/` на `/admin` — після OAuth адмін одразу відкриває кабінет.
- [x] Видалено `PENDING_ADMIN_REDIRECT_KEY` (lib/supabase.ts, app/admin/page.tsx, MenuContainer.tsx) — прибрано крихкий проміжний перехід через меню.
- [x] Не-адміни, які опинились на `/admin`, викидаються назад у меню (`handleAuthUser` → `logoutUser` + `router.replace('/')`).
- [x] `npm test` (136 тест), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.21 Сторінка входу: прибрано мигання стороннього логотипа (зроблено)
- [x] `app/admin/page.tsx`: fallback-заглушка з іконкою `Coffee` замінена на пустий спейсер тих самих розмірів (`w-44 sm:w-52 h-16 sm:h-20`) — більше не блимає стороння кавова чашка, поки `cafeInfo` завантажується.
- [x] Імпорт `Coffee` залишено — ще використовується в кабінеті (секції без логотипа).
- [x] `npm test` (136 тест), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.22 Сторінка входу: прибрано мигання назви «Світ Кави QR Меню» (зроблено)
- [x] `app/admin/page.tsx`: назва на сторінці входу рендериться лише коли `cafeInfo` доступний (`cafeInfo ? getCafeName(...) || t('appName') : ''`) — інакше залишається порожньою, тож «Світ Кави QR Меню» більше не мигає.
- [x] `npm test` (136 тест), `npx tsc --noEmit`, `npm run lint` — чисто.

### 7.23 Апгрейд Next.js 15.5.23 → 16.3.4 (зроблено, гілка `upgrade/next-16`)
- [x] Node v24.18.0 (вимога ≥ 20.9 виконана); codemod `npx @next/codemod@canary upgrade latest`.
- [x] `next.config.ts`: видалено `eslint: {...}` (опція прибрана в 16) та webpack-хук `DISABLE_HMR` (Turbopack — новий дефолт build; кастомний webpack ламає збірку).
- [x] Видалено codemod-експорти `export const instant = false` з `app/layout.tsx` / `app/page.tsx` — валідні лише з `cacheComponents: true`, який не використовується.
- [x] ESLint відкотито до `^9.39.1`: codemod поставив 10.9.1, але плагіни `eslint-config-next` вимагають `^9` (lint падав).
- [x] `tsconfig.json` (`jsx: react-jsx`, `.next/dev/types`) і `next-env.d.ts` оновлені codemod-ом; очищено застарілий кеш `.next`.
- [x] Верифікація: `npm run build` (Turbopack) успішний, 136 тестів, `tsc --noEmit`, lint — чисто.

### 7.24 Перемикачі привітань: не вимикали показ (зроблено, гілка `upgrade/next-16`)
- [x] Знайдено баг: welcome-попап адміна показувався завжди — `(enabled ? greeting : '') || t(welcomeMsgKey)` відкочувався на статичний текст. Ефект тепер гейтується `cafeInfo?.greetingAdminEnabled` (+ усунено гонку з `hasShownWelcomeRef`).
- [x] `/api/menu` тепер віддає greeting-поля (uk/hu/en + enabled) — SSR-дані не конфліктують із localStorage-кешем.
- [x] e2e-перевірка (Playwright): клієнтський попап показується при enabled=true; RLS блокує анонімний запис перемикачів; `/`, `/admin`, `/api/menu` → 200.
- [x] 136 тестів, `tsc --noEmit`, lint — чисто.

### 7.25 Налаштування закладу: поля в 2 колонки (зроблено, гілка `upgrade/next-16`)
- [x] Рядок 1: «Назва закладу» + «Слоган»; рядок 2: «Посилання на Instagram» + «Ім'я власника» (`grid md:grid-cols-2`). На мобільних — стовпчик.
- [x] Вирівняно заголовки пар (спейсер Instagram = висота бейджа сусіда) та паддінги інпутів.
- [x] 136 тестів, `tsc --noEmit`, lint — чисто.

### 7.26 Видалення категорії: попередження про страви (зроблено, гілка `upgrade/next-16`)
- [x] ConfirmModal: проп `warning` (червоний блок з іконкою AlertTriangle).
- [x] Видалення категорії зі стравами: замість блокування тостом — попередження «У цій категорії N страв(и)… видалені разом з категорією» + підтвердження; переклади uk/hu/en (`deleteCategoryWithProductsWarning`).
- [x] `deleteTarget` несе `productsCount`; `performDeleteCategory` більше не блокує непорожні категорії.
- [x] 136 тестів, `tsc --noEmit`, lint — чисто.

### 7.27 Тости в палітрі застосунку + підсвічування порожніх полів пароля (зроблено)
- [x] `Toast.tsx`: тости більше не використовують «системні» зелені/червоні кольори — усі типи в палітрі кави (#FDFBF7/#E6DFD5), тип передається іконкою (CheckCircle2/AlertCircle) з делікатним тоном (#C09E6D / #8E7A68).
- [x] `Toast.tsx`: контейнер тостів — на мобільних по центру знизу на всю ширину; на планшеті/десктопі (`sm:`) — праворуч знизу (автоширина, `sm:right-6 sm:items-end`).
- [x] Адмінка, обидві форми зміни пароля (екран відновлення та секція в налаштуваннях): незаповнені обов'язкові поля підсвічуються (плейсхолдер `requiredField` + rose-рамка) замість загальної помилки; підсвічування знімається при введенні/фокусі (`changePassInvalidFields`).
- [x] Переклад `requiredField` уже був в uk/hu/en — нових ключів не додано.
- [x] 136 тестів, `tsc --noEmit`, lint — чисто.

### 7.28 Фікс деплою на Vercel: `output: standalone` ламає збірку на Next 16.3 (зроблено)
- [x] Знайдено: усі деплої на Vercel після апгрейду Next 16 падали з `ENOENT .next/next-server.js.nft.json` в `onBuildComplete`.
- [x] Причина — відомий баг Next 16.3 (vercel/next.js #96646): `output: 'standalone'` у `next.config.ts` (пережиток Cloud Run) — Next 16.3 більше не пише `.nft.json`, а Vercel його очікує; локально збірка проходить, бо без `onBuildComplete`.
- [x] Виправлено: `output: 'standalone'` видалено з `next.config.ts` (проєкт деплоїться тільки на Vercel, standalone не потрібен — немає ні Dockerfile, ні Cloud Run).
- [x] `npm run build` — успішно, 136 тестів, `tsc --noEmit`, lint — чисто.

### 7.29 Фотобанер у меню: не показувався на широких екранах і випадково зникав (зроблено)
- [x] Причина 1 (гонка в dev): `AdPopup` тримав таймер показу у спільному `timerRef`, а React StrictMode монтує ефект двічі — коли callback «мертвої» підписки (її in-flight fetch усе ще резолвиться після cleanup) спрацьовував після «живої», він скидав її таймер через `clearTimeout` → банер не з'являвся взагалі (порядок резолву двох паралельних fetch — випадковий).
- [x] Фікс 1: таймер став локальним для кожного запуску ефекту (не спільний ref) — «мертве» замикання більше не може знищити таймер «живого».
- [x] Причина 2 (CSS): на `sm:`+ картка фотобанера мала `w-auto` при відсутності потокового контенту (Image `fill` + абсолютна кнопка) → ширина схлопувалася до ~2px і банер був невидимий на десктопі/планшеті (на мобільному працював `w-full max-w-[320px]`).
- [x] Фікс 2: `sm:w-auto` → `sm:w-[240px] sm:max-w-none` — картка 9:16 рендериться 240px на десктопі/планшеті, 320px на мобільному.
- [x] Регресійний тест: «still shows the popup when a stale StrictMode subscription fires after the live one» (падає на старому коді, проходить на новому). 137 тестів, `tsc --noEmit`, lint — чисто.

### 7.30 CI workflow: GitHub Actions на push/PR у `main` (зроблено)
- [x] `.github/workflows/ci.yml`: тригери — `push` і `pull_request` на гілку `main` (Vercel деплоїть Preview з `main`, тож регресії не доїдуть до деплою без перевірки).
- [x] Кроки (ubuntu-latest, Node 22 з npm-кешем): `npm ci` → `npm test` → `npx tsc --noEmit` → `npm run lint` → `npm run build`; таймаут 20 хв.
- [x] Секретів не потрібно: `lib/supabase.ts` створює клієнта лише за наявності `NEXT_PUBLIC_SUPABASE_*` (інакше `null`), а SSR-фетч `/api/menu` у `app/page.tsx` обгорнуто в try/catch — `next build` у CI проходить без env.
- [x] Локальний прогін усього ланцюжка CI: 137 тестів, `tsc --noEmit`, lint, `npm run build` — чисто.

### 7.31 Фото в Supabase Storage: base64-колонки → публічні URL (зроблено; до live-БД НЕ застосовано)
- [x] `lib/photo-storage.ts` — чисті хелпери: детерміновані шляхи об'єктів (`cafe/banner.webp`, `categories/<id>.webp`, `products/<id>-original.webp`, `advertising/popup.webp`), розпізнавання data-URI/MIME, `objectPublicUrl`/`storagePathFromPublicUrl` (зворотне перетворення).
- [x] `lib/supabase.ts`: `storeOrKeep` — data-URI завантажується в Storage (upsert на той самий шлях, тож повторний кроп перезаписує об'єкт, а не накопичує сміття) і повертає публічний URL; не-data значення проходять як є. Якщо бакета/політик ще нема (міграцію не застосовано) — inline-значення зберігається, збереження не ламається. Підключено в `updateCafeInfo`, `saveCategory`, `saveProduct`, `saveAdvertising` (включно з `*Original`). Колонки й типи не змінювались, UI адмінки/меню не чіпали — рядки тепер тримають URL замість base64.
- [x] `next.config.ts`: дозволено remote-оптимізацію зображень `**.supabase.co/storage/**` для `next/image`.
- [x] Міграція `20260904100000_photo_storage.sql`: публічний бакет `menu-photos` (5MB, image/*) + політики RLS на `storage.objects`: читання — анонімам, запис — лише адмінам (той самий патерн `profiles.is_admin`, що в таблицях).
- [x] `scripts/backfill-photos.mjs` (+ `npm run backfill:photos`): одноразовий перенос наявних base64-значень (cafe_info, advertising, categories, products — фото й оригінали) у Storage через service-role ключ; ідемпотентний (пропускає вже URL).
- [x] Тести `lib/__tests__/photo-storage.test.ts` (7 тестів: розпізнавання data-URI, MIME, шляхи, round-trip URL). 144 тести, `tsc --noEmit`, lint, `npm run build` — чисто.
- [x] Міграцію `20260904100000_photo_storage.sql` застосовано до live-БД (`supabase db push`, 2026-09-04); бакет `menu-photos` існує й віддає публічні об'єкти (перевірено: неіснуючий об'єкт → 404 "Object not found"; публічне читання анонімом працює).
- [x] Код фази 7.31 (і 7.30 CI) закомічено й запушено в `main` + `production` (коміт `425a4a7`) — Vercel деплоїть.
- [x] `npm run backfill:photos` виконано з service-role ключем (2026-09-04): 6 об'єктів завантажено, 3 рядки оновлено — cafe_info (banner, logo), advertising (photo, photo_original), категорія з base64-фото. Товари та інші категорії вже мали Unsplash-URL — не чіпались. Перевірено: у БД публічні Storage-URL, банер віддається HTTP 200 (image/webp).

### 7.32 Розкрита картка страви: назва і ціна «напливають» над фото при скролі (зроблено, гілка `feat/product-modal-title-overlay`)
- [x] `lib/title-float.ts` — чиста геометрія `computeTitleFloat(scrollTop, paddingTop, rowHeight)`: прогрес 0..1, зсув копії (`cloneBottom`), прозорості копії/оригінального рядка, висота та прозорість градієнта; клампування за межі, захист від нульової висоти рядка.
- [x] `ProductModal.tsx`: фото-блок отримав `overflow-hidden` + оверлей (`z-[5]`, `pointer-events-none`, `aria-hidden`): затемнюючий градієнт знизу фото (висота зростає з прогресом — «пропагується вверх» рівно на висоту рядка + 12px) і світла копія «назва + ціна», що піднімається над фото і зупиняється, коли нижній край збігається з нижнім краєм фото. Оригінальний рядок у потоці згасає синхронно (cross-fade) і, як раніше, ховається під фото разом з описом. Вимірювання: ResizeObserver на рядку + `getComputedStyle` падінгів (коректно на мобільному/десктопі, після завантаження шрифтів), `passive` scroll-listener, очищення при зміні товару/розмонтуванні.
- [x] Тести `lib/__tests__/title-float.test.ts` (7 тестів: спокій, старт напливу на межі фото, повний наплив, cross-fade на середині, клампування, захист від 0-висоти).
- [x] Перевірено: 151 тест (20 файлів), `tsc --noEmit`, lint, `npm run build` — чисто. Візуально: десктоп 1280×800 та мобільний 390×844 (Playwright + прев'ю) — rest → max → back: рядок у потоці → білий текст поверх фото з градієнтом (десктоп: градієнт 50px, `sm:p-6`/`text-3xl`) → повернення; опис ховається під фото як раніше.

---

## Фаза 8 — ПОРЯДОК КАТЕГОРІЙ І СТРАВ (drag & drop в адмінці)

Мета: категорії та страви можна впорядкувати перетягуванням в кабінеті адміна
(довгий тап/затискання на кебабі `⋮` — картка «відділяється» і переміщується).
Порядок зберігається в БД і відображається в меню.

### 8.1 Міграція БД (виконано)
- [x] Колонки `categories.sort_order` та `products.sort_order` (`integer not null default 0`).
- [x] Backfill: категорії `row_number() over (order by created_at, id) - 1`; товари per-category `row_number() over (partition by category_id order by created_at, id) - 1`.
- [x] Міграція `20260904120000_add_sort_order.sql` + оновлено `supabase-schema.sql`.
- [x] Застосовано до live-БД (`supabase db push`, supabase link) — 2026-09-04.

### 8.2 Типи та читання (порядок з'являється в меню й адмінці) (виконано)
- [x] `Category.sortOrder` / `Product.sortOrder` у типах + `mapCategory`/`mapProduct` (`lib/supabase.ts`).
- [x] `/api/menu` (`app/api/menu/route.ts`): `.order('sort_order')` + поле `sortOrder` у JSON.
- [x] `.order('sort_order')` у `getCategories/subscribeCategories/getProducts/subscribeProducts`.
- [x] Перевірки: `npm test`, `npx tsc --noEmit`, `npm run lint`.

### 8.3 Збереження порядку (виконано)
- [x] `reorderCategories(orderedIds)` / `reorderProducts(orderedIds)` (батч-upsert `sort_order 0..n` + localStorage).
- [x] Новим записам — `sort_order = max + 1`; зміна `categoryId` товару → кінець нової категорії.
- [x] Юніт-тести чистої логіки reorder/призначення порядку (`lib/__tests__/reorder.test.ts`, 11 тестів).

### 8.4 Drag & drop в адмінці (виконано, dnd-kit)
- [x] Додано залежності `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- [x] Категорії: сітка вкладки Categories перетягується за `⋮` (long-press на тачі).
- [x] Страви: перетягування у вкладці Products при виборі конкретної категорії; у «Всі» вимкнено + підказка (`reorderPickCategory`).
- [x] Кебаб: короткий тап → Edit/Delete, довгий → drag; картка «відділяється» (shadow/ring/scale + live-зсув інших карток); після drag прибрано випадковий click-відкриття панелі.
- [x] Drop → збереження (8.3) + відкат/toast при помилці; переклади підказки uk/hu/en.

### 8.5 Realtime без «шторму» (виконано)
- [x] Debounce (250 мс) повторного рефетчу в `subscribeCategories`/`subscribeProducts`.

### 8.6 Перевірки (частково)
- [x] `npm test` (162), `npx tsc --noEmit`, `npm run lint`, `npm run build` — чисто.
- [x] Меню завантажується з `.order('sort_order')` (перевірено в браузері, 0 console-errors; live-БД вже з колонкою).
- [ ] Авто/Playwright-перевірка самого drag у кабінеті (потребує адмін-сесії — окремо).
- [ ] Ручна перевірка користувача (перетягування категорій/страв в адмінці → збереження → порядок у меню).

---

## Фаза 9 — КЕШУВАННЯ МЕНЮ (гілка `feat/menu-caching`)

Мета: меню рідко змінюється — прибрати повторні повні SELECT до Supabase з кожного
завантаження сторінки, зберігши миттєві оновлення при змінах адміна.
Варіант 1 (SSR як джерело + Realtime лише для змін) + Варіант 3 (on-demand revalidation).

### 9.1 SSR як джерело (Варіант 1) (виконано)
- [x] `/api/menu` віддає разом із меню також `textBanner` і `advertising` (по одному рядку) — весь клієнтський стан меню береться з одного SSR-пакета.
- [x] Підписки меню отримали опцію `skipInitial` (`subscribeCafeInfo`/`subscribeCategories`/`subscribeProducts`/`subscribeTextBanner`/`subscribeAdvertising`); початковий `select('*')` виконується лише коли SSR-даних немає (fallback).
- [x] `useMenuData`: `loading` починається як `false`, коли SSR є; категорії/товари сідяться з SSR. `MenuContainer` сіє `textBanner` і передає `initialAd` у `AdPopup` (той одразу планує показ із SSR-набору, не роблячи fetch).
- [x] DELETE-обробка в `subscribeCategories` переведена на debounce-рефетч (не можна паталжити локальний кеш при `skipInitial`).

### 9.2 On-demand ревалідація (Варіант 3) (виконано)
- [x] `app/page.tsx`: SSR-fetch `/api/menu` отримав `tags: ['menu']` (із `revalidate: 30`).
- [x] `app/api/revalidate/route.ts` (POST): перевіряє Supabase-токен авторизації, підтверджує `profiles.is_admin` через RLS і викликає `revalidateTag('menu', { expire: 0 })`.
- [x] У `lib/supabase.ts` усі записи меню (updateCafeInfo, saveCategory/deleteCategory/reorderCategories, saveProduct/deleteProduct/reorderProducts, saveTextBanner, saveAdvertising) після успішного Supabase-запису fire-and-forget викликають `triggerMenuRevalidation()`.
- [x] `/api/menu` більше не кешується на CDN (`Cache-Control: no-store`) — регенерацію сторінки контролює лише ISR+tag.

### 9.3 Перевірки (частково)
- [x] `npm test` (163), `npx tsc --noEmit`, `npm run lint`, `npm run build` — чисто.
- [x] Браузерна перевірка: сторінка меню відкривається з SSR-даними; у Network **0 клієнтських `rest/v1` SELECT** (лише realtime), 0 console-errors/warnings.
- [ ] Ручна перевірка користувача: зміна в адмінці → відкрите меню оновлюється через realtime; новий відвідувач одразу отримує свіжий HTML після on-demand ревалідації.

---

## Фаза 10 — РОЗКРИТА КАРТКА ТОВАРУ: ГОРИЗОНТАЛЬНА НА ДЕСКТОПІ (гілка `feat/product-modal-horizontal`)

Мета: на десктопах та альбомних планшетах (≥1024px) розкрита картка товару —
горизонтальна: фото зліва, решта справа; ширина картки = ширина контенту меню.
Мобільна версія не змінюється.

### 10.1 Інфраструктура (виконано)
- [x] Новий SSR-safe `hooks/use-media-query.ts` (`useSyncExternalStore`, серверний снапшот `false` — без hydration mismatch).

### 10.2 Desktop/альбомний планшет (виконано)
- [x] `ProductModal`: з ≥1024px рендериться горизонтальна картка `max-w-4xl` (як контент меню), **фіксованої висоти у форматі 16:9** (`aspect-[16/9]`, для 896px → 504px), по центру екрана, `rounded-3xl`.
- [x] Зліва (~46%) — фото-блок **4:3 впритул до верху та лівого краю** секції (без внутрішніх відступів; скруглені кути лише зверху-зліва та знизу-справа), під ним секція «Ідеально смакує разом» (горизонтальний rail). Справа — контент-колонка.
- [x] Справа: закріплена зверху шапка «назва + ціна», під нею скрол-область (опис/інгредієнти), знизу — закріплений футер (кількість + «Додати в кошик»); close-кнопка вгорі праворуч картки.
- [x] Ефект «напливу назви над фото при скролі» (title-float) вимкнено на десктопі (гейт `isWide`) і працює лише у мобільній версії.

### 10.3 Mobile (<1024px) (виконано)
- [x] Розкладка не змінюється: bottom-sheet, фото 4:3 зверху, title-float, скрол-контент, футер.

### 10.4 Перевірки (виконано)
- [x] `npm test` (163), `npx tsc --noEmit`, `npm run lint`, `npm run build` — чисто.
- [x] Headless-перевірка геометрії: desktop 1440×900 — модалка 896×504 (ratio 1.778 = 16:9); зліва колонка 412px, фото-блок 4:3 371×278 по центру; справа контент-колонка 484px; mobile 390×844 — bottom-sheet 390px з фото 4:3 зверху.
- [ ] Ручна візуальна перевірка користувача (десктоп + альбомний планшет).

---

## Журнал змін плану

| Дата | Що змінено | Ким |
|---|---|---|
| 2026-09-05 | Готові QR-коди: таблиця `qr_codes` (RLS адмін, міграція live), кнопка «Зберегти QR» (upsert за table_number), секція-список карток «Столик N» з видаленням. 164 тести, tsc, lint — чисто | Kilo |
| 2026-09-05 | QR-завантаження: PNG високої якості (2048px) та SVG (вектор) у брендових кольорах. tsc, lint — чисто | Kilo |
| 2026-09-05 | Номер столика в шапці меню та привітанні: колонка `cafe_info.show_table_number` (міграція застосована), перемикач у QR-генераторі, у хедері «Столик N», у greeting-тості рядок «Ваш столик - N» (за ?table=N). 164 тести, tsc, lint, build — чисто | Kilo |
| 2026-09-05 | Генератор QR (desktop/альбомний планшет): секція = висоті сайдбара (права колонка lg+ flex, картка flex-1), QR-контейнер зменшено (176/192px). tsc, lint — чисто | Kilo |
| 2026-09-05 | Підказки під заголовками «Категорії»/«Меню» в налаштуваннях (коли є дані): короткий тап [⋮] → редагувати/видалити, затиснути й перемістити → порядок (інлайн-іконка кебаба, uk/hu/en). 164 тести, tsc, lint — чисто | Kilo |
| 2026-09-05 | Налаштування меню: прибрано фільтр-пілс «Всі» (лише категорії, дефолт — перша категорія; синхронізація при зміні категорій); грид страв завжди перетягується. 164 тести, tsc, lint — чисто | Kilo |
| 2026-09-05 | Привітання клієнта/адміна: замість попапів — greeting-тости (темний фон #3E2F26, світлий текст, золота іконка Coffee/Sparkles) у `Toast` (+`showGreetingToast`); тригери раз на сесію збережені; попап-модалки прибрано. 164 тести, tsc, lint — чисто | Kilo |
| 2026-09-05 | Empty-state головного меню (немає категорій): іконка кави + «Меню скоро з'явиться» + підказка (uk/hu/en); картки в налаштуваннях меню: у страв прибрано назву категорії та збільшено ціну, у категорій — назва лише обраною мовою. 163 тести, tsc, lint — чисто | Kilo |
| 2026-09-05 | Фікс (Фаза 10): свайп рекомендованих страв ламався після переходу на рекомендовану страву — keyed `<AnimatePresence popLayout>` на діалозі продукту викликав `ref(null)` на `recScrollRef` після exit-анімації старої модалки. Прибрано keyed-ремоунт (контент оновлюється на тому самому вузлі). Перевірено: drag після переходу працює на десктопі та мобільному. 163 тести, tsc, lint — чисто | Kilo |
| 2026-09-05 | Фаза 10 — Горизонтальна розкрита картка товару (гілка `feat/product-modal-horizontal`, ≥1024px): `use-media-query`, `ProductModal` — desktop flex-row `max-w-4xl` (фото зліва на всю висоту, справа sticky назва+ціна, скрол-контент, футер знизу, close праворуч); title-float лише на mobile; mobile без змін. 163 тести, tsc, lint, build — чисто; геометрія перевірена headless. Лишилось: ручна візуальна перевірка | Kilo |
| 2026-09-04 | Фікс hydration mismatch (Фаза 9): `useAuth` більше не читає localStorage синхронно в ініціалізаторі `isAdmin` (клієнт рендерив «ключ адміна», а SSR — ні); старт `false` + відновлення через `onAuthStateChange` після гідрації. Тест оновлено. 163 тести, tsc, lint — чисто | Kilo |
| 2026-09-04 | Фаза 9 — Кешування меню (гілка `feat/menu-caching`): Варіант 1 — `/api/menu` віддає `textBanner`+`advertising`, підписки меню отримали `skipInitial` (SSR як джерело, Realtime лише для змін), `useMenuData`/`MenuContainer`/`AdPopup` сідяться з SSR; Варіант 3 — tag `menu` на SSR-fetch, `POST /api/revalidate` (перевірка адміна через RLS) + `triggerMenuRevalidation()` після всіх записів, `/api/menu` → no-store. 163 тести, tsc, lint, build — чисто; браузер: 0 клієнтських rest/v1 SELECT (лише realtime), 0 console-errors | Kilo |
| 2026-09-04 | Назва «попап в меню» → «фотобанер» по всьому застосунку (uk «Фотобанер», hu «Fotó banner», en «Photo banner»): заголовки/кнопки/підказки рекламного блоку в UI адмінки, список особливостей, коментарі коду/схеми; інші попапи (welcome/greeting/кроп/не-адмін) не чіпались. Оновлено проектні документи: CHANGELOG, PLAN, knowledge.md. tsc, lint — чисто | Kilo |
| 2026-09-04 | Реклама: прикріплення страви до фотобанера (як у text_banner) — колонки `advertising.category_id`/`product_id` (міграція `20260904150000_advertising_product_link.sql`, live-БД застосовано), UI в адмін-дрaвері (категорія→страва), клік по фотобанеру відкриває страву (AdPopup + MenuContainer), переклади uk/hu/en, +тест AdPopup (163). tsc, lint, build — чисто | Kilo |
| 2026-09-04 | Консоль `/admin`: прев'ю банер/лого в кабінеті — `loading="eager"` (LCP warning для `cafe/banner.webp` прибрано); після входу чиститься hash з токенами з URL (gotrue stale-session warning). 162 тести, tsc, lint — чисто | Kilo |
| 2026-09-04 | Фікс drag & drop (Фаза 8): картки повертались на старе місце — на drop зберігали початковий from/to замість live-порядку (`SortableActionCardGrid` тепер комітить `displayIds`); список страв в адмінці додатково сортується за `sortOrder`. 162 тести, tsc, lint — чисто | Kilo |
| 2026-09-04 | TextBanner (меню): прибрано назву прив'язаної страви та стрілку — банер показує лише текст адміна; перехід на товар по кліку збережено. Прибрано проп `getProductName` у TextBanner/MenuContainer + тести. 162 тести, tsc, lint — чисто | Kilo |
| 2026-09-04 | Фаза 8 — Порядок категорій і страв (drag & drop в адмінці, гілка `feat/drag-reorder`): колонки `sort_order` (міграція `20260904120000_add_sort_order.sql`, застосовано до live-БД + backfill), dnd-kit-сітка `SortableActionCardGrid` (long-press на кебабі), `reorderCategories/reorderProducts`, `.order('sort_order')` у читаннях та `/api/menu`, debounce realtime, `lib/reorder.ts` + 11 тестів. 162 тести, tsc, lint, build — чисто. Лишилось: ручна перевірка drag в адмінці | Kilo |
| 2026-09-04 | Фаза 7.32 (уточнення): у напливі над фото рядок «назва + ціна» зупиняється за 16 px від нижньої межі фото (нова константа `TITLE_FLOAT_BOTTOM_GAP` у `lib/title-float.ts`) — раніше був упритул; градієнт тепер вкриває рядок разом із відступом. Тести оновлено (ті самі 7 кейсів, інші очікування cloneBottom/gradientHeight). 151 тест, `tsc --noEmit`, lint — чисто | Kilo |
| 2026-09-04 | Performance-фікс: додано проп `sizes` усім `next/image` з `fill` (консольні попередження браузера у меню «Image … has fill but is missing sizes prop»). `sizes` підібрано за контейнерами: хедер-лого/лого входу (176–240px), категорії та товари в 2-колонковій сітці (46vw/424px), HeroBanner (100vw/896px), фото в ProductModal (100vw/512px + 112px для рекомендованих), мініатюри кошика/карток (96px), міні-категорія (36px), AdPopup (240/320px), NotAdminModal (128px), аватар (24px), прев'ю банер/лого/реклама в адмінці. 151 тест, `tsc --noEmit`, lint — чисто. CHANGELOG 0.4.0 → Changed | Kilo |
| 2026-09-04 | Користувач підтвердив усі ручні перевірки адмінки: Google-вхід + збереження даних (6.5), збереження налаштувань реклами з Storage-фото (7.4), повторне відкриття оригіналу фото в масштабі 1 (7.5). У PLAN.md не лишилось жодного відкритого пункту `[ ]` | Kilo |
| 2026-09-04 | Фаза 7.32 — Назва і ціна в розкритій картці страви напливають над фото при скролі: чиста геометрія `lib/title-float.ts` (computeTitleFloat) + оверлей у `ProductModal` (світла копія рядка + затемнюючий градієнт, що «пропагується» знизу фото рівно на висоту рядка), cross-fade з оригінальним рядком, опис ховається під фото як раніше. 7 тестів; 151 тест, tsc, lint, build — чисто. Робота в гілці `feat/product-modal-title-overlay`, ще не влита | Codebuff |
| 2026-09-04 | Фаза 7.31 завершена: `npm run backfill:photos` виконано (service-role) — 6 об'єктів у Storage, 3 рядки оновлено (cafe_info banner/logo, advertising photo/photo_original, категорія); перевірено публічні URL і HTTP 200. Старі Unsplash-фото не чіпались | Codebuff |
| 2026-09-04 | Фази 7.30+7.31 задеплоєно: коміт `425a4a7` у `main` і `production` (Vercel деплоїть); міграцію `20260904100000_photo_storage.sql` застосовано до live-БД (`supabase db push`) — бакет `menu-photos` існує, публічне читання працює (404 "Object not found" для відсутнього об'єкта). Лишилось: `npm run backfill:photos` із service-role ключем (за користувачем) | Codebuff |
| 2026-09-04 | Фаза 7.31 — Фото в Supabase Storage: `lib/photo-storage.ts` (детерміновані шляхи, хелпери), `lib/supabase.ts` (`storeOrKeep`: data-URI → Storage-URL при збереженні з фолбеком на inline, якщо бакета нема), міграція бакета `menu-photos` + RLS (читання публічне, запис — адмін), `scripts/backfill-photos.mjs` (service role), remotePattern для `next/image`, 7 тестів. 144 тести, tsc, lint, build — чисто. Live-БД не чіпали — застосування міграції й бекап за користувачем | Codebuff |
| 2026-09-04 | Фаза 7.30 — CI workflow: `.github/workflows/ci.yml` — на push/PR у `main` GitHub Actions проганяє `npm test` (137), `npx tsc --noEmit`, `npm run lint`, `npm run build` (Node 22, npm-кеш; env не потрібен). Локально весь ланцюжок чистий | Codebuff |
| 2026-09-04 | Закрито застарілі пункти плану автоматичними перевірками: (7.4) міграції до live-БД — `supabase migration list --linked`: усі 16 Local == Remote; (7.4) показ фотобанера — Playwright-проба на фінальному коді (десктоп 1280px: банер ~9 с, картка видима, 0 помилок). Пункти, що потребують адмін-входу (6.5 Google-вхід, 7.4 збереження налаштувань реклами, 7.5 повторне відкриття оригіналу фото), позначено як ручні перевірки користувача | Codebuff |
| 2026-09-04 | Фаза 7.29 — Фотобанер у меню: (1) гонка StrictMode — спільний `timerRef` дозволяв «мертвій» підписці після cleanup скинути таймер «живої» (таймер став локальним для запуску ефекту); (2) CSS — `sm:w-auto` без потокового контенту схлопував картку до ~2px на десктопі (тепер `sm:w-[240px]`). Регресійний тест на StrictMode-гонку. 137 тестів, tsc, lint — чисто | Codebuff |
| 2026-09-04 | Фаза 7.28 — Фікс деплою на Vercel після апгрейду Next 16: всі деплої падали з `ENOENT .next/next-server.js.nft.json` через `output: 'standalone'` у `next.config.ts` (пережиток Cloud Run; відомий баг Next 16.3 — vercel/next.js #96646). Видалено standalone-опцію; локальна збірка й перевірки чисті | Codebuff |
| 2026-09-04 | Фаза 7.27 — Тости в палітрі застосунку (без зелених/червоних «системних» кольорів; на десктопі — праворуч знизу, на мобільних — по центру на всю ширину) + підсвічування незаповнених обов'язкових полів у формах зміни пароля (екран відновлення та налаштування). 136 тестів, tsc, lint — чисто | Kilo |
| 2026-09-02 | Фаза 7.19 — Виправлення футера в меню: контейнер → `flex flex-col`, `<main>` → `flex-1` — футер притискається до низу екрана. Адмінка, налаштування закладу: поля «Назва закладу» і «Instagram» на одному рівні на десктопі (невидимий бейдж-спейсер). 136 тестів, typecheck, lint — чисто | Kilo |
| 2026-09-02 | Фаза 7.20 — Google-вхід: адмін одразу в кабінеті. `loginWithGoogle` редиректить на `/admin`; прибрано `PENDING_ADMIN_REDIRECT_KEY` з `lib/supabase.ts`, `app/admin/page.tsx`, `MenuContainer.tsx`. Не-адмін викидається в меню через `handleAuthUser`. 136 тестів, typecheck, lint — чисто | Kilo |
| 2026-09-02 | Фаза 7.21 — Сторінка входу в кабінет: прибрано мигання стороннього логотипа (кавова чашка `Coffee`). Fallback-заглушку замінено на пустий спейсер тих самих розмірів — тепер відображається лише завантажений клієнтом логотип. 136 тестів, typecheck, lint — чисто | Kilo |
| 2026-09-02 | Фаза 7.22 — Сторінка входу: прибрано мигання назви «Світ Кави QR Меню» замість «Світ Кави». Назва рендериться лише коли `cafeInfo` завантажений. 136 тестів, typecheck, lint — чисто | Kilo |
| 2026-09-03 | Фаза 7.23 — Апгрейд Next.js 15.5.23 → 16.3.4 (гілка `upgrade/next-16`): codemod, Turbopack-білд дефолт, видалено eslint-опцію і webpack-хук з next.config, ESLint відкотито до ^9 (несумісність плагінів eslint-config-next), видалено `instant = false`. Build успішний, 136 тестів, tsc, lint — чисто | Kilo |
| 2026-09-03 | Фаза 7.24 — Перемикачі привітань: admin welcome-попап показувався завжди (fallback на статичний текст при вимкненому тумблері) — виправлено гейтингом за `greetingAdminEnabled` + усунено гонку; `/api/menu` віддає greeting-поля (SSR не конфліктує з кешем). e2e Playwright, 136 тестів, tsc, lint — чисто | Kilo |
| 2026-09-03 | Фаза 7.25 — Налаштування закладу: 2-колонкові рядки на десктопі — «Назва»+«Слоган», «Instagram»+«Власник»; вирівняно заголовки/паддінги пар. 136 тестів, tsc, lint — чисто | Kilo |
| 2026-09-03 | Фаза 7.26 — Видалення категорії зі стравами: попередження в ConfirmModal з кількістю страв + підтвердження (замість блокування тостом); ConfirmModal отримав проп `warning`; переклади uk/hu/en. 136 тестів, tsc, lint — чисто | Kilo |
| 2026-08-29 | Фаза 7 — Фотобанер: таблиця `advertising`, RLS+realtime, міграція; адмін-вкладка (фото 9:16, затримка, on/off); клієнтський фотобанер `AdPopup` у `MenuContainer`; переклади uk/hu/en; 108 тестів, typecheck, lint — чисто. Чекає застосування міграції до live-БД | Kilo |
| 2026-08-29 | Фаза 7.5 — Повторне кадрування з оригіналу: для секцій фото (банер/лого/категорія/реклама) зберігається до-кроп оригінал (`*_original`); повторне відкриття на редагування показує оригінал у масштабі 1. Міграція `20260829160000_photo_originals.sql` (застосовано). 113 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-29 | Фаза 7.6 — Поле «Показувати до:» (дата) для фотобанера: колонка `show_until`, збереження/читання, показ фотобанера лише до дати; переклади uk/hu/en. Міграція `20260829170000_advertising_show_until.sql` (застосовано). 116 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-29 | Фаза 7.7 — Кастомний дейтпікер (`DatePicker`) замість нативного поля дати; локалізація uk/hu/en, стиль проєкту; застосовано до «Показувати до:». 116 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-29 | Фаза 7.8 — Кадрування фото товару: кроп 4:3 перед збереженням, редагування/видалення, зберігання оригіналу (`products.photo_original`). Міграція `20260829190000_product_photo_original.sql` (застосовано). 118 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-29 | Фаза 7.9 — Реструктуризація секції «Фотобанер»: заголовок + повний опис + кнопка «Додати фотобанер»; функціонал створення фотобанера перенесено в сайдбар справа (`AdminDrawer`). 118 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-29 | Фаза 7.10 — Оформлення секції «Фотобанер»: кнопка «Додати фотобанер» на всю ширину і світліша; опис — маркований список особливостей (`ADVERTISING_FEATURES`, uk/hu/en). 118 тестів, typecheck, lint — чисто | Kilo |
| 2026-08-29 | Фаза 7.11 — Текстовий банер: таблиця `text_banner` (міграція `20260829200000_text_banner.sql`, застосовано) + тип/функції/валідація; адмін-секція «Текстовий банер» з сайдбаром (текст+емодзі, лінк категорія→товар, on/off); стікі банер у меню (повна ширина, пол. висоти хедера, хрестик, перехід на товар). 128 тестів, typecheck, lint — чисто | Kilo |
| 2026-09-02 | Фаза 7.12 — Секція «Привітання» в налаштуваннях закладу: поля привітання клієнтів/адміна + тумблери ввімкнення; показ у HeroBanner і welcome-попапі адміна; колонки `greeting_*` у `cafe_info` (міграція `20260902100000_cafe_greetings.sql`, застосовано). 131 тест, typecheck, lint — чисто | Kilo |
| 2026-09-02 | Фаза 7.13 — Багаторядкові привітання: поля → textarea (кілька привітань через `;`), випадковий показ через `getRandomGreeting` у HeroBanner та admin-popup; ліміт 2000; 135 тестів, typecheck, lint — чисто | Kilo |
| 2026-09-02 | Фаза 7.14 — Перенесення hardcoded-привітань у БД: клієнтське (`welcome`) та адмінські (`welcomeMsg1..5`) в `cafe_info.greeting_*`; міграція `20260902110000_seed_cafe_greetings.sql` (застосовано), оновлено seed; показ з БД. 135 тестів, typecheck, lint — чисто | Kilo |
| 2026-09-02 | Фаза 7.15 — Розділення привітань переносом рядка: `getRandomGreeting` ділить за `\n` (сумісно з `;`); міграція `20260902120000_greeting_newline_separator.sql` (застосовано), seed + плейсхолдери оновлено. 136 тестів, typecheck, lint — чисто | Kilo |
| 2026-09-02 | Фаза 7.16 — Keep-alive: `vercel.json` зі щоденним cron (08:00 UTC) на `/api/menu`, який робить запити до Supabase — проєкт не «засинає»; прогрів serverless. Перевірено: конфіг валідний. 136 тестів, typecheck, lint — чисто | Kilo |
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
| 2026-08-28 | Вкладка «Категорії»: форма додавання/редагування категорії перенесена у сайдбар `AdminDrawer` (виїжджає справа, як кошик). На вкладці — лише список категорій і кнопка «Додати категорію». Перевірено в браузері (відкриття, закриття, редагування). 95 тестів, typecheck, lint — чисто | Kilo |
| 2026-09-02 | Фаза 7.17 — Google-вхід: не-адмін → на головну. `loginWithGoogle` редіректить на `/`; `MenuContainer` чистить pending-прапорець для всіх, а в `/admin` пускає лише адміна; очищено pending-ключ у гілці «не адмін». 136 тестів, typecheck, lint — чисто | Kilo |
| 2026-09-02 | Фаза 7.18 — Слоган у HeroBanner + клієнтський greet-попап: під назвою закладу показується слоган (опис), привітання клієнтів — попапом раз на сесію з випадковим текстом з БД. 136 тестів, typecheck, lint — чисто | Kilo |
