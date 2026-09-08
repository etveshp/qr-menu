# AUDIT.md — Аудит проєкту «Світ Кави QR Меню» (Supabase + Vercel)

**Дата:** 2026-09-08 (поновлено, стан `main` @ `604e92c`)
**Тип:** аудит чистоти коду (мертвий код, дублювання, сміття) + аудит безпеки веб-додатку.

> Це оновлення попереднього аудиту: з моменту його створення (коміт `370e6a9`) у код уже влито
> 6 комітів виправлень Фази 14 (`38f222b`, `b0f2474`, `8edd8e3`, `a939706`, `5bb921a`, `604e92c`).
> Нижче — фактичний стан: що підтверджено виправленим, а що лишилось (вкл. нові знахідки).

---

## 0. Методологія та статус автоперевірок (свіжі)

| Перевірка | Результат |
|---|---|
| `npx tsc --noEmit` | ✅ 0 помилок |
| `npm run lint` | ✅ 0 попереджень (але не ловить мертві value-імпорти — див. R10) |
| `npm audit` (prod + dev) | ✅ 0 вразливостей |
| `npm test` (Vitest) | ✅ **163/163 тестів, 21 файл** (`v4.1.11`) |
| `.env.local` у git | ✅ ігнорується (`.gitignore`), секретів у репозиторії немає |
| CI | ✅ `.github/workflows/ci.yml` — tests + typecheck + lint + build |

⚠️ **Розбіжність документації:** у PLAN.md (Фаза 13) та попередньому AUDIT.md заявлено «167 тестів / 22 файли»;
фактично зараз **163 / 21**. Різниця — побічний ефект видалення мертвих тестів/модулів під час Фази 14.
Потребує синхронізації документації (див. D12).

---

## 1. Безпека

### 1.1. Виправлено з попереднього аудиту ✅

| # | Було | Стан зараз |
|---|---|---|
| S1 (частина) | Немає security headers | ✅ `next.config.ts:31-38` `headers()`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, CSP — застосовано до `/(.*)`. **Але CSP послаблений — див. N1.** |
| S2 | `email_registered()` доступний anon | ✅ міграція `20260908100000_fix_email_registered_anon.sql` — `revoke from anon, public; grant to authenticated`. |
| S3 | `is_admin_true()` використовується до створення | ✅ `supabase-schema.sql:119` — функцію перенесено **перед** RLS-політиками (перше використання на ряд. 169). |
| S4 | `/api/translate` без rate-limit | ✅ `app/api/translate/route.ts:5-19` — in-memory rate-limit (20/хв/IP) + ліміт тіла 10 000 символів. |
| S6 (частина) | Широкі `remotePatterns` | ✅ `next.config.ts:40-59` — `lwzmfrbgoivbhicwzepn.supabase.co` (проєкт-реф), `lh3.googleusercontent.com`. ⚠️ `images.unsplash.com` досі залишено. |
| S8 | `is_admin_true()` без найменших привілеїв | ✅ `supabase-schema.sql:128-129` — `revoke execute from anon, public; grant to authenticated`. |

### 1.2. Залишкові та нові знахідки

| # | Критичність | Знахідка | Рекомендація |
|---|---|---|---|
| **N1** | **HIGH** 🆕 | **CSP нейтралізований.** `next.config.ts:22` — `script-src 'self' 'unsafe-inline' 'unsafe-eval'`. `'unsafe-eval'`+`'unsafe-inline'` у `script-src` роблять захист від XSS практично марним (введено комітом `b0f2474` «for React dev mode», але застосовано до **prod** деплою). | Прибрати обидва токени з prod: `script-src 'self'` (Next 16 у прод-білді не потребує inline/eval). Якщо потрібен dev-mode, додавати `'unsafe-eval'` лише за `process.env.NODE_ENV === 'development'`. |
| S7 | MEDIUM | `ADMIN_EMAILS` хардкод у `lib/supabase.ts:186` (`'svitkavyvisk@gmail.com'`) — потрапляє в публічний JS-бандл. | Перевірку залишити на `profiles.is_admin` через RLS (вже є `hasAdminAccess`); email-список прибрати з клієнта або винести в server-side. |
| S6 (залишок) | LOW | `images.unsplash.com` у `remotePatterns` (плейсхолдери більше не потрібні після переходу на Storage). | Видалити, залишивши лише проєктний Supabase-хост і `lh3.googleusercontent.com`. |
| S5 | LOW | Частина write-політик (не `is_admin_true()`) може все ще використовувати `auth.uid() in (select ...)` — прибрано не скрізь. | Уніфікувати всі write-політики на `is_admin_true()`. |

---

## 2. Сміття та мертвий код

### 2.1. Виправлено ✅

| # | Було | Стан |
|---|---|---|
| G1 | `supabase/.temp/` закомічено | ✅ `.gitignore` містить `supabase/.temp/`, у git не відстежується, на диску відсутнє. |
| G2 | `@hookform/resolvers` | ✅ видалено з `package.json`. |
| G3 | `lib/utils.ts` + `clsx` + `tailwind-merge` | ✅ видалено (файл зник, залежності зникли). |
| G5 | `.freebuff/` закомічено | ✅ `.gitignore` + на диску відсутнє. |
| G6 (частина) | `useSupabase` | ✅ видалено (0 збігів). |
| G7 (частина) | Firebase legacy-блок (`auth/invalid-email`…) | ✅ видалено з `lib/errors.ts`. |

### 2.2. Залишкові та нові знахідки

| # | Критичність | Знахідка | Рекомендація |
|---|---|---|---|
| **N2** | MEDIUM 🆕 | **`components/admin/SaveButton.tsx` — мертвий компонент.** Створено (D3), але `<SaveButton>` не використовується **ніде**; імпорт `admin/page.tsx:85` — мертвий value-імпорт, який не ловить ні `tsc`, ні ESLint. | Або повністю впровадити (замінити 7–9 інлайн save-кнопок), або видалити файл разом з імпортом. |
| G6 (залишок) | LOW | `incrementCartItem` (`lib/cart.ts:13`), `dataUriToBase64` (`lib/photo-storage.ts:41`), `storagePathFromPublicUrl` (`lib/photo-storage.ts:51`) — використовуються **лише у власних тестах**. `triggerAddToCartHaptic` (`lib/sound.ts:20`) — жива (всередині `playAddToCartChime`), але `export` надлишковий. | Видалити або позначити як тест-тільки; для `triggerAddToCartHaptic` прибрати `export`. |
| G7 (залишок) | LOW | `lib/errors.ts:56-76` — «Shared codes» `auth/invalid-credential`, `auth/popup-closed-by-user`, `auth/cancelled-popup-request`, `auth/too-many-requests` — це Firebase-коди, на Supabase (redirect-потік, не popup) ймовірно мертві. | Уточнити, які реально повертаються; зайві видалити. |
| G4 | LOW | Дискове сміття (в git не потрапляє, `.gitignore` покриває): `tsconfig.tsbuildinfo`, `coverage/`, `.next/`, `test-results/`, `.playwright-mcp/`. | Видалити з робочої теки (`next clean` + rm). |
| R10 | LOW 🆕 | ESLint не сконфігуровано на `no-unused-vars` — мертві імпорти (що й `tsc` без `noUnusedLocals`) прослизають. | Додати `@typescript-eslint/no-unused-vars` і `noUnusedLocals` у `tsconfig.json`. |

---

## 3. Дублювання

| # | Критичність | Знахідка | Стан |
|---|---|---|---|
| D1 | HIGH | `app/admin/page.tsx` — моноліт | ⚠️ Частково: **4114 → 3839 рядків** (винесено `useImageCrop`), але все ще моноліт. |
| D2 | HIGH | 5 копій crop-станів | ✅ `hooks/use-image-crop.ts` створено, 6 застосувань у admin. |
| D3 | HIGH | 7–9 копій save-кнопки | ⚠️ Компонент `SaveButton.tsx` створено, але **не впроваджено** (див. N2). |
| D4 | HIGH | QR-download × 2 | ⚠️ Частково: спільний `triggerDownload` (`lib/photo-storage.ts:57`) використано в `admin/page.tsx:84`, але: (1) `QrGenerator.tsx:46` має **локальну копію** `triggerDownload`; (2) `admin/page.tsx:149-258` `SavedQrDownload` досі дублює `downloadPngHi`/`downloadSvg` з `QrGenerator.tsx:57-91`. |
| D5 | HIGH | Мапери в `/api/menu` | ✅ `app/api/menu/route.ts:4,30-34` — імпортує `mapCafeInfo/mapCategory/mapProduct` з `lib/supabase.ts`. |
| D6 | HIGH | Focus-trap × 3 | ✅ `hooks/use-focus-trap.ts`, застосовано в `CartDrawer`, `ProductModal`, `AdminDrawer`. |
| D8 | MEDIUM | Badge-радіогрупа інлайн | ✅ `<BadgeRadioGroup>` використовується 2× (admin/page.tsx:3449, 3593). |
| D9 | MEDIUM | Авторизація × 2 | ⚠️ Частково: `hooks/use-auth.ts` тепер з `onNonAdmin` callback (використовується в `MenuContainer`), але `admin/page.tsx` має **власну** адмін-авторизацію. |
| D7/D10/D11 | MEDIUM/LOW | Drag-to-scroll × 2; `use-cart` add/increment; add-to-cart у ProductModal | Не верифіковано повторно — ймовірно в силі. |

---

## 4. Реакт-проблеми та баги

| # | Критичність | Знахідка | Стан |
|---|---|---|---|
| R1 | HIGH | `ProductModal` early-return до `AnimatePresence` | ✅ Виправлено (`AnimatePresence` на рівні компонента, ряд. 303/501; єдиний `return` — всередині `useEffect`). |
| R4 | MEDIUM | `any`-типи | ⚠️ Частково: **20+ → ~12** залишкових збігів. |
| R2 | MEDIUM | `setTimeout` без cleanup | ⚠️ Не до кінця: 9 `setTimeout` у admin/page.tsx ще лишились. |
| R3/R5/R6/R7/R8/R9 | MEDIUM/LOW | rAF-тротлінг скролу; `setTimeout(0)`; `hasAdminAccess` без cancelled; `key={idx}`; неконсистентність оверлеїв; legacy-типізація `t` | Не верифіковано повторно — ймовірно в силі. |

---

## 5. Інфраструктура та залежності

| # | Критичність | Знахідка | Стан |
|---|---|---|---|
| I1 | MEDIUM | `@types/qrcode`, `postcss`, `autoprefixer` у dependencies | ✅ Перенесено в `devDependencies` (`package.json`). |
| I2 | MEDIUM | Vitest coverage exclude завеликий | ⚠️ В силі: `vitest.config.ts:15-33` досі виключає майже всі UI-компоненти. |
| I2′ | LOW 🆕 | Попередження Vitest: «ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1)» — майбутня несумісність (`configLoader: native`). | Перейменувати в `vitest.config.mts` або додати `"type": "module"`. |
| I3 | LOW | `optionalDependencies` з Windows-бінарниками | ⚠️ В силі. |
| I4–I7 | OK | CI, backfill-скрипт, `vercel.json`, strict tsconfig | ✅ Без змін. |
| 14.22 | OK | `metadataBase` | ✅ Додано (`app/layout.tsx:26`). |
| 14.23 | OK | `.env.example` без `GITHUB_TOKEN`/`SUPABASE_SERVICE_ROLE_KEY` | ✅ Додано обидва x. |
| 14.24 | MEDIUM | `validateCafeInfo` без `showTableNumber`/`defaultLang` | ⚠️ Частково: `defaultLang` валідується (`lib/validation.ts:41`), `showTableNumber` — **ні**. |

---

## 6. Документаційна розсинхронізація 🆕

| # | Критичність | Знахідка |
|---|---|---|
| D12 | MEDIUM | **`PLAN.md` (Фаза 14) не оновлено** — усі пункти 14.1–14.25 досі `[ ]`, хоча більшість уже виправлено в коді (коміти `38f222b`…`604e92c`). `CHANGELOG.md` і `knowledge.md` не відображають виконану роботу, а поточна кількість тестів (163) не збігається з задокументованою (167). |

---

## 7. Підсумкова таблиця (актуальний стан)

| Категорія | Critical | High | Medium | Low |
|---|---|---|---|---|
| Безпека | 0 | 1 (N1 CSP) | 1 (S7) | 3 |
| Мертвий код/сміття | 0 | 0 | 1 (N2 SaveButton) | 4 |
| Дублювання | 0 | 1 (D1 моноліт, част.) | 2 | — |
| React-баги | 0 | 0 | 2 (част.) | 4 |
| Інфраструктура/док | 0 | 0 | 3 | 2 |

---

## 8. Рекомендації (за пріоритетом)

**Негайно (безпека):**
1. **N1 (HIGH)** — прибрати `'unsafe-eval'` та `'unsafe-inline'` з `script-src` у prod CSP; залишити `script-src 'self'` (додавати `unsafe-eval` лише в dev через `NODE_ENV`).
2. **S7** — прибрати `ADMIN_EMAILS` з клієнтського бандла; покладатися на `profiles.is_admin` (RLS).

**Найближчий етап (гігієна/якість):**
3. **N2** — вирішити долю `SaveButton`: впровадити в `admin/page.tsx` або видалити файл + мертвий імпорт; підтягнути `no-unused-vars`/`noUnusedLocals`, щоб таке не прослизало.
4. Завершити **D4** — винести `downloadPngHi`/`downloadSvg` спільними та прибрати локальну `triggerDownload` з `QrGenerator.tsx`.
5. Додати валідацію `showTableNumber` (14.24); видалити `images.unsplash.com` з `remotePatterns` (S6).
6. Дрібні dead exports (G6 залишок): `incrementCartItem`, `dataUriToBase64`, `storagePathFromPublicUrl`.

**Системно:**
7. **D12** — синхронізувати `PLAN.md` (позначити виконані 14.x), `CHANGELOG.md`, `knowledge.md` з фактичним станом і числом тестів 163.
8. Продовжити розбиття `admin/page.tsx` (3839 рядків → tab-компоненти + впровадження `SaveButton`).
9. Виправити попередження Vitest (`vitest.config.mts`) та поступово зменшувати coverage-exclude (I2).

---

*Аудит виконано на основі читання коду та автоперевірок; змін у код не внесено (оновлено лише цей звіт).*